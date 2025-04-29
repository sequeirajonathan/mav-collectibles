import { NextResponse, NextRequest } from "next/server";
import { createSquareClient } from "@lib/square";
import { SquareItem, SquareProduct } from "@interfaces";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = createSquareClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Fetch the specific item and its related objects (like images)
    const response = await client.catalog.object.get({
      objectId: id,
      includeRelatedObjects: true,
    });

    if (!response.object || response.object.type !== "ITEM") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const item = response.object as SquareItem;
    const itemData = item.itemData ?? {};
    const mainVariation = itemData.variations?.[0]?.itemVariationData ?? {};

    // Extract image data from related objects
    const imageMap: Record<string, string> = {};
    if (response.relatedObjects) {
      response.relatedObjects.forEach((obj) => {
        if (obj.type === "IMAGE" && obj.id && obj.imageData?.url) {
          imageMap[obj.id] = obj.imageData.url;
        }
      });
    }

    // Map image IDs to URLs
    const imageUrls =
      itemData.imageIds?.map((id) => imageMap[id]).filter(Boolean) || [];

    // Use the category from the search params or default to uncategorized
    const category =
      new URL(request.url).searchParams.get("category") || "uncategorized";

    const product: SquareProduct = {
      id: item.id ?? "",
      name: itemData.name ?? "Unnamed Product",
      description: itemData.description ?? "",
      price: Number(mainVariation.priceMoney?.amount ?? 0n) / 100,
      status: "AVAILABLE",
      imageIds: itemData.imageIds ?? [],
      imageUrls,
      category,
      variations: (itemData.variations ?? []).map((variation) => ({
        id: variation.id ?? "",
        name: variation.itemVariationData?.name ?? "",
        price:
          Number(variation.itemVariationData?.priceMoney?.amount ?? 0n) / 100,
        sku: variation.itemVariationData?.sku,
      })),
    };

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
