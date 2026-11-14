"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";

export const STOCKS = ["IN_STOCK", "SOLD_OUT", "IN_STOCK,SOLD_OUT"] as const;
export const SORTS = ["name_asc", "name_desc"] as const;

const STOCK_LABELS: Record<(typeof STOCKS)[number], string> = {
  IN_STOCK: "In stock",
  SOLD_OUT: "Sold out",
  "IN_STOCK,SOLD_OUT": "Everything",
};

export function CatalogFilters() {
  const [stock, setStock] = useQueryState("stock", parseAsStringLiteral(STOCKS).withDefault("IN_STOCK"));
  const [sort, setSort] = useQueryState("sort", parseAsStringLiteral(SORTS).withDefault("name_asc"));
  const select = "min-h-10 rounded-lg border border-line bg-panel-2 px-3 text-sm text-foreground focus:border-gold";
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="stock-filter">Availability</label>
      <select id="stock-filter" className={select} value={stock} onChange={(e) => void setStock(STOCKS.find((s) => s === e.target.value) ?? "IN_STOCK")}>
        {STOCKS.map((s) => (
          <option key={s} value={s}>{STOCK_LABELS[s]}</option>
        ))}
      </select>
      <label className="sr-only" htmlFor="sort-filter">Sort</label>
      <select id="sort-filter" className={select} value={sort} onChange={(e) => void setSort(SORTS.find((s) => s === e.target.value) ?? "name_asc")}>
        <option value="name_asc">Name A–Z</option>
        <option value="name_desc">Name Z–A</option>
      </select>
    </div>
  );
}
