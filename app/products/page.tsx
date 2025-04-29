"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '@components/ui/ProductCard';
import { ProductFilters } from '@components/ui/ProductFilters';
import { useAllProducts } from '@hooks/useSquareProduct';

const IMAGE_CONFIG = {
  width: 280,
  height: 280,
  quality: 90,
} as const;

export default function ProductsPage() {
  const { data: products = [], isLoading } = useAllProducts();
  const [sortBy, setSortBy] = useState('best_selling');
  const [filterBy, setFilterBy] = useState('all');

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    if (filterBy === 'all') return true;
    return product.status === filterBy;
  }).sort((a, b) => {
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

  if (isLoading) {
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
          Trading Card Games
        </motion.h1>

        <ProductFilters
          sortBy={sortBy}
          filterBy={filterBy}
          onSortChange={setSortBy}
          onFilterChange={setFilterBy}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                image: product.imageUrls?.[0] || '',
                stockQuantity: 0 // TODO: Get from Square API
              }}
              imageConfig={IMAGE_CONFIG}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 