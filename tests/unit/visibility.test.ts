import { describe, expect, it } from "vitest";
import { isPublicCatalogItem } from "@lib/catalog/visibility";
import { CATEGORY_MAPPING } from "@const/categories";

const POKEMON = CATEGORY_MAPPING.pokemon.squareCategoryId;

describe("isPublicCatalogItem", () => {
  it("shows items in a category on the shop menu", () => {
    expect(isPublicCatalogItem({ name: "Temporal Forces Booster Pack", categoryIds: [POKEMON] })).toBe(true);
    expect(isPublicCatalogItem({ name: "Pre-Order: Scarlet & Violet Booster Box", description: "Pre-order now.", categoryIds: [POKEMON] })).toBe(true);
  });

  it("hides items in categories the shop doesn't list, and uncategorized items", () => {
    expect(isPublicCatalogItem({ name: "Something", categoryIds: ["2CNVZRRNJ6XGKV265JIN5536"] })).toBe(false);
    expect(isPublicCatalogItem({ name: "Something", categoryIds: [undefined, null] })).toBe(false);
    expect(isPublicCatalogItem({ name: "Something", categoryIds: [] })).toBe(false);
  });

  it.each([
    ["Order# 13E4CA7E-F9DE2C-87B6F", ""],
    ["Order: 13E4CA7E-C81456-56826", "Jane Customer"],
    ["13E4CA7E-37F3C3-2C03B", ""],
    ["Charizard", "order # 13e4ca7e-37f3c3-2c03b Jane Customer 4/19/2026"],
  ])("hides order records even in a public category: %s", (name, description) => {
    expect(isPublicCatalogItem({ name, description, categoryIds: [POKEMON] })).toBe(false);
  });
});
