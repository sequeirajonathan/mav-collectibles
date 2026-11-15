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
/** A catalog item with what the search index needs on top. */
export type IndexableItem = CatalogItem & { variationIds: string[] };

export interface CatalogSource {
  listByCategories(categoryIds: string[], options: ListOptions): Promise<CatalogPage>;
  search(query: string, options: ListOptions): Promise<CatalogPage>;
  getProduct(id: string): Promise<Product | null>;
  /** Every public item, for building the search index. */
  listAll(): Promise<IndexableItem[]>;
  /** Current stock per variation ID, when the source can say (Square); absent means "use the indexed value". */
  liveStock?(variationIds: string[]): Promise<Map<string, number>>;
}

export function matchesStock(item: Pick<CatalogItem, "soldOut">, stock: StockFilter): boolean {
  if (stock === "IN_STOCK") return !item.soldOut;
  if (stock === "SOLD_OUT") return item.soldOut;
  return true;
}
