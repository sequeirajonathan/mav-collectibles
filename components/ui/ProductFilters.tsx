"use client";

import { CustomDropdown } from './CustomDropdown';

interface ProductFiltersProps {
  sortBy: string;
  filterBy: string;
  onSortChange: (value: string) => void;
  onFilterChange: (value: string) => void;
}

const sortOptions = [
  { label: 'Best selling', value: 'best_selling' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Name: A-Z', value: 'name_asc' },
  { label: 'Name: Z-A', value: 'name_desc' },
];

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'In Stock', value: 'in_stock' },
  { label: 'On Sale', value: 'sale' },
  { label: 'Sold Out', value: 'sold_out' },
];

export function ProductFilters({ sortBy, filterBy, onSortChange, onFilterChange }: ProductFiltersProps) {
  return (
    <div className="sticky top-0 z-20 -mx-4 px-4 py-4 bg-black/80 backdrop-blur-sm border-b border-[#E6B325]/10 mb-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end items-center gap-4">
          <div className="flex flex-row gap-4">
            <CustomDropdown
              options={filterOptions}
              value={filterBy}
              onChange={onFilterChange}
            />
            <CustomDropdown
              options={sortOptions}
              value={sortBy}
              onChange={onSortChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 