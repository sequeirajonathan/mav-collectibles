import { NextResponse } from "next/server";
import { createSquareClient } from "@lib/square";
import { serializeBigIntValues } from "@utils/serialization";
import { normalizeProductResponse } from "@utils/square";
import { ItemVariationObject } from "@interfaces";

export async function GET(
  request: Request,
  context: { params: Promise<{ category: string; id: string }> }
) {
  try {
    const { id } = await context.params;
    const client = createSquareClient();

    // Get catalog object
    const catalogResponse = await client.catalog.object.get({
      objectId: id,
      includeRelatedObjects: true,
    });

    // If we got a variation, fetch the parent item
    if (catalogResponse.object?.type === 'ITEM_VARIATION') {
      const parentItemId = (catalogResponse.object as ItemVariationObject).itemVariationData?.itemId;
      if (parentItemId) {
        const parentResponse = await client.catalog.object.get({
          objectId: parentItemId,
          includeRelatedObjects: true,
        });
        catalogResponse.object = parentResponse.object;
        catalogResponse.relatedObjects = parentResponse.relatedObjects;
      }
    }

    // Get all variation IDs from the item
    const variationIds = catalogResponse.object?.type === 'ITEM' 
      ? (catalogResponse.object.itemData?.variations ?? [])
          .map(v => v.id)
          .filter((id): id is string => id !== undefined)
      : [id];

    // Get inventory counts for all variations
    const inventoryResponse = await client.inventory.batchGetCounts({
      catalogObjectIds: variationIds,
      locationIds: ["LTZNXWZDB0FH9"],
    });

    // Normalize the response
    const normalizedProduct = normalizeProductResponse(
      catalogResponse,
      {
        counts: inventoryResponse.data ?? [],
      },
      "LTZNXWZDB0FH9"
    );

    return NextResponse.json(
      JSON.parse(JSON.stringify(normalizedProduct, serializeBigIntValues))
    );
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
