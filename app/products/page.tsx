"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '@components/ui/ProductCard';
import { ProductFilters } from '@components/ui/ProductFilters';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  status: 'in_stock' | 'sale' | 'sold_out';
  salePrice?: number;
  stockQuantity: number;
}

// Mock data simulating Square API response
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Pokémon TCG: Crown Zenith Elite Trainer Box',
    price: 49.99,
    salePrice: 45.00,
    image: '/products/crown-zenith-elite.png',
    category: 'pokemon',
    description: 'The Legendary heroes Zacian and Zamazenta shine with new VSTAR Powers in this elite trainer box!',
    status: 'sale',
    stockQuantity: 5
  },
  {
    id: '2',
    name: 'Pokémon TCG: Scarlet & Violet-Paldean Fates Elite Trainer Box',
    price: 49.99,
    salePrice: 45.00,
    image: '/products/paldean-fates-elite.png',
    category: 'pokemon',
    description: 'Discover the mysteries of Paldea with this elite trainer box featuring special Shiny Pokémon!',
    status: 'in_stock',
    stockQuantity: 10
  },
  {
    id: '3',
    name: 'Pokémon TCG: Scarlet & Violet-Paradox Rift Booster Box',
    price: 115.00,
    image: '/products/paradox-rift-booster.png',
    category: 'pokemon',
    description: 'Explore the mysterious Paradox Pokémon in this full booster box containing 36 packs!',
    status: 'sold_out',
    stockQuantity: 0
  }
];

const IMAGE_CONFIG = {
  width: 280,
  height: 280,
  quality: 90,
} as const;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('best_selling');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    // Simulate loading products from Square API
    const timer = setTimeout(() => {
      let filteredProducts = [...MOCK_PRODUCTS];
      
      // Apply filters
      if (filterBy !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.status === filterBy);
      }
      
      // Apply sorting
      filteredProducts.sort((a, b) => {
        switch (sortBy) {
          case 'price_asc':
            return (a.salePrice || a.price) - (b.salePrice || b.price);
          case 'price_desc':
            return (b.salePrice || b.price) - (a.salePrice || a.price);
          case 'name_asc':
            return a.name.localeCompare(b.name);
          case 'name_desc':
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
      
      setProducts(filteredProducts);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [sortBy, filterBy]);

  if (loading) {
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
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              imageConfig={IMAGE_CONFIG}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 