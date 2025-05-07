"use client";

import { CustomDropdown } from "./CustomDropdown";
import { SortOption, StockOption } from "@interfaces/square";
import type { DropdownOption } from "./CustomDropdown";
import { CATEGORY_GROUPS } from "@const/categories";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface ProductFiltersProps {
  sortBy: SortOption;
  stockStatus: StockOption;
  selectedGroup: string;
  setSortBy: (value: SortOption) => void;
  setStockStatus: (value: StockOption) => void;
  setSelectedGroup: (value: string) => void;
}

const sortOptions: DropdownOption<SortOption>[] = [
  { label: "Name: A-Z", value: "name_asc" },
  { label: "Name: Z-A", value: "name_desc" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

const stockOptions: DropdownOption<StockOption>[] = [
  { label: "In Stock", value: "IN_STOCK" },
  { label: "Out of Stock", value: "SOLD_OUT" },
  { label: "All", value: "all" },
];

export function ProductFilters({
  sortBy,
  stockStatus,
  selectedGroup,
  setSortBy,
  setStockStatus,
  setSelectedGroup,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize URL with default values if no parameters are present
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let shouldUpdate = false;

    if (!params.has('group')) {
      params.set('group', 'TCG');
      shouldUpdate = true;
    }
    if (!params.has('stock')) {
      params.set('stock', 'IN_STOCK');
      shouldUpdate = true;
    }
    if (!params.has('sort')) {
      params.set('sort', 'name_asc');
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      router.replace(`/products?${params.toString()}`);
    }
  }, []); // Only run on mount

  const updateFilters = (newSort?: SortOption, newStock?: StockOption, newGroup?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newSort) {
      params.set('sort', newSort);
      setSortBy(newSort);
    }
    if (newStock) {
      params.set('stock', newStock);
      setStockStatus(newStock);
    }
    if (newGroup) {
      params.set('group', newGroup);
      setSelectedGroup(newGroup);
      // Clear categoryId when changing groups to avoid invalid combinations
      params.delete('categoryId');
    }

    // Use window.location.href for consistency with Navbar
    window.location.href = `/products?${params.toString()}`;
  };

  return (
    <div className="sticky top-0 z-20 -mx-4 px-4 py-4 bg-black/80 backdrop-blur-sm border-b border-[#E6B325]/10 mb-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_GROUPS.map((g) => (
              <button
                key={g.name}
                className={`px-4 py-2 rounded font-medium border transition-all duration-200 ${
                  selectedGroup === g.name
                    ? "bg-[#E6B325] text-black border-[#E6B325]"
                    : "bg-transparent text-[#E6B325] border-[#E6B325]/30 hover:bg-[#E6B325]/10"
                }`}
                onClick={() => updateFilters(undefined, undefined, g.name)}
              >
                {g.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <CustomDropdown
              options={stockOptions}
              value={stockStatus}
              onChange={(value) => updateFilters(undefined, value)}
            />
            <CustomDropdown
              options={sortOptions}
              value={sortBy}
              onChange={(value) => updateFilters(value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
