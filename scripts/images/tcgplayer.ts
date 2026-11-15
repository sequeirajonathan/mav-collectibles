/**
 * Proposes better photos for card singles whose Square photo is missing or
 * low resolution, using TCGplayer's catalogue (via the tcgcsv.com mirror).
 *
 *   npx tsx scripts/images/tcgplayer.ts                 # needs IMAGE_REPLACE_TCGPLAYER=true
 *   npx tsx scripts/images/tcgplayer.ts --from-export --limit 50
 *
 * Every match is stored as "proposed". Customers see nothing until staff
 * approve it in Admin → Photos. Square is only read. Run after sync.ts, which
 * records each photo's size.
 *
 * Needs: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, and SQUARE_ACCESS_TOKEN
 * (unless --from-export).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { SquareClient, SquareEnvironment } from "square";
import { z } from "zod";
import { processImage } from "./process-image";
import { pickGroup, pickProduct, type TcgGroup, type TcgProduct } from "./tcg-match";
import { LOW_RES_PX, PRODUCT_IMAGE_BUCKET } from "../../lib/catalog/product-image-config";

/** Square singles categories → TCGplayer category IDs to search (first match wins). */
const SINGLES: Record<string, number[]> = {
  ZPLTFCCZRS3FENOS4324RK4E: [3, 85], // Pokémon singles: English, then Japanese
  NGKVLCPJP3KCNPDLFTDMQTNU: [1], // Magic singles
  QQS47L524ANFOBBRF2D6SESX: [68], // One Piece singles
};

interface Item {
  id: string;
  name: string;
  categoryId: string;
  imageId: string | null;
}

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set.`);
  return value;
}

async function itemsFromSquare(): Promise<Item[]> {
  const square = new SquareClient({
    environment: process.env.SQUARE_ENVIRONMENT === "sandbox" ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
    token: required("SQUARE_ACCESS_TOKEN"),
  });
  const items: Item[] = [];
  for await (const object of await square.catalog.list({ types: "ITEM" })) {
    if (object.type !== "ITEM" || !object.id || object.isDeleted || object.itemData?.isArchived) continue;
    const categoryId = object.itemData?.categories?.[0]?.id ?? object.itemData?.reportingCategory?.id ?? "";
    if (categoryId in SINGLES) {
      items.push({ id: object.id, name: object.itemData?.name ?? "", categoryId, imageId: object.itemData?.imageIds?.[0] ?? null });
    }
  }
  return items;
}

const exportSchema = z.object({
  objects: z.array(
    z.looseObject({
      id: z.string(),
      type: z.string(),
      itemData: z
        .looseObject({
          name: z.string().nullish(),
          isArchived: z.boolean().nullish(),
          imageIds: z.array(z.string()).nullish(),
          categories: z.array(z.looseObject({ id: z.string().nullish() })).nullish(),
          reportingCategory: z.looseObject({ id: z.string().nullish() }).nullish(),
        })
        .nullish(),
    })
  ),
});

async function itemsFromExport(): Promise<Item[]> {
  const file = path.join(process.cwd(), "square-export/catalog.json");
  const data = exportSchema.parse(JSON.parse(await readFile(file, "utf8")));
  return data.objects.flatMap((o) => {
    const categoryId = o.itemData?.categories?.[0]?.id ?? o.itemData?.reportingCategory?.id ?? "";
    return o.type === "ITEM" && !o.itemData?.isArchived && categoryId in SINGLES
      ? [{ id: o.id, name: o.itemData?.name ?? "", categoryId, imageId: o.itemData?.imageIds?.[0] ?? null }]
      : [];
  });
}

// --- TCGplayer catalogue (tcgcsv.com) ---------------------------------------
const groupsSchema = z.object({
  results: z.array(z.object({ groupId: z.number(), name: z.string(), abbreviation: z.string().nullable() })),
});
const productsSchema = z.object({
  results: z.array(
    z.object({
      productId: z.number(),
      name: z.string(),
      extendedData: z.array(z.object({ name: z.string(), value: z.string() })).default([]),
    })
  ),
});

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { "User-Agent": "product-photo-sync/1.0", Accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

const groupCache = new Map<number, Promise<TcgGroup[]>>();
const productCache = new Map<string, Promise<TcgProduct[]>>();
const groupsOf = (category: number) => {
  let cached = groupCache.get(category);
  if (!cached) {
    cached = getJson(`https://tcgcsv.com/tcgplayer/${category}/groups`).then((json) => groupsSchema.parse(json).results);
    groupCache.set(category, cached);
  }
  return cached;
};
const productsOf = (category: number, groupId: number) => {
  const key = `${category}/${groupId}`;
  let cached = productCache.get(key);
  if (!cached) {
    cached = getJson(`https://tcgcsv.com/tcgplayer/${key}/products`).then((json) =>
      productsSchema.parse(json).results.map((p) => ({
        productId: p.productId,
        name: p.name,
        number: p.extendedData.find((e) => e.name === "Number")?.value ?? null,
      }))
    );
    productCache.set(key, cached);
  }
  return cached;
};

async function findMatch(item: Item): Promise<{ product: TcgProduct; group: TcgGroup } | null> {
  for (const category of SINGLES[item.categoryId] ?? []) {
    const group = pickGroup(item.name, await groupsOf(category));
    if (!group) continue;
    const product = pickProduct(item.name, await productsOf(category, group.groupId));
    if (product) return { product, group };
  }
  return null;
}

// -----------------------------------------------------------------------------
const sizeRow = z.object({ square_image_id: z.string(), width: z.number(), height: z.number() });
const doneRow = z.object({ square_item_id: z.string(), square_image_id: z.string().nullable() });

async function main() {
  if (process.env.IMAGE_REPLACE_TCGPLAYER !== "true" && !flag("force")) {
    console.log("TCGplayer photo replacement is off (set IMAGE_REPLACE_TCGPLAYER=true to turn it on).");
    return;
  }
  const supabase = createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SECRET_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const limit = Number(option("limit") ?? Infinity);

  async function all<T>(table: string, columns: string, key: string, schema: z.ZodType<T>): Promise<T[]> {
    const rows: T[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from(table).select(columns).order(key).range(from, from + 999);
      if (error) throw new Error(`Couldn't read ${table}: ${error.message}`);
      rows.push(...z.array(schema).parse(data));
      if (data.length < 1000) return rows;
    }
  }

  const items = flag("from-export") ? await itemsFromExport() : await itemsFromSquare();
  const sizes = new Map((await all("product_images", "square_image_id, width, height", "square_image_id", sizeRow)).map((r) => [r.square_image_id, Math.max(r.width, r.height)]));
  const done = new Map((await all("image_replacements", "square_item_id, square_image_id", "square_item_id", doneRow)).map((r) => [r.square_item_id, r.square_image_id]));

  // Needs a better photo: none at all, or a processed photo under LOW_RES_PX.
  // Skip items already proposed/reviewed for the same Square photo.
  const candidates = items.filter((item) => {
    if (done.has(item.id) && done.get(item.id) === item.imageId) return false;
    if (!item.imageId) return true;
    const size = sizes.get(item.imageId);
    return size !== undefined && size < LOW_RES_PX;
  });
  console.log(`${items.length} singles, ${candidates.length} with a missing or low-resolution photo.`);

  // Staff uploaded a good photo to Square since: the replacement is no longer needed.
  const obsolete = items.filter((item) => {
    if (!done.has(item.id) || done.get(item.id) === item.imageId || !item.imageId) return false;
    return (sizes.get(item.imageId) ?? 0) >= LOW_RES_PX;
  });
  if (obsolete.length) {
    await supabase.from("image_replacements").delete().in("square_item_id", obsolete.map((i) => i.id));
    console.log(`Removed ${obsolete.length} replacements now covered by a new Square photo.`);
  }

  const counts = { proposed: 0, noMatch: 0, failed: 0 };
  for (const item of candidates) {
    if (counts.proposed >= limit) break;
    try {
      const match = await findMatch(item);
      if (!match) {
        counts.noMatch++;
        continue;
      }
      const { product, group } = match;
      const response = await fetch(`https://tcgplayer-cdn.tcgplayer.com/product/${product.productId}_in_1000x1000.jpg`, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`image download: HTTP ${response.status}`);
      const image = await processImage(Buffer.from(await response.arrayBuffer()), { card: true });
      // TCGplayer serves a small placeholder for products without a photo.
      if (Math.max(image.width, image.height) < LOW_RES_PX) {
        counts.noMatch++;
        continue;
      }
      const objectPath = `tcgplayer/${product.productId}.webp`;
      const upload = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(objectPath, image.data, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
      if (upload.error) throw new Error(`upload failed: ${upload.error.message}`);
      const saved = await supabase.from("image_replacements").upsert({
        square_item_id: item.id,
        square_image_id: item.imageId,
        item_name: item.name,
        source: "tcgplayer",
        source_ref: String(product.productId),
        source_name: product.name,
        source_set: group.name,
        path: objectPath,
        width: image.width,
        height: image.height,
        status: "proposed",
        reviewed_by: null,
        reviewed_at: null,
      });
      if (saved.error) throw new Error(`save failed: ${saved.error.message}`);
      counts.proposed++;
    } catch (error) {
      counts.failed++;
      console.warn(`  ${item.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  console.log(`Done: ${counts.proposed} proposed for review, ${counts.noMatch} without a confident match, ${counts.failed} failed.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
