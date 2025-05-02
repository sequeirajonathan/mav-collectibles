import { NextRequest, NextResponse } from "next/server";
import { createSquareClient } from "@lib/square";
import { SquareItem, SquareProduct } from "@interfaces";
import { CATEGORY_GROUPS } from "@const/categories";
import { fetchInventoryCounts } from "@services/squareService";

function buildCategoryNameMap(
  relatedObjects?: unknown[]
): Record<string, string> {
  const map: Record<string, string> = {};
  relatedObjects?.forEach((obj) => {
    const categoryObj = obj as {
      type: string;
      id: string;
      categoryData?: { name?: string };
    };
    if (
      categoryObj.type === "CATEGORY" &&
      categoryObj.id &&
      categoryObj.categoryData?.name
    ) {
      map[categoryObj.id] = categoryObj.categoryData.name;
    }
  });
  return map;
}

function buildImageMap(relatedObjects?: unknown[]): Record<string, string> {
  const map: Record<string, string> = {};
  relatedObjects?.forEach((obj) => {
    const imageObj = obj as {
      type: string;
      id: string;
      imageData?: { url?: string };
    };
    if (imageObj.type === "IMAGE" && imageObj.id && imageObj.imageData?.url) {
      map[imageObj.id] = imageObj.imageData.url;
    }
  });
  return map;
}

function mapItemsToProducts(
  items: SquareItem[],
  imageMap: Record<string, string>,
  categoryNameMap: Record<string, string>,
  inventoryMap: Record<string, number>
): SquareProduct[] {
  return items.map((item) => {
    const itemData = item.itemData ?? {};
    const mainVariation = itemData.variations?.[0]?.itemVariationData ?? {};
    const variationId = itemData.variations?.[0]?.id ?? "";
    const quantity = inventoryMap[variationId] ?? 0;

    return {
      id: item.id ?? "",
      name: itemData.name ?? "Unnamed Product",
      description: itemData.description ?? "",
      price: Number(mainVariation.priceMoney?.amount ?? 0n) / 100,
      status: itemData.ecom_available ? "AVAILABLE" : "UNAVAILABLE",
      availability: quantity > 0 ? "IN_STOCK" : "SOLD_OUT",
      stockQuantity: quantity,
      imageIds: itemData.imageIds ?? [],
      imageUrls:
        itemData.imageIds?.map((id) => imageMap[id]).filter(Boolean) || [],
      category:
        categoryNameMap[itemData.categories?.[0]?.id ?? ""] ?? "Uncategorized",
      categoryType: "REGULAR_CATEGORY",
      variations: (itemData.variations ?? []).map((variation) => {
        const vId = variation.id ?? "";
        return {
          id: vId,
          name: variation.itemVariationData?.name ?? "",
          price:
            Number(variation.itemVariationData?.priceMoney?.amount ?? 0n) / 100,
          sku: variation.itemVariationData?.sku,
          stockable: variation.itemVariationData?.stockable ?? false,
          sellable: variation.itemVariationData?.sellable ?? false,
        };
      }),
    };
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") ?? "";

  try {
    const squareClient = createSquareClient();
    const response = await squareClient.catalog.search({
      objectTypes: ["ITEM", "CATEGORY", "ITEM_VARIATION", "IMAGE"],
      includeRelatedObjects: true,
      limit: 5,
    });

    const items = (response.objects ?? []).filter(
      (obj) => obj.type === "ITEM"
    ) as SquareItem[];
    const imageMap = buildImageMap(response.relatedObjects);
    const categoryMap = buildCategoryNameMap(response.relatedObjects);

    const variationIds = items.flatMap(
      (i) => i.itemData?.variations?.map((v) => v.id).filter(Boolean) ?? []
    ).filter((id): id is string => id !== undefined);

    const inventory = await fetchInventoryCounts(variationIds);

    const allProducts = mapItemsToProducts(
      items,
      imageMap,
      categoryMap,
      inventory
    );

    if (filter) {
      const groupCategories =
        CATEGORY_GROUPS.find(
          (g) => g.name.toLowerCase().replace(/\s+/g, "-") === filter
        )?.categories.map((c) => c.squareCategory) || [];

      const filtered = allProducts.filter((p) =>
        groupCategories.includes(p.category)
      );
      return NextResponse.json({ products: filtered });
    }

    return NextResponse.json({ products: allProducts });
  } catch (error) {
    console.error("[API] Error in /api/products:", error);
    return NextResponse.json(
      { products: [], error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
