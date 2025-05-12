import { NextResponse } from "next/server";
import { createSquareClient } from "@lib/square";
import { normalizeCatalogItems, serializeBigIntValues } from "@utils";
import {
  CATEGORY_MAPPING,
  COLLECTIBLES_MAPPING,
  SUPPLIES_MAPPING,
  EVENTS_MAPPING,
  CATEGORY_GROUP_SLUGS,
} from "@const/categories";

const ALL_MAPPINGS = [
  ...Object.values(CATEGORY_MAPPING),
  ...Object.values(COLLECTIBLES_MAPPING),
  ...Object.values(SUPPLIES_MAPPING),
  ...Object.values(EVENTS_MAPPING),
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { cursor = null, stock = "IN_STOCK", sort = "name_asc" } = await request.json();
    const client = createSquareClient();

    // Determine sort order for Square API
    let sortOrder: 'ASC' | 'DESC' = 'ASC';
    if (sort === 'name_desc') sortOrder = 'DESC';

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

    // normalize and strip out BigInts
    const normalized = normalizeCatalogItems(searchResponse, { stock });
    const payload = JSON.parse(
      JSON.stringify(normalized, serializeBigIntValues)
    );

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching catalog:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalog" },
      { status: 500 }
    );
  }
}