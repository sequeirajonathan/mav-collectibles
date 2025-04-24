"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Define a type for our product
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

// Add image dimensions configuration
const IMAGE_CONFIG = {
  width: 160,    // Significantly reduced width
  height: 120,   // Maintaining 4:3 aspect ratio
  quality: 75,
} as const;

// Mock products data moved outside component to prevent recreation on each render
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Charizard Holo Card',
    price: 299.99,
    image: '/prismatic.jpg',
    category: 'pokemon'
  },
  {
    id: '2',
    name: 'Blue-Eyes White Dragon',
    price: 149.99,
    image: '/prismatic.jpg',
    category: 'yugioh'
  },
  {
    id: '3',
    name: 'Goku Ultra Instinct',
    price: 89.99,
    image: '/prismatic.jpg',
    category: 'dragonball'
  },
  {
    id: '4',
    name: 'Luffy Gear 5',
    price: 129.99,
    image: '/prismatic.jpg',
    category: 'onepiece'
  },
];

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setProducts(MOCK_PRODUCTS);
      setLoading(false);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      if (mounted) {
        await fetchProducts();
      }
    };

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-[#E6B325] to-[#FFD966]">
          Featured Products
        </h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="rounded-xl bg-gray-800 aspect-[4/3]" />
              <div className="mt-4 space-y-3">
                <div className="h-4 bg-gray-800 rounded w-3/4" />
                <div className="h-4 bg-gray-800 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-[#E6B325] to-[#FFD966]">
          Featured Products
        </h2>
        <div className="mt-8 text-center">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchProducts();
            }}
            className="mt-4 px-4 py-2 bg-[#E6B325] text-black rounded-lg hover:bg-[#FFD966] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <h2 className="text-2xl sm:text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-[#E6B325] to-[#FFD966]">
        Featured Products
      </h2>
      
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {products.map(product => (
          <Link href={`/products/${product.category}/${product.id}`} key={product.id}
                className="group relative block max-w-[240px] mx-auto w-full">
            <div className="relative overflow-hidden rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 
                          transition-all duration-300 group-hover:border-[#E6B325]/30 group-hover:bg-gray-900/80">
              <div className="relative aspect-[4/3] w-full overflow-hidden flex items-center justify-center bg-black/20">
                <div className="absolute inset-0 bg-gray-900/20 z-10" />
                <div className="relative w-full h-full flex items-center justify-center transform transition-transform duration-500 group-hover:scale-105">
                  <Image 
                    src={product.image} 
                    alt={product.name}
                    width={IMAGE_CONFIG.width}
                    height={IMAGE_CONFIG.height}
                    className="object-contain max-h-full max-w-full w-auto h-auto p-2"
                    quality={IMAGE_CONFIG.quality}
                    priority={product.id === '1'}
                    sizes="(max-width: 640px) 160px, (max-width: 1024px) 160px, 160px"
                  />
                </div>
              </div>
              
              <div className="p-3 relative z-10">
                <div className="flex flex-col space-y-1">
                  <h3 className="text-sm font-medium text-white/90 group-hover:text-white truncate transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-[#E6B325] font-semibold tracking-wide text-sm">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
                
                <div className="mt-2 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <span className="text-xs text-[#E6B325]/80 hover:text-[#E6B325] inline-flex items-center">
                    View Details
                    <svg className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 