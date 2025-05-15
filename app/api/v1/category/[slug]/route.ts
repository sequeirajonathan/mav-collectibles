import { NextResponse } from "next/server";
import { createSquareClient } from "@lib/square";
import { isCatalogItem, normalizeItemsWithInventory } from "@utils";
import { ACTIVE_LOCATION_IDS } from "@const/locations";
import { CatalogObject } from "@interfaces";

import {
  CATEGORY_MAPPING,
  COLLECTIBLES_MAPPING,
  SUPPLIES_MAPPING,
  EVENTS_MAPPING,
  CATEGORY_GROUP_SLUGS,
} from "@const/categories";

const ALL_MAPPINGS = [
  ...Object.values(CATEGORY_MAPPING),
  ...Object.values(COLLECTIBLES_MAPPING),
  ...Object.values(SUPPLIES_MAPPING),
  ...Object.values(EVENTS_MAPPING),
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    
    const initialCursor = searchParams.get('cursor');
    const sort = searchParams.get('sort') || "name_asc";
    const stock = searchParams.get('stock') || "IN_STOCK";
    const limit = parseInt(searchParams.get('limit') || "100", 10);

    // Determine category IDs from slug
    let categoryIds: string[] = [];
    if (CATEGORY_GROUP_SLUGS[slug]) {
      categoryIds = CATEGORY_GROUP_SLUGS[slug];
    } else {
      const match = ALL_MAPPINGS.find((c) => c.slug === slug);
      if (match) {
        categoryIds = [match.squareCategoryId];
      } else {
        return NextResponse.json(
          { error: "Invalid category or group slug" },
          { status: 404 }
        );
      }
    }

    const client = createSquareClient();
    const sortOrder: "ASC" | "DESC" = sort === "name_desc" ? "DESC" : "ASC";

    const collectedItems: Array<ReturnType<typeof normalizeItemsWithInventory>[0]> = [];
    let cursor: string | null = initialCursor;
    let keepPaging = true;

    // Keep fetching until we've got `limit` valid items or run out of pages
    while (collectedItems.length < limit && keepPaging) {
      const searchResponse = await client.catalog.search({
        objectTypes: ["ITEM"],
        includeRelatedObjects: true,
        query: {
          setQuery: {
            attributeName: "category_id",
            attributeValues: categoryIds,
          },
          sortedAttributeQuery: {
            attributeName: "name",
            sortOrder,
          },
        },
        limit: 100,
        ...(cursor ? { cursor } : {}),
      });

      // Build variation ID list
      const variationIds = (searchResponse.objects ?? [])
        .filter(isCatalogItem)
        .flatMap((item) => item.itemData?.variations?.map((v) => v.id) ?? []);

      // Fetch inventory counts
      const inventoryResponse = await client.inventory.batchGetCounts({
        catalogObjectIds: [...variationIds.filter((id): id is string => typeof id === 'string'), ...categoryIds],
        locationIds: ACTIVE_LOCATION_IDS,
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

      cursor = searchResponse.cursor ?? null;
      keepPaging = Boolean(cursor);
    }

    // Slice to exactly `limit`
    const itemsToReturn = collectedItems.slice(0, limit);
    // Only return cursor if more valid items may exist
    const returnCursor =
      keepPaging && collectedItems.length > limit
        ? cursor
        : null;

    return NextResponse.json({
      items: itemsToReturn,
      cursor: returnCursor,
    });
  } catch (error) {
    console.error("Error fetching catalog:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalog" },
      { status: 500 }
    );
  }
}
