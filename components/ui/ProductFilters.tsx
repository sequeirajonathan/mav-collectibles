"use client";

import { CustomDropdown } from "./CustomDropdown";
import { SortOption, StockOption } from "@interfaces/square";
import type { DropdownOption } from "./CustomDropdown";
import { CATEGORY_GROUPS } from "@const/categories";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";

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

export function ProductFilters() {
  const [group, setGroup] = useQueryState("group");
  const [stock, setStock] = useQueryState("stock");
  const [sort, setSort] = useQueryState("sort");
  const [, setCategoryId] = useQueryState("categoryId");
  const [, setSearch] = useQueryState("search");
  const router = useRouter();

  function handleGroupChange(newGroup: string) {
    setGroup(newGroup);
    setCategoryId(null);
    setSearch(null);
    router.push(`/products?group=${newGroup}`);
  }

  return (
    <div className="sticky top-0 z-20 -mx-4 px-2 sm:px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-[#E6B325]/10 mb-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {CATEGORY_GROUPS.map((g) => (
              <button
                key={g.name}
                className={`px-4 py-2 rounded font-medium border transition-all duration-200 text-sm sm:text-base w-full sm:w-auto ${
                  group === g.name
                    ? "bg-[#E6B325] text-black border-[#E6B325]"
                    : "bg-transparent text-[#E6B325] border-[#E6B325]/30 hover:bg-[#E6B325]/10"
                }`}
                onClick={() => handleGroupChange(g.name)}
              >
                {g.name}
              </button>
            ))}
          </div>
          <div className="flex flex-row gap-2 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0">
            <CustomDropdown
              options={stockOptions}
              value={(stock || "IN_STOCK") as StockOption}
              onChange={(value) => setStock(value)}
              className="flex-1 min-w-0"
            />
            <CustomDropdown
              options={sortOptions}
              value={(sort || "name_asc") as SortOption}
              onChange={(value) => setSort(value)}
              className="flex-1 min-w-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
