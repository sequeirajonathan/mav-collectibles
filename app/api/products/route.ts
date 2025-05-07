import { NextResponse } from "next/server";
import { createSquareClient } from "@lib/square";
import { normalizeCatalogResponse } from "@utils";
import { serializeBigIntValues } from "@utils";
import {
  CATEGORY_MAPPING,
  COLLECTIBLES_MAPPING,
  SUPPLIES_MAPPING,
  EVENTS_MAPPING,
} from "@const/categories";

export async function POST(request: Request) {
  try {
    const client = createSquareClient();
    const {
      cursor = null,
      search = "",
      sort = "name_asc",
      group = "TCG",
      categoryId = null,
    } = await request.json();

    // Get category IDs based on group or specific category
    let categoryIds: string[] = [];

    if (categoryId) {
      // Validate that the categoryId belongs to the correct group
      let isValidCategory = false;
      switch (group) {
        case "TCG":
          isValidCategory = Object.values(CATEGORY_MAPPING).some(cat => cat.squareId === categoryId);
          break;
        case "Collectibles":
          isValidCategory = Object.values(COLLECTIBLES_MAPPING).some(cat => cat.squareId === categoryId);
          break;
        case "Supplies & Grading":
          isValidCategory = Object.values(SUPPLIES_MAPPING).some(cat => cat.squareId === categoryId);
          break;
        case "Events":
          isValidCategory = Object.values(EVENTS_MAPPING).some(cat => cat.squareId === categoryId);
          break;
      }

      if (isValidCategory) {
        categoryIds = [categoryId];
      } else {
        // If categoryId is invalid for the group, fall back to all categories in the group
        switch (group) {
          case "TCG":
            categoryIds = Object.values(CATEGORY_MAPPING).map(cat => cat.squareId);
            break;
          case "Collectibles":
            categoryIds = Object.values(COLLECTIBLES_MAPPING).map(cat => cat.squareId);
            break;
          case "Supplies & Grading":
            categoryIds = Object.values(SUPPLIES_MAPPING).map(cat => cat.squareId);
            break;
          case "Events":
            categoryIds = Object.values(EVENTS_MAPPING).map(cat => cat.squareId);
            break;
        }
      }
    } else {
      // Only get all category IDs if no specific categoryId is provided
      switch (group) {
        case "TCG":
          categoryIds = Object.values(CATEGORY_MAPPING).map(cat => cat.squareId);
          break;
        case "Collectibles":
          categoryIds = Object.values(COLLECTIBLES_MAPPING).map(cat => cat.squareId);
          break;
        case "Supplies & Grading":
          categoryIds = Object.values(SUPPLIES_MAPPING).map(cat => cat.squareId);
          break;
        case "Events":
          categoryIds = Object.values(EVENTS_MAPPING).map(cat => cat.squareId);
          break;
      }
    }

    // Build CatalogQuery for sorting, filtering, and searching
    let sortedAttributeQuery;
    switch (sort) {
      case "name_asc":
        sortedAttributeQuery = { attributeName: "name", sortOrder: "ASC" };
        break;
      case "name_desc":
        sortedAttributeQuery = { attributeName: "name", sortOrder: "DESC" };
        break;
      case "price_asc":
        sortedAttributeQuery = { attributeName: "price", sortOrder: "ASC" };
        break;
      case "price_desc":
        sortedAttributeQuery = { attributeName: "price", sortOrder: "DESC" };
        break;
      default:
        sortedAttributeQuery = { attributeName: "name", sortOrder: "ASC" };
    }

    const query: Record<string, unknown> = {};
    if (sortedAttributeQuery) {
      query.sortedAttributeQuery = sortedAttributeQuery;
    }
    if (search) {
      query.textQuery = { keywords: search.split(/\s+/) };
    }
    if (categoryIds.length > 0) {
      query.setQuery = {
        attributeName: "category_id",
        attributeValues: categoryIds,
      };
    }

    console.log('Square API Query:', JSON.stringify(query, null, 2));

    const searchResponse = await client.catalog.search({
      objectTypes: ["ITEM"],
      query,
      cursor,
      includeRelatedObjects: true,
      limit: 50,
    });

    const normalized = normalizeCatalogResponse(searchResponse);

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
