import { NextResponse, NextRequest } from "next/server";
import { createSquareClient } from "@lib/square";
import { SquareItem, SquareProduct } from "@interfaces";

interface ProductsResponse {
  products: SquareProduct[];
  debug?: {
    searchType: string;
    formattedCategory: string;
    totalObjectsFound: number;
    totalItemsFound: number;
    hasRelatedObjects: boolean;
  };
  error?: string;
}

// Helper to map images
function buildImageMap(relatedObjects?: unknown[]): Record<string, string> {
  const map: Record<string, string> = {};
  relatedObjects?.forEach(obj => {
    const imageObj = obj as { type: string; id: string; imageData?: { url?: string } };
    if (imageObj.type === 'IMAGE' && imageObj.id && imageObj.imageData?.url) {
      map[imageObj.id] = imageObj.imageData.url;
    }
  });
  return map;
}

// Helper to map items to products
function mapItemsToProducts(items: SquareItem[], imageMap: Record<string, string>): SquareProduct[] {
  return items.map((item) => {
    const itemData = item.itemData ?? {};
    const mainVariation = itemData.variations?.[0]?.itemVariationData ?? {};
    const imageUrls = itemData.imageIds?.map(id => imageMap[id]).filter(Boolean) || [];

    return {
      id: item.id ?? "",
      name: itemData.name ?? "Unnamed Product",
      description: itemData.description ?? "",
      price: Number(mainVariation.priceMoney?.amount ?? 0n) / 100,
      status: "AVAILABLE" as const,
      imageIds: itemData.imageIds ?? [],
      imageUrls,
      category: itemData.categories?.[0]?.id ?? "",
      variations: (itemData.variations ?? []).map(variation => ({
        id: variation.id ?? "",
        name: variation.itemVariationData?.name ?? "",
        price: Number(variation.itemVariationData?.priceMoney?.amount ?? 0n) / 100,
        sku: variation.itemVariationData?.sku,
      })),
    };
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const searchType = searchParams.get('searchType') || 'text';

  try {
    const squareClient = createSquareClient();

    let query: { prefixQuery?: { attributeName: string; attributePrefix: string }; 
                exactQuery?: { attributeName: string; attributeValue: string };
                textQuery?: { keywords: string[] } } | null = null;
    if (category) {
      // Configure search query if category exists
      switch (searchType) {
        case 'prefix':
          query = { prefixQuery: { attributeName: "name", attributePrefix: category } };
          break;
        case 'exact':
          query = { exactQuery: { attributeName: "name", attributeValue: category } };
          break;
        default:
          query = { textQuery: { keywords: [category] } };
      }
    }

    const response = await squareClient.catalog.search({
      objectTypes: ["ITEM"],
      ...(query ? { query } : {}),
      includeRelatedObjects: true,
      limit: 50,
    });

    const objects = response.objects ?? [];
    if (objects.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const items = objects.filter(obj => obj.type === 'ITEM') as SquareItem[];
    const imageMap = buildImageMap(response.relatedObjects);

    const products = mapItemsToProducts(items, imageMap);

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);

    const responseData: ProductsResponse = {
      products: [],
      error: error instanceof Error ? error.message : "Failed to fetch products",
      debug: error instanceof Error ? {
        searchType,
        formattedCategory: category ?? '',
        totalObjectsFound: 0,
        totalItemsFound: 0,
        hasRelatedObjects: false,
      } : undefined,
    };

    return NextResponse.json(responseData, { status: 500 });
  }
}
