import "server-only";
import { Prisma } from "@lib/generated/prisma/client";
import { prisma } from "@lib/prisma";
import { publicEnv } from "@lib/env";
import { catalogItemSchema, type CatalogItem, type CatalogPage } from "@lib/contracts/catalog";
import { matchesStock, type CatalogSource, type ListOptions } from "./source";
import { approvedReplacements, withReplacement } from "./product-images";
import { PRODUCT_IMAGE_BUCKET } from "./product-image-config";
import { byRelevance, correctedTerms, searchTerms } from "./search-query";

/**
 * The shop's own search index (table catalog_search). Square's search can't
 * look inside names like "Monkey.D.Luffy" or forgive a typo; this can.
 *
 * - syncSearchIndex copies every public product from the catalog source.
 * - searchIndex finds, ranks and pages results, then checks live stock for the
 *   page it returns, so a card that sold an hour ago isn't shown as available.
 */

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** How many matches to rank for one search. */
const MAX_CANDIDATES = 1000;
const PAGE_CHUNK = 40;
/** A sync that started this long ago and never finished is treated as dead. */
const SYNC_STALE_MS = 10 * 60_000;

export interface IndexStatus {
  itemCount: number;
  finishedAt: string | null;
  running: boolean;
  error: string | null;
}

export async function searchIndexStatus(): Promise<IndexStatus> {
  const row = await prisma.catalogSearchSync.findUnique({ where: { id: 1 } });
  const running = Boolean(row?.started_at && (!row.finished_at || row.started_at > row.finished_at) && Date.now() - row.started_at.getTime() < SYNC_STALE_MS);
  return { itemCount: row?.item_count ?? 0, finishedAt: row?.finished_at?.toISOString() ?? null, running, error: row?.error ?? null };
}

/** True once the index holds products; until then search falls back to the catalog source. */
export async function searchIndexReady(): Promise<boolean> {
  return (await prisma.catalogSearch.count({ take: 1 })) > 0;
}

/** Rebuilds the index from the catalog source. Safe to run at any time; readers never see it half-built. */
export async function syncSearchIndex(source: CatalogSource): Promise<{ itemCount: number }> {
  const status = await searchIndexStatus();
  if (status.running) throw new Error("A search index refresh is already running.");
  await prisma.catalogSearchSync.update({ where: { id: 1 }, data: { started_at: new Date(), error: null } });
  try {
    const items = await source.listAll();
    // An empty answer almost certainly means the catalog couldn't be read: keep the old index.
    if (items.length === 0) throw new Error("The catalog returned no products.");
    const now = new Date();
    const rows = items.map((item) => ({
      item_id: item.itemId,
      variation_id: item.variationId,
      variation_ids: item.variationIds,
      name: item.name,
      description: item.description ?? "",
      sku: item.sku,
      category_id: item.categoryId ?? null,
      category_name: item.categoryName ?? null,
      image_urls: item.imageUrls ?? [],
      price_amount: Math.round(item.priceAmount),
      price_currency: item.priceCurrency,
      sold_out: item.soldOut,
      inventory_count: item.inventoryCount ?? null,
      name_folded: fold(item.name),
      search_text: fold(`${item.name} ${item.description ?? ""}`).slice(0, 4000),
      synced_at: now,
    }));
    // Duplicate IDs would fail the whole insert; keep the first.
    const unique = [...new Map(rows.map((r) => [r.item_id, r])).values()];
    await prisma.$transaction(
      async (tx) => {
        await tx.catalogSearch.deleteMany();
        for (let i = 0; i < unique.length; i += 500) await tx.catalogSearch.createMany({ data: unique.slice(i, i + 500) });
        await tx.catalogSearchSync.update({ where: { id: 1 }, data: { finished_at: new Date(), item_count: unique.length, error: null } });
      },
      { timeout: 120_000, maxWait: 20_000 }
    );
    return { itemCount: unique.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.catalogSearchSync.update({ where: { id: 1 }, data: { finished_at: new Date(), error: message.slice(0, 500) } });
    throw error;
  }
}

interface Row {
  item_id: string;
  variation_id: string;
  variation_ids: string[];
  name: string;
  description: string;
  sku: string;
  category_id: string | null;
  category_name: string | null;
  image_urls: string[];
  price_amount: number;
  price_currency: string;
  sold_out: boolean;
  inventory_count: number | null;
}

const COLUMNS = Prisma.sql`item_id, variation_id, variation_ids, name, description, sku, category_id, category_name, image_urls, price_amount, price_currency, sold_out, inventory_count`;

/** Rows where every term appears in the name or description. */
function exactMatches(terms: string[]): Promise<Row[]> {
  return prisma.$queryRaw<Row[]>`
    select ${COLUMNS} from public.catalog_search
    where not exists (select 1 from unnest(${terms}::text[]) as t(term) where search_text not like '%' || t.term || '%')
    limit ${MAX_CANDIDATES}`;
}

/**
 * Rows where every term is at least close to a word in the name (typos:
 * "charzard", "pikachoo"). Closest first.
 */
function fuzzyMatches(terms: string[]): Promise<Row[]> {
  return prisma.$queryRaw<Row[]>`
    select ${COLUMNS} from public.catalog_search
    where not exists (
      select 1 from unnest(${terms}::text[]) as t(term)
      where search_text not like '%' || t.term || '%'
        and (char_length(t.term) < 4 or extensions.word_similarity(t.term, name_folded) < 0.5)
    )
    order by (select sum(extensions.word_similarity(t.term, name_folded)) from unnest(${terms}::text[]) as t(term)) desc, name
    limit 200`;
}

/** Our cleaned copies of Square photos, keyed by the original URL. */
async function processedImages(urls: string[]): Promise<Map<string, string>> {
  if (urls.length === 0) return new Map();
  try {
    const rows = await prisma.productImage.findMany({ where: { source_url: { in: urls } }, select: { source_url: true, path: true } });
    const base = `${publicEnv().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
    return new Map(rows.map((r) => [r.source_url, base + r.path]));
  } catch (error) {
    console.error("Processed image lookup failed; using Square originals", error);
    return new Map();
  }
}

/** One page of search results from the index, best match first. The cursor is a position in the ranked list. */
export async function searchIndex(source: CatalogSource, query: string, options: ListOptions): Promise<CatalogPage> {
  const terms = searchTerms(query).filter((t) => t.length >= 2);
  if (terms.length === 0) return { items: [], cursor: null };

  let ranked: Row[];
  const exact = await exactMatches(terms);
  if (exact.length > 0) ranked = byRelevance(exact, terms, options.sort);
  else {
    // Typos: rank the close matches as if the words had been spelled the way the catalog spells them.
    const fuzzy = await fuzzyMatches(terms);
    ranked = byRelevance(fuzzy, correctedTerms(terms, fuzzy.map((r) => r.name)), options.sort);
  }

  const items: CatalogItem[] = [];
  let position = Math.max(0, Number(options.cursor) || 0);
  while (items.length < options.limit && position < ranked.length) {
    const chunk = ranked.slice(position, position + PAGE_CHUNK);
    // The index can be hours old; stock is checked live for what's about to be shown.
    const live = source.liveStock ? await source.liveStock(chunk.flatMap((r) => r.variation_ids)).catch(() => null) : null;
    const [images, replacements] = await Promise.all([
      processedImages(chunk.flatMap((r) => r.image_urls)),
      approvedReplacements(chunk.map((r) => r.item_id)),
    ]);
    for (const row of chunk) {
      position++;
      const count = live ? row.variation_ids.reduce((sum, id) => sum + (live.get(id) ?? 0), 0) : (row.inventory_count ?? undefined);
      const item = catalogItemSchema.parse({
        itemId: row.item_id,
        variationId: row.variation_id,
        name: row.name,
        description: row.description || undefined,
        imageUrls: withReplacement(row.image_urls.map((url) => images.get(url) ?? url), replacements.get(row.item_id)),
        sku: row.sku,
        priceAmount: row.price_amount,
        priceCurrency: row.price_currency,
        soldOut: live ? (count ?? 0) <= 0 : row.sold_out,
        categoryId: row.category_id ?? undefined,
        categoryName: row.category_name ?? undefined,
        inventoryCount: count,
      });
      if (matchesStock(item, options.stock)) items.push(item);
      if (items.length >= options.limit) break;
    }
  }
  return { items, cursor: position < ranked.length ? String(position) : null };
}
