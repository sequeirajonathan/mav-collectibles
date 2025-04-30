import { NextResponse, NextRequest } from "next/server";
import { createSquareClient } from "@lib/square";
import { SquareItem, SquareProduct } from "@interfaces";
import { getCategoryByRoute } from '@utils';

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

  // Get the Square category name from our route mapping
  const categoryInfo = getCategoryByRoute(category);
  if (!categoryInfo) {
    return NextResponse.json({ products: [] });
  }

  let query;
  switch (searchType) {
    case 'prefix':
      query = { prefixQuery: { attributeName: "name", attributePrefix: categoryInfo.squareCategory } };
      break;
    case 'exact':
      query = { exactQuery: { attributeName: "name", attributeValue: categoryInfo.squareCategory } };
      break;
    default:
      query = { textQuery: { keywords: [categoryInfo.squareCategory] } };
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
        category: categoryInfo.displayName,
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
        formattedCategory: categoryInfo.squareCategory,
        totalObjectsFound: 0,
        totalItemsFound: 0,
        hasRelatedObjects: false,
      },
    };

    return NextResponse.json(responseData, { status: 500 });
  }
}
