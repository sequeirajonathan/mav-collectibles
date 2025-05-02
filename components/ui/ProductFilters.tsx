"use client";

import { CustomDropdown } from './CustomDropdown';
import { CATEGORY_GROUPS } from '@const/categories';

interface ProductFiltersProps {
  sortBy: string;
  filterBy: string;
  onSortChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  currentGroup: string | null;
}

const sortOptions = [
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Name: A-Z', value: 'name_asc' },
  { label: 'Name: Z-A', value: 'name_desc' },
];

// Create filter options based on current group
const getFilterOptions = (currentGroup: string | null) => {
  const baseOptions = [
    { label: 'In Stock', value: 'IN_STOCK' },
    { label: 'Out of Stock', value: 'SOLD_OUT' },
    { label: '──────────', value: 'divider', disabled: true },
  ];

  if (!currentGroup) {
    // If no group selected, show all category groups
    return [
      ...baseOptions,
      ...CATEGORY_GROUPS.map(group => ({
        label: group.name,
        value: group.name.toLowerCase().replace(/\s+/g, '-')
      }))
    ];
  }
  
  // If group selected, show only its categories
  const group = CATEGORY_GROUPS.find(g => 
    g.name.toLowerCase().replace(/\s+/g, '-') === currentGroup
  );

  if (group) {
    return [
      ...baseOptions,
      ...group.categories.map(category => ({
        label: category.displayName,
        value: category.routeName
      }))
    ];
  }

  return baseOptions;
};

export function ProductFilters({ 
  sortBy, 
  filterBy, 
  onSortChange, 
  onFilterChange,
  currentGroup 
}: ProductFiltersProps) {
  const filterOptions = getFilterOptions(currentGroup);

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