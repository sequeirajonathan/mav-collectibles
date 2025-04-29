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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ category: string }> }
) {
  const { category } = await context.params;
  const { searchParams } = new URL(request.url);
  const searchType = searchParams.get('searchType') || 'text';

  const squareClient = createSquareClient();

  let query;
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

  try {
    const response = await squareClient.catalog.search({
      objectTypes: ["ITEM"],
      query,
      limit: 50,
      includeRelatedObjects: true,
    });

    const items = (response.objects ?? []).filter(obj => obj.type === 'ITEM') as SquareItem[];

    if (items.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const imageMap: Record<string, string> = {};
    response.relatedObjects?.forEach(obj => {
      if (obj.type === 'IMAGE' && obj.id && obj.imageData?.url) {
        imageMap[obj.id] = obj.imageData.url;
      }
    });

    const products: SquareProduct[] = items.map((item) => {
      const itemData = item.itemData ?? {};
      const mainVariation = itemData.variations?.[0]?.itemVariationData ?? {};

      return {
        id: item.id ?? "",
        name: itemData.name ?? "Unnamed Product",
        description: itemData.description ?? "",
        price: Number(mainVariation.priceMoney?.amount ?? 0n) / 100,
        status: "AVAILABLE",
        imageIds: itemData.imageIds ?? [],
        imageUrls: (itemData.imageIds ?? []).map(id => imageMap[id]).filter(Boolean),
        category,
        variations: (itemData.variations ?? []).map(variation => ({
          id: variation.id ?? "",
          name: variation.itemVariationData?.name ?? "",
          price: Number(variation.itemVariationData?.priceMoney?.amount ?? 0n) / 100,
          sku: variation.itemVariationData?.sku,
        })),
      };
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Square API error:", error);

    const responseData: ProductsResponse = {
      products: [],
      error: error instanceof Error ? error.message : "Unknown error",
      debug: {
        searchType,
        formattedCategory: category,
        totalObjectsFound: 0,
        totalItemsFound: 0,
        hasRelatedObjects: false,
      },
    };

    return NextResponse.json(responseData, { status: 500 });
  }
}
