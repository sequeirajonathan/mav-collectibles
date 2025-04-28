import { NextResponse } from "next/server";
import { createSquareClient } from "@lib/square";
import { SquareItem, SquareProduct } from "@interfaces";

// Define a response type that can include debug info
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const searchType = searchParams.get('searchType') || 'text'; // Default to text search
    const debug = searchParams.get('debug') === 'true';

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    try {
      const squareClient = createSquareClient();
      
      // Format the category name with proper capitalization
      const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      
      // Configure search query based on search type
      let query;
      if (searchType === 'prefix') {
        // Use prefix search on name attribute
        query = {
          prefixQuery: {
            attributeName: "name",
            attributePrefix: formattedCategory,
          }
        };
      } else if (searchType === 'exact') {
        // Use exact search on name attribute
        query = {
          exactQuery: {
            attributeName: "name",
            attributeValue: formattedCategory,
          }
        };
      } else {
        // Default: Use text search (keywords)
        query = {
          textQuery: {
            keywords: [formattedCategory]
          }
        };
      }

      if (debug) {
        console.log(`Search query: ${JSON.stringify(query)}`);
      }

      // Execute search with constructed query
      const response = await squareClient.catalog.search({
        objectTypes: ["ITEM"],
        query,
        limit: 50,
        includeRelatedObjects: true,
      });

      if (debug) {
        console.log(`Response related objects: ${response.relatedObjects?.length || 0}`);
        console.log(`Response objects: ${response.objects?.length || 0}`);
      }

      if (!response.objects || response.objects.length === 0) {
        return NextResponse.json({ products: [] });
      }

      // Filter for items only
      const items = response.objects.filter(obj => obj.type === 'ITEM');
      
      // Extract image data from related objects
      const imageMap: Record<string, string> = {};
      if (response.relatedObjects) {
        response.relatedObjects.forEach(obj => {
          if (obj.type === 'IMAGE' && obj.id && obj.imageData?.url) {
            imageMap[obj.id] = obj.imageData.url;
          }
        });
      }

      if (debug) {
        console.log(`Found ${Object.keys(imageMap).length} related images`);
      }

      const products = (items as SquareItem[]).map((item) => {
        const itemData = item.itemData ?? {};
        const mainVariation = itemData.variations?.[0]?.itemVariationData ?? {};
        
        // Map image IDs to URLs
        const imageUrls = itemData.imageIds?.map(id => imageMap[id]).filter(Boolean) || [];

        return {
          id: item.id ?? "",
          name: itemData.name ?? "Unnamed Product",
          description: itemData.description ?? "",
          price: Number(mainVariation.priceMoney?.amount ?? 0n) / 100,
          status: "AVAILABLE" as const,
          imageIds: itemData.imageIds ?? [],
          imageUrls,
          variations: (itemData.variations ?? []).map((variation) => ({
            id: variation.id ?? "",
            name: variation.itemVariationData?.name ?? "",
            price: Number(variation.itemVariationData?.priceMoney?.amount ?? 0n) / 100,
            sku: variation.itemVariationData?.sku,
          })),
        };
      });

      // Optionally include debug info in response
      const responseData: ProductsResponse = { products };
      if (debug) {
        responseData.debug = {
          searchType,
          formattedCategory,
          totalObjectsFound: response.objects.length,
          totalItemsFound: items.length,
          hasRelatedObjects: !!response.relatedObjects?.length,
        };
      }

      return NextResponse.json(responseData);
    } catch (squareError) {
      console.error("Square API error:", squareError);
      
      // Return empty array to trigger client-side fallback
      const responseData: ProductsResponse = { 
        products: [],
        error: "Using fallback data due to Square API error" 
      };
      return NextResponse.json(responseData);
    }
  } catch (error) {
    console.error("Error in products API route:", error);
    const responseData: ProductsResponse = {
      products: [],
      error: "Failed to fetch products",
    };
    
    if (error instanceof Error) {
      responseData.debug = {
        searchType: 'error',
        formattedCategory: '',
        totalObjectsFound: 0,
        totalItemsFound: 0,
        hasRelatedObjects: false,
      };
      responseData.error = error.message;
    }
    
    return NextResponse.json(responseData, { status: 500 });
  }
}
