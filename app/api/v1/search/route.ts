import { NextResponse } from "next/server";
import { createSquareClient } from "@lib/square";
import { isCatalogItem, normalizeItemsWithInventory } from "@utils";
import { ACTIVE_LOCATION_IDS } from "@const/locations";
import { CatalogObject } from "@interfaces";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (MAX_RETRIES - retries + 1)));
    return retryWithBackoff(fn, retries - 1);
  }
}

export async function POST(request: Request) {
  try {
    const { search, cursor = null, stock = "IN_STOCK", sort = "name_asc", limit = 100 } = await request.json();
    
    const client = createSquareClient();
    const sortOrder: "ASC" | "DESC" = sort === "name_desc" ? "DESC" : "ASC";

    const collectedItems: Array<ReturnType<typeof normalizeItemsWithInventory>[0]> = [];
    let currentCursor: string | null = cursor;
    let keepPaging = true;

    // Keep fetching until we've got `limit` valid items or run out of pages
    while (collectedItems.length < limit && keepPaging) {
      const searchResponse = await retryWithBackoff(async () => {
        const response = await client.catalog.search({
          objectTypes: ["ITEM"],
          includeRelatedObjects: true,
          query: {
            textQuery: {
              keywords: [search],
            },
            sortedAttributeQuery: {
              attributeName: "name",
              sortOrder,
            },
          },
          limit: 100,
          ...(currentCursor ? { cursor: currentCursor } : {}),
        });
        return response;
      });

      // Build variation ID list
      const variationIds = (searchResponse.objects ?? [])
        .filter(isCatalogItem)
        .flatMap((item) => item.itemData?.variations?.map((v) => v.id) ?? []);

      // Fetch inventory counts with retry
      const inventoryResponse = await retryWithBackoff(async () => {
        const response = await client.inventory.batchGetCounts({
          catalogObjectIds: variationIds.filter((id): id is string => typeof id === 'string'),
          locationIds: ACTIVE_LOCATION_IDS,
        });
        return response;
      });

      // Build inventory map
      const inventoryMap = (inventoryResponse.data ?? []).reduce<Record<string, number>>(
        (acc, c) => {
          if (c.catalogObjectId && c.state === "IN_STOCK") {
            acc[c.catalogObjectId] = (acc[c.catalogObjectId] || 0) + parseFloat(c.quantity ?? "0");
          }
          return acc;
        },
        {}
      );

      // Attach inventory to items
      const itemsWithInventory = (searchResponse.objects ?? [])
        .filter((obj): obj is CatalogObject & { type: "ITEM" } => isCatalogItem(obj))
        .map((item) => ({
          ...item,
          itemData: {
            ...item.itemData,
            variations: item.itemData?.variations?.map((v) => ({
              ...v,
              inventory: v.id ? inventoryMap[v.id] ?? 0 : 0,
            })),
          },
        }));

      // Normalize and filter by stock
      const normalized = normalizeItemsWithInventory(itemsWithInventory, searchResponse.relatedObjects);
      const stockArray = stock.split(",").map((s: string) => s.trim()).filter(Boolean);
      const filtered =
        stockArray.length === 1
          ? stockArray[0] === "IN_STOCK"
            ? normalized.filter((i) => !i.soldOut)
            : normalized.filter((i) => i.soldOut)
          : normalized;

      collectedItems.push(...filtered);

      currentCursor = searchResponse.cursor ?? null;
      keepPaging = Boolean(currentCursor);
    }

    // Slice to exactly `limit`
    const itemsToReturn = collectedItems.slice(0, limit);
    // Only return cursor if more valid items may exist
    const returnCursor = (currentCursor && itemsToReturn.length === limit) ? currentCursor : null;

    return NextResponse.json({
      items: itemsToReturn,
      cursor: returnCursor,
    });
  } catch (error) {
    console.error("Error searching catalog:", error);
    return NextResponse.json(
      { error: "Failed to search catalog", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
