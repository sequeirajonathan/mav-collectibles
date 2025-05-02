'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '@components/ui/ProductCard';
import { ProductFilters } from '@components/ui/ProductFilters';
import { useAllProducts, useInventoryCounts } from '@hooks/useSquareProduct';
import { useSearchParams } from 'next/navigation';
import { CATEGORY_GROUPS } from '@const/categories';

const IMAGE_CONFIG = {
  width: 280,
  height: 280,
  quality: 90,
} as const;

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');

  const { data: products = [], isLoading } = useAllProducts(filter || undefined);
  const [sortBy, setSortBy] = useState('best_selling');
  const [filterBy, setFilterBy] = useState<string>('all');

  const variationIds = useMemo(
    () =>
      products.flatMap(p =>
        p.variations.map(v => v.id).filter(Boolean)
      ),
    [products]
  );

  const {
    data: inventoryMap = {},
    isLoading: isInventoryLoading,
  } = useInventoryCounts(variationIds);

  const groupName = filter
    ? CATEGORY_GROUPS.find(g =>
        g.name.toLowerCase().replace(/\s+/g, '-') === filter
      )?.name
    : 'All Products';

  const enrichedProducts = products.map(product => {
    const variationId = product.variations[0]?.id;
    const quantity = variationId ? inventoryMap[variationId] ?? 0 : 0;
    return {
      ...product,
      stockQuantity: quantity,
      status: quantity > 0 ? 'AVAILABLE' as const : 'UNAVAILABLE' as const,
    };
  });

  const filteredProducts = enrichedProducts
    .filter(product => {
      if (filterBy === 'all') return true;
      return product.status === filterBy;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  if (isLoading || isInventoryLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-48 bg-gray-800 rounded mx-auto mb-4" />
          <div className="h-4 w-64 bg-gray-800 rounded mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-bold text-[#E6B325] mb-12 text-center"
        >
          {groupName}
        </motion.h1>

        <ProductFilters
          sortBy={sortBy}
          filterBy={filterBy}
          onSortChange={setSortBy}
          onFilterChange={setFilterBy}
          currentGroup={filter}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                image: product.imageUrls?.[0] || '',
              }}
              imageConfig={IMAGE_CONFIG}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
