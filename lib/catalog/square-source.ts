import "server-only";
import type { Square } from "square";
import { createSquareClient, squareLocationIds } from "@lib/square";
import { isCatalogItem, normalizeItemsWithInventory, normalizeProductResponse } from "@utils/square";
import { catalogItemSchema, type CatalogItem, type CatalogPage, type Product } from "@lib/contracts/catalog";
import { serverEnv } from "@lib/env.server";
import sandboxMap from "@const/square-sandbox-map.json";
import { matchesStock, type CatalogSource, type ListOptions } from "./source";
import { withProcessedImages } from "./product-images";
import { isPublicCatalogItem } from "./visibility";

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
    for (const normalized of normalizeItemsWithInventory(withInventory, related)) {
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

export const squareCatalogSource: CatalogSource = {
  listByCategories(categoryIds, options) {
    const ids = sandboxIdsActive() ? categoryIds.map((id) => toSandbox.get(id) ?? id) : categoryIds;
    return collect({ setQuery: { attributeName: "category_id", attributeValues: ids } }, options);
  },

  search(query, options) {
    return collect({ textQuery: { keywords: [query] } }, options);
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
      imageUrls: product.imageUrls,
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
