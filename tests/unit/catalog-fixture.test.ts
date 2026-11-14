import { describe, expect, it } from "vitest";
import { fixtureCatalogSource } from "@lib/catalog/fixture-source";
import { matchesStock } from "@lib/catalog/source";
import { CATEGORY_MAPPING } from "@const/categories";

const POKEMON = [CATEGORY_MAPPING.pokemon.squareCategoryId];

describe("fixture catalog", () => {
  it("filters by stock", async () => {
    const inStock = await fixtureCatalogSource.listByCategories(POKEMON, { stock: "IN_STOCK", sort: "name_asc", limit: 50 });
    expect(inStock.items.every((i) => !i.soldOut)).toBe(true);
    const all = await fixtureCatalogSource.listByCategories(POKEMON, { stock: "IN_STOCK,SOLD_OUT", sort: "name_asc", limit: 50 });
    expect(all.items.length).toBeGreaterThan(inStock.items.length);
  });

  it("pages with cursors and sorts", async () => {
    const first = await fixtureCatalogSource.listByCategories(POKEMON, { stock: "IN_STOCK,SOLD_OUT", sort: "name_desc", limit: 2 });
    expect(first.items).toHaveLength(2);
    expect(first.cursor).not.toBeNull();
    expect(first.items[0].name.localeCompare(first.items[1].name)).toBeGreaterThan(0);
    const second = await fixtureCatalogSource.listByCategories(POKEMON, { stock: "IN_STOCK,SOLD_OUT", sort: "name_desc", limit: 2, cursor: first.cursor ?? undefined });
    expect(second.items[0].itemId).not.toBe(first.items[0].itemId);
  });

  it("searches and finds products by item or variation id", async () => {
    const results = await fixtureCatalogSource.search("booster", { stock: "IN_STOCK", sort: "name_asc", limit: 10 });
    expect(results.items.length).toBeGreaterThan(0);
    const first = results.items[0];
    expect((await fixtureCatalogSource.getProduct(first.itemId))?.name).toBe(first.name);
    expect((await fixtureCatalogSource.getProduct(first.variationId))?.name).toBe(first.name);
    expect(await fixtureCatalogSource.getProduct("missing")).toBeNull();
  });

  it("matchesStock", () => {
    expect(matchesStock({ soldOut: true }, "SOLD_OUT")).toBe(true);
    expect(matchesStock({ soldOut: true }, "IN_STOCK")).toBe(false);
  });
});
