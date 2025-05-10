import { NextResponse } from "next/server";
import { createSquareClient } from "@lib/square";
import { normalizeCatalogResponse, serializeBigIntValues } from "@utils";
import {
  CATEGORY_MAPPING,
  COLLECTIBLES_MAPPING,
  SUPPLIES_MAPPING,
  EVENTS_MAPPING,
} from "@const/categories";

// Unified group-to-map lookup
const CATEGORY_MAPS = {
  TCG: CATEGORY_MAPPING,
  Collectibles: COLLECTIBLES_MAPPING,
  "Supplies & Grading": SUPPLIES_MAPPING,
  Events: EVENTS_MAPPING,
};

export async function POST(request: Request) {
  try {
    const client = createSquareClient();
    const {
      cursor = null,
      search = "",
      sort = "name_asc",
      group = "TCG",
      categoryId = null,
      stock = "IN_STOCK",
    } = await request.json();

    const groupMapping = CATEGORY_MAPS[group as keyof typeof CATEGORY_MAPS];
    if (!groupMapping) {
      return NextResponse.json({ error: "Invalid group" }, { status: 400 });
    }

    // Build category ID list
    const categoryIds: string[] = [];

    if (categoryId) {
      const isValidCategory = Object.values(groupMapping).some(
        (cat) => cat.squareCategoryId === categoryId
      );

      if (isValidCategory) {
        categoryIds.push(categoryId);
      } else {
        // fallback to entire group if invalid
        categoryIds.push(...Object.values(groupMapping).map((cat) => cat.squareCategoryId));
      }
    } else {
      categoryIds.push(...Object.values(groupMapping).map((cat) => cat.squareCategoryId));
    }

    // Sorting
    const sortedAttributeQuery =
      sort === "name_desc" ? { attributeName: "name", sortOrder: "DESC" } :
      sort === "price_asc" ? { attributeName: "price", sortOrder: "ASC" } :
      sort === "price_desc" ? { attributeName: "price", sortOrder: "DESC" } :
      { attributeName: "name", sortOrder: "ASC" }; // default

    // Build query object
    const query: Record<string, unknown> = {
      sortedAttributeQuery,
    };

    if (search) {
      query.textQuery = { keywords: search.split(/\s+/) };
    }

    if (categoryIds.length > 0) {
      query.setQuery = {
        attributeName: "category_id",
        attributeValues: categoryIds,
      };
    }

    const searchResponse = await client.catalog.search({
      objectTypes: ["ITEM"],
      query,
      cursor,
      includeRelatedObjects: true,
      limit: 50,
    });

    const normalized = normalizeCatalogResponse(searchResponse);

    // Server-side stock filtering
    if (stock !== "all") {
      normalized.items = normalized.items.filter((item) => {
        return stock === "IN_STOCK"
          ? item.ecomAvailable === true && item.soldOut === false
          : stock === "SOLD_OUT"
          ? item.soldOut === true
          : true;
      });
    }

    return NextResponse.json(
      JSON.parse(JSON.stringify(normalized, serializeBigIntValues))
    );
  } catch (error) {
    console.error("Error fetching catalog:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalog" },
      { status: 500 }
    );
  }
}
