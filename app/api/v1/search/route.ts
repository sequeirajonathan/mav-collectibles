import { NextResponse } from "next/server";
import { createSquareClient } from "@lib/square";
import { normalizeCatalogItems, serializeBigIntValues } from "@utils";

export async function POST(request: Request) {
  try {
    const { search, cursor = null, stock = "IN_STOCK", sort = "name_asc" } = await request.json();
    const client = createSquareClient();

    // Determine sort order for Square API
    let sortOrder: 'ASC' | 'DESC' = 'ASC';
    if (sort === 'name_desc') sortOrder = 'DESC';

    // pass cursor into Square so we really get page N
    const searchResponse = await client.catalog.search({
      objectTypes: ["ITEM", "ITEM_VARIATION"],
      includeRelatedObjects: true,
      query: {
        textQuery: {
          keywords: [search],
        },
        sortedAttributeQuery: {
          attributeName: "name",
          sortOrder,
        },
      },
      limit: 100,
      ...(cursor ? { cursor } : {}),
    });

    // normalize and strip out BigInts
    const normalized = normalizeCatalogItems(searchResponse, { stock });
    const payload = JSON.parse(
      JSON.stringify(normalized, serializeBigIntValues)
    );

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error searching catalog:", error);
    return NextResponse.json(
      { error: "Failed to search catalog" },
      { status: 500 }
    );
  }
}
