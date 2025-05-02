import { NextResponse, NextRequest } from "next/server";
import { createSquareClient } from "@lib/square";
import { SquareItem, SquareProduct } from "@interfaces";
import { getCategoryByRoute } from "@utils";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ category: string }> }
) {
  const { category } = await context.params;
  const { searchParams } = new URL(request.url);
  const searchType = searchParams.get("searchType") || "text";

  const squareClient = createSquareClient();
  const categoryInfo = getCategoryByRoute(category);

  if (!categoryInfo) {
    return NextResponse.json({ products: [], error: "Invalid category route" }, { status: 404 });
  }

  let query;
  switch (searchType) {
    case "prefix":
      query = { prefixQuery: { attributeName: "name", attributePrefix: categoryInfo.squareCategory } };
      break;
    case "exact":
      query = { exactQuery: { attributeName: "name", attributeValue: categoryInfo.squareCategory } };
      break;
    default:
      query = { textQuery: { keywords: [categoryInfo.squareCategory] } };
  }

  try {
    const response = await squareClient.catalog.search({
      objectTypes: ["ITEM", "IMAGE", "ITEM_VARIATION"],
      query,
      includeRelatedObjects: true,
      limit: 100,
    });

    const items = (response.objects ?? []).filter(obj => obj.type === "ITEM") as SquareItem[];

    if (items.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Build image map
    const imageMap: Record<string, string> = {};
    response.relatedObjects?.forEach(obj => {
      if (obj.type === "IMAGE" && obj.id && obj.imageData?.url) {
        imageMap[obj.id] = obj.imageData.url;
      }
    });

    // Gather variation IDs
    const variationIds = items.flatMap(
      item => item.itemData?.variations?.map(v => v.id).filter(Boolean) ?? []
    ).filter((id): id is string => id !== undefined);

    // Get inventory counts directly from Square
    const inventoryResponse = await squareClient.inventory.batchGetCounts({
      catalogObjectIds: variationIds,
      locationIds: [], // All locations
    });

    const inventoryMap = (inventoryResponse.data ?? []).reduce<Record<string, number>>((acc, count) => {
      const id = count.catalogObjectId;
      const qty = parseFloat(count.quantity ?? "0");
      if (id) acc[id] = (acc[id] || 0) + qty;
      return acc;
    }, {});

    // Map to SquareProduct[]
    const products: SquareProduct[] = items.map(item => {
      const itemData = item.itemData ?? {};
      const mainVariation = itemData.variations?.[0]?.itemVariationData ?? {};
      const variationId = itemData.variations?.[0]?.id ?? "";
      const quantity = inventoryMap[variationId] ?? 0;

      return {
        id: item.id ?? "",
        name: itemData.name ?? "Unnamed Product",
        description: itemData.description ?? "",
        price: Number(mainVariation.priceMoney?.amount ?? 0n) / 100,
        status: quantity > 0 ? "AVAILABLE" : "UNAVAILABLE",
        stockQuantity: quantity,
        availability: quantity > 0 ? "IN_STOCK" : "SOLD_OUT",
        imageIds: itemData.imageIds ?? [],
        imageUrls: (itemData.imageIds ?? []).map(id => imageMap[id]).filter(Boolean),
        category: categoryInfo.displayName,
        categoryType: "REGULAR_CATEGORY",
        variations: (itemData.variations ?? []).map(v => ({
          id: v.id ?? "",
          name: v.itemVariationData?.name ?? "",
          price: Number(v.itemVariationData?.priceMoney?.amount ?? 0n) / 100,
          sku: v.itemVariationData?.sku,
          stockable: v.itemVariationData?.stockable ?? false,
          sellable: v.itemVariationData?.sellable ?? false,
        })),
      };
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("[API] Error in /api/products/[category]:", error);
    return NextResponse.json(
      {
        products: [],
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
