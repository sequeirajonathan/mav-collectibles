import "server-only";
import type { Square } from "square";
import { createSquareClient, squareLocationIds } from "@lib/square";
import { isCatalogItem, normalizeItemsWithInventory, normalizeProductResponse } from "@utils/square";
import { catalogItemSchema, type CatalogItem, type CatalogPage, type Product } from "@lib/contracts/catalog";
import { serverEnv } from "@lib/env.server";
import sandboxMap from "@const/square-sandbox-map.json";
import { matchesStock, type CatalogSource, type IndexableItem, type ListOptions } from "./source";
import { approvedReplacements, withProcessedImages, withReplacement } from "./product-images";
import { isPublicCatalogItem } from "./visibility";
import { byRelevance, searchTerms, squareKeywords } from "./search-query";

/**
 * The app's category IDs (const/categories.ts) are production IDs. A sandbox
 * cloned with scripts/square/clone-catalog.ts has new IDs; translate both ways.
 */
const toSandbox = new Map(Object.entries(sandboxMap.categories as Record<string, string>));
const fromSandbox = new Map([...toSandbox].map(([prod, sandbox]) => [sandbox, prod]));
const sandboxIdsActive = () => serverEnv().SQUARE_ENVIRONMENT === "sandbox" && toSandbox.size > 0;

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastError;
}

/** Pages through Square search results until `limit` items pass the stock filter. */
async function collect(query: Square.CatalogQuery, options: ListOptions): Promise<CatalogPage> {
  const client = createSquareClient();
  const locations = squareLocationIds();
  const items: CatalogItem[] = [];
  let cursor: string | undefined = options.cursor;

  do {
    const page = await withRetry(() =>
      client.catalog.search({
        objectTypes: ["ITEM"],
        includeRelatedObjects: true,
        query: {
          ...query,
          sortedAttributeQuery: { attributeName: "name", sortOrder: options.sort === "name_desc" ? "DESC" : "ASC" },
        },
        limit: 100,
        ...(cursor ? { cursor } : {}),
      })
    );

    const catalogItems = (page.objects ?? []).filter(isCatalogItem);
    const variationIds = catalogItems.flatMap((item) =>
      (item.itemData?.variations ?? []).flatMap((v) => (v.id ? [v.id] : []))
    );
    const counts = variationIds.length
      ? await withRetry(() => client.inventory.batchGetCounts({ catalogObjectIds: variationIds, locationIds: locations }))
      : { data: [] };

    const inStock = new Map<string, number>();
    for (const count of counts.data ?? []) {
      if (count.catalogObjectId && count.state === "IN_STOCK") {
        inStock.set(count.catalogObjectId, (inStock.get(count.catalogObjectId) ?? 0) + Number(count.quantity ?? 0));
      }
    }

    const withInventory = catalogItems.map((item) => ({
      ...item,
      itemData: {
        ...item.itemData,
        variations: item.itemData?.variations?.map((v) => ({ ...v, inventory: v.id ? (inStock.get(v.id) ?? 0) : 0 })),
      },
    }));

    const related = await withProcessedImages(page.relatedObjects);
    const replacements = await approvedReplacements(catalogItems.flatMap((i) => (i.id ? [i.id] : [])));
    for (const raw of normalizeItemsWithInventory(withInventory, related)) {
      const normalized = { ...raw, imageUrls: withReplacement(raw.imageUrls, replacements.get(raw.itemId)) };
      const item = catalogItemSchema.parse(
        sandboxIdsActive() && normalized.categoryId
          ? { ...normalized, categoryId: fromSandbox.get(normalized.categoryId) ?? normalized.categoryId }
          : normalized
      );
      // Never list order records or items outside the shop's own categories.
      if (!isPublicCatalogItem({ name: item.name, description: item.description, categoryIds: [item.categoryId] })) continue;
      if (matchesStock(item, options.stock)) items.push(item);
    }
    cursor = page.cursor ?? undefined;
  } while (items.length < options.limit && cursor);

  const pageItems = items.slice(0, options.limit);
  return { items: pageItems, cursor: cursor && pageItems.length === options.limit ? cursor : null };
}

/** Square returns matches in name order; cap how many we pull in to rank. */
const SEARCH_CANDIDATE_PAGES = 6;
const SEARCH_CHUNK = 50;

/**
 * Search with the best matches first. Square's own search only orders by
 * name and also matches descriptions, so "charizard" would lead with a booster
 * pack whose description mentions it. Here every match is fetched (up to a
 * cap), ranked by how well its name fits, and only then filtered by stock and
 * cut into pages. The cursor is a position in that ranked list.
 */
async function searchRanked(query: string, options: ListOptions): Promise<CatalogPage> {
  const terms = searchTerms(query);
  const keywords = squareKeywords(terms);
  if (keywords.length === 0) return { items: [], cursor: null };

  const client = createSquareClient();
  const locations = squareLocationIds();
  const candidates: (Square.CatalogObject & { type: "ITEM" })[] = [];
  const related: Square.CatalogObject[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < SEARCH_CANDIDATE_PAGES; page++) {
    const result = await withRetry(() =>
      client.catalog.search({
        objectTypes: ["ITEM"],
        includeRelatedObjects: true,
        query: { textQuery: { keywords } },
        limit: 100,
        ...(cursor ? { cursor } : {}),
      })
    );
    for (const object of result.objects ?? []) {
      if (!isCatalogItem(object)) continue;
      const data = object.itemData;
      const categoryIds = [...(data?.categories ?? []).map((c) => c.id), data?.reportingCategory?.id].map((id) =>
        id && sandboxIdsActive() ? (fromSandbox.get(id) ?? id) : id
      );
      // Never list order records or items outside the shop's own categories.
      if (isPublicCatalogItem({ name: data?.name ?? "", description: data?.description, categoryIds })) candidates.push(object);
    }
    related.push(...(result.relatedObjects ?? []));
    cursor = result.cursor ?? undefined;
    if (!cursor) break;
  }

  const ranked = byRelevance(
    candidates.map((object) => ({ name: object.itemData?.name ?? "", object })),
    terms,
    options.sort
  );
  const relatedProcessed = await withProcessedImages(related);

  const items: CatalogItem[] = [];
  let position = Math.max(0, Number(options.cursor) || 0);
  while (items.length < options.limit && position < ranked.length) {
    const chunk = ranked.slice(position, position + SEARCH_CHUNK).map((entry) => entry.object);
    const variationIds = chunk.flatMap((item) => (item.itemData?.variations ?? []).flatMap((v) => (v.id ? [v.id] : [])));
    const counts = variationIds.length
      ? await withRetry(() => client.inventory.batchGetCounts({ catalogObjectIds: variationIds, locationIds: locations }))
      : { data: [] };
    const inStock = new Map<string, number>();
    for (const count of counts.data ?? []) {
      if (count.catalogObjectId && count.state === "IN_STOCK") {
        inStock.set(count.catalogObjectId, (inStock.get(count.catalogObjectId) ?? 0) + Number(count.quantity ?? 0));
      }
    }
    const replacements = await approvedReplacements(chunk.flatMap((i) => (i.id ? [i.id] : [])));

    // One at a time, so the page can stop exactly where it fills up.
    for (const object of chunk) {
      position++;
      const withInventory = {
        ...object,
        itemData: {
          ...object.itemData,
          variations: object.itemData?.variations?.map((v) => ({ ...v, inventory: v.id ? (inStock.get(v.id) ?? 0) : 0 })),
        },
      };
      for (const raw of normalizeItemsWithInventory([withInventory], relatedProcessed)) {
        const normalized = { ...raw, imageUrls: withReplacement(raw.imageUrls, replacements.get(raw.itemId)) };
        const item = catalogItemSchema.parse(
          sandboxIdsActive() && normalized.categoryId
            ? { ...normalized, categoryId: fromSandbox.get(normalized.categoryId) ?? normalized.categoryId }
            : normalized
        );
        if (matchesStock(item, options.stock)) items.push(item);
      }
      if (items.length >= options.limit) break;
    }
  }
  return { items: items.slice(0, options.limit), cursor: position < ranked.length ? String(position) : null };
}

/** Stock per variation across the shop's locations. */
async function stockCounts(client: ReturnType<typeof createSquareClient>, variationIds: string[]): Promise<Map<string, number>> {
  const inStock = new Map<string, number>();
  const locations = squareLocationIds();
  for (let i = 0; i < variationIds.length; i += 500) {
    const ids = variationIds.slice(i, i + 500);
    const pager = await withRetry(() => client.inventory.batchGetCounts({ catalogObjectIds: ids, locationIds: locations }));
    for await (const count of pager) {
      if (count.catalogObjectId && count.state === "IN_STOCK") {
        inStock.set(count.catalogObjectId, (inStock.get(count.catalogObjectId) ?? 0) + Number(count.quantity ?? 0));
      }
    }
  }
  return inStock;
}

/** Every public item with price, photos and stock, for the search index. */
async function listAllForIndex(): Promise<IndexableItem[]> {
  const client = createSquareClient();
  const objects: (Square.CatalogObject & { type: "ITEM" })[] = [];
  const related: Square.CatalogObject[] = [];
  let cursor: string | undefined;
  do {
    const page = await withRetry(() =>
      client.catalog.search({ objectTypes: ["ITEM", "IMAGE", "CATEGORY"], includeDeletedObjects: false, limit: 1000, ...(cursor ? { cursor } : {}) })
    );
    for (const object of page.objects ?? []) {
      if (isCatalogItem(object)) {
        if (!object.itemData?.isArchived) objects.push(object);
      } else related.push(object);
    }
    cursor = page.cursor ?? undefined;
  } while (cursor);

  const isPublic = (object: Square.CatalogObject & { type: "ITEM" }) => {
    const data = object.itemData;
    const categoryIds = [...(data?.categories ?? []).map((c) => c.id), data?.reportingCategory?.id].map((id) =>
      id && sandboxIdsActive() ? (fromSandbox.get(id) ?? id) : id
    );
    return isPublicCatalogItem({ name: data?.name ?? "", description: data?.description, categoryIds });
  };
  const visible = objects.filter(isPublic);
  const variationIdsOf = (object: Square.CatalogObject & { type: "ITEM" }) =>
    (object.itemData?.variations ?? []).flatMap((v) => (v.id ? [v.id] : []));
  const inStock = await stockCounts(client, visible.flatMap(variationIdsOf));

  const items: IndexableItem[] = [];
  for (const object of visible) {
    const withInventory = {
      ...object,
      itemData: {
        ...object.itemData,
        variations: object.itemData?.variations?.map((v) => ({ ...v, inventory: v.id ? (inStock.get(v.id) ?? 0) : 0 })),
      },
    };
    const [raw] = normalizeItemsWithInventory([withInventory], related);
    if (!raw) continue;
    const item = catalogItemSchema.parse(
      sandboxIdsActive() && raw.categoryId ? { ...raw, categoryId: fromSandbox.get(raw.categoryId) ?? raw.categoryId } : raw
    );
    items.push({ ...item, variationIds: variationIdsOf(object) });
  }
  return items;
}

export const squareCatalogSource: CatalogSource = {
  listAll: listAllForIndex,
  liveStock: (variationIds) => stockCounts(createSquareClient(), variationIds),

  listByCategories(categoryIds, options) {
    const ids = sandboxIdsActive() ? categoryIds.map((id) => toSandbox.get(id) ?? id) : categoryIds;
    return collect({ setQuery: { attributeName: "category_id", attributeValues: ids } }, options);
  },

  search(query, options) {
    return searchRanked(query, options);
  },

  async getProduct(id): Promise<Product | null> {
    const client = createSquareClient();
    let response = await client.catalog.object.get({ objectId: id, includeRelatedObjects: true });
    if (!response.object) return null;

    if (response.object.type === "ITEM_VARIATION") {
      const parentId = response.object.itemVariationData?.itemId;
      if (!parentId) return null;
      response = await client.catalog.object.get({ objectId: parentId, includeRelatedObjects: true });
      if (!response.object) return null;
    }
    if (response.object.type !== "ITEM") return null;

    const itemData = response.object.itemData;
    const categoryIds = [...(itemData?.categories ?? []).map((c) => c.id), itemData?.reportingCategory?.id].map((id) =>
      id && sandboxIdsActive() ? (fromSandbox.get(id) ?? id) : id
    );
    if (!isPublicCatalogItem({ name: itemData?.name ?? "", description: itemData?.description, categoryIds })) return null;

    const variationIds = (response.object.itemData?.variations ?? []).flatMap((v) => (v.id ? [v.id] : []));
    const [location] = squareLocationIds();
    const counts = variationIds.length
      ? await client.inventory.batchGetCounts({ catalogObjectIds: variationIds, locationIds: [location] })
      : { data: [] };
    const product = normalizeProductResponse(
      { ...response, relatedObjects: await withProcessedImages(response.relatedObjects) },
      { counts: counts.data ?? [] },
      location
    );

    return {
      id: product.id,
      name: product.name,
      description: product.descriptionPlaintext ?? product.description,
      imageUrls: withReplacement(product.imageUrls, (await approvedReplacements([product.id])).get(product.id)),
      categoryName: product.category.name || undefined,
      variations: product.variations.map((v) => ({
        id: v.id,
        name: v.name,
        priceAmount: v.priceAmount,
        priceCurrency: v.priceCurrency,
        soldOut: v.soldOut || v.inventoryCount <= 0,
        inventoryCount: v.inventoryCount,
      })),
    };
  },
};
