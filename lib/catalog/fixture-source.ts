import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { catalogItemSchema, productSchema, type CatalogItem } from "@lib/contracts/catalog";
import { matchesStock, type CatalogSource, type ListOptions } from "./source";
import { isPublicCatalogItem } from "./visibility";

const fixtureSchema = z.object({ items: z.array(catalogItemSchema), products: z.array(productSchema) });
type Fixture = z.infer<typeof fixtureSchema>;

let loaded: Promise<Fixture> | undefined;
function fixture(): Promise<Fixture> {
  loaded ??= readFile(path.join(process.cwd(), "tests/fixtures/catalog.json"), "utf8").then((raw) =>
    fixtureSchema.parse(JSON.parse(raw))
  ).then((data) => {
    // Same rule as the live catalog: only items in a category on the shop menu.
    const items = data.items.filter((i) => isPublicCatalogItem({ name: i.name, description: i.description, categoryIds: [i.categoryId] }));
    const ids = new Set(items.map((i) => i.itemId));
    return { items, products: data.products.filter((p) => ids.has(p.id)) };
  });
  return loaded;
}

function page(items: CatalogItem[], options: ListOptions) {
  const sorted = items
    .filter((i) => matchesStock(i, options.stock))
    .sort((a, b) => (options.sort === "name_desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)));
  const start = options.cursor ? Number(options.cursor) : 0;
  const slice = sorted.slice(start, start + options.limit);
  const next = start + options.limit;
  return { items: slice, cursor: next < sorted.length ? String(next) : null };
}

/** Serves the recorded catalog in tests/fixtures/catalog.json. */
export const fixtureCatalogSource: CatalogSource = {
  async listByCategories(categoryIds, options) {
    const { items } = await fixture();
    return page(items.filter((i) => i.categoryId && categoryIds.includes(i.categoryId)), options);
  },
  async search(query, options) {
    const { items } = await fixture();
    const q = query.toLowerCase();
    return page(items.filter((i) => i.name.toLowerCase().includes(q)), options);
  },
  async getProduct(id) {
    const { products } = await fixture();
    return products.find((p) => p.id === id || p.variations.some((v) => v.id === id)) ?? null;
  },
};
