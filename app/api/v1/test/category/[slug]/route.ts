import { NextResponse } from "next/server";
import { createSquareClient } from "@lib/square";
import { isCatalogItem, normalizeItemsWithInventory } from "@utils";
import { ACTIVE_LOCATION_IDS } from "@const/locations";
import { CatalogObject } from "@interfaces";

import {
  CATEGORY_MAPPING,
  COLLECTIBLES_MAPPING,
  SUPPLIES_MAPPING,
  CATEGORY_GROUP_SLUGS,
} from "@const/categories";

const ALL_MAPPINGS = [
  ...Object.values(CATEGORY_MAPPING),
  ...Object.values(COLLECTIBLES_MAPPING),
  ...Object.values(SUPPLIES_MAPPING),
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { cursor = null, sort = "name_asc" } = await request.json();
    const client = createSquareClient();

    // Determine sort order for Square API
    let sortOrder: "ASC" | "DESC" = "ASC";
    if (sort === "name_desc") sortOrder = "DESC";

    // figure out which category IDs to filter by
    let categoryIds: string[] = [];
    if (CATEGORY_GROUP_SLUGS[slug]) {
      categoryIds = CATEGORY_GROUP_SLUGS[slug];
    } else {
      const matched = ALL_MAPPINGS.find((cat) => cat.slug === slug);
      if (matched) categoryIds = [matched.squareCategoryId];
      else
        return NextResponse.json(
          { error: "Invalid category or group slug" },
          { status: 404 }
        );
    }

    // pass cursor into Square so we really get page N
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

    // Get all variation IDs from the response
    const variations =
      searchResponse.objects
        ?.filter((obj) => isCatalogItem(obj))
        .map((obj) => obj.itemData?.variations) ?? [];

    const variationIds = variations
      .flatMap((variation) => variation?.map((v) => v.id) ?? [])
      .filter((id): id is string => id !== undefined);

    // Fetch inventory counts for all variations
    const inventoryResponse = await client.inventory.batchGetCounts({
      catalogObjectIds: variationIds,
      locationIds: ACTIVE_LOCATION_IDS,
    });

    // Create inventory map with proper state handling
    const inventoryMap =
      inventoryResponse.data?.reduce<Record<string, number>>((acc, count) => {
        const id = count.catalogObjectId;
        if (!id) return acc;

        // Only count IN_STOCK items
        if (count.state === "IN_STOCK") {
          const qty = parseFloat(count.quantity ?? "0");
          acc[id] = (acc[id] || 0) + qty;
        }
        return acc;
      }, {}) ?? {};

    // Create a map of items with their variations and inventory
    const itemsWithInventory =
      searchResponse.objects
        ?.filter((obj): obj is CatalogObject & { type: "ITEM" } =>
          isCatalogItem(obj)
        )
        .map((item) => ({
          ...item,
          itemData: {
            ...item.itemData,
            variations: item.itemData?.variations?.map(
              (variation: CatalogObject) => ({
                ...variation,
                inventory: variation.id ? inventoryMap[variation.id] ?? 0 : 0,
              })
            ),
          },
        })) || [];

    //normalize data
    const normalizedItems = normalizeItemsWithInventory(itemsWithInventory);

    // Return the normalized data
    return NextResponse.json(normalizedItems);
  } catch (error) {
    console.error("Error fetching catalog:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalog" },
      { status: 500 }
    );
  }
}
