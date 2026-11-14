import type { CatalogItem, CatalogPage, Product } from "@lib/contracts/catalog";

type StockFilter = "IN_STOCK" | "SOLD_OUT" | "IN_STOCK,SOLD_OUT";

export interface ListOptions {
  stock: StockFilter;
  sort: "name_asc" | "name_desc";
  cursor?: string;
  limit: number;
}

/**
 * Where catalog data comes from. Production and dev read Square; CI and
 * offline dev read a recorded fixture of the same shape.
 */
export interface CatalogSource {
  listByCategories(categoryIds: string[], options: ListOptions): Promise<CatalogPage>;
  search(query: string, options: ListOptions): Promise<CatalogPage>;
  getProduct(id: string): Promise<Product | null>;
}

export function matchesStock(item: Pick<CatalogItem, "soldOut">, stock: StockFilter): boolean {
  if (stock === "IN_STOCK") return !item.soldOut;
  if (stock === "SOLD_OUT") return item.soldOut;
  return true;
}
