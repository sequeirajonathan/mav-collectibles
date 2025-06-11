"use client";

import { CustomDropdown } from "./CustomDropdown";
import { SortOption, StockOption } from "@interfaces/square";
import type { DropdownOption } from "./CustomDropdown";
import { useQueryState } from "nuqs";
import React from "react";
import AnimatedSearchBar from "@components/ui/AnimatedSearchBar";

const sortOptions: DropdownOption<SortOption>[] = [
  { label: "Name: A-Z", value: "name_asc" },
  { label: "Name: Z-A", value: "name_desc" },
];

const stockCheckboxOptions: { label: string; value: StockOption }[] = [
  { label: "In Stock", value: "IN_STOCK" },
  { label: "Out of Stock", value: "SOLD_OUT" },
];

export function ProductFilters() {
  const [stock, setStock] = useQueryState("stock");
  const [sort, setSort] = useQueryState("sort");

  // Parse stock as array
  const selectedStock = React.useMemo(() => {
    if (!stock) return ["IN_STOCK"];
    if (stock === "all") return ["IN_STOCK", "SOLD_OUT"];
    return stock.split(",");
  }, [stock]);

  function handleStockChange(option: StockOption) {
    let newStock: string[];
    if (selectedStock.includes(option)) {
      newStock = selectedStock.filter((s) => s !== option);
    } else {
      newStock = [...selectedStock, option];
    }
    // If none selected, default to IN_STOCK
    if (newStock.length === 0) newStock = ["IN_STOCK"];
    setStock(newStock.join(","));
  }

  return (
    <div className="sticky top-0 z-20 -mx-4 px-2 sm:px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-[#E6B325]/10 mb-8">
      <AnimatedSearchBar />
      <div className="max-w-7xl mx-auto mt-12">
        <div className="flex flex-row gap-4 w-full sm:w-auto mt-2 sm:mt-0 justify-end items-center">
          <div className="flex gap-2 items-center">
            {stockCheckboxOptions.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-1 text-[#E6B325] text-sm font-medium cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStock.includes(opt.value)}
                  onChange={() => handleStockChange(opt.value)}
                  className="accent-[#E6B325] w-4 h-4 rounded"
                />
                {opt.label}
              </label>
            ))}
          </div>
          <CustomDropdown
            options={sortOptions}
            value={(sort || "name_asc") as SortOption}
            onChange={(value) => setSort(value)}
            className="flex-1 min-w-0"
          />
        </div>
      </div>
    </div>
  );
}
