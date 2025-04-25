"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronDown, ShoppingCart } from 'lucide-react';

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

const IMAGE_CONFIG = {
  width: 280,
  height: 280,
  quality: 90,
} as const;

interface DropdownProps {
  options: { label: string; value: string; }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function CustomDropdown({ options, value, onChange, className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-48 bg-black border border-[#E6B325]/30 text-[#E6B325] py-2 px-4 rounded-lg 
                 flex items-center justify-between
                 focus:outline-none focus:border-[#E6B325] hover:border-[#E6B325] transition-colors"
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-48 bg-black border border-[#E6B325]/30 rounded-lg overflow-hidden z-40 shadow-lg shadow-black/50">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 transition-colors
                          ${option.value === value 
                            ? 'bg-[#E6B325]/10 text-[#E6B325]' 
                            : 'text-[#E6B325] hover:bg-[#E6B325]/10'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

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

        <div className="sticky top-0 z-20 -mx-4 px-4 py-4 bg-black/80 backdrop-blur-sm border-b border-[#E6B325]/10 mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-end items-center gap-4">
              <div className="flex flex-row gap-4">
                <CustomDropdown
                  options={filterOptions}
                  value={filterBy}
                  onChange={setFilterBy}
                />
                <CustomDropdown
                  options={sortOptions}
                  value={sortBy}
                  onChange={setSortBy}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="group relative block max-w-[280px] mx-auto w-full"
            >
              {product.status === 'sale' && (
                <div className="absolute -top-5 -left-2 z-10 bg-[#E6B325] text-black px-3 py-1 rounded-md text-sm font-bold shadow-lg">
                  SALE
                </div>
              )}
              <Link 
                href={`/products/${product.category}/${product.id}`}
                className="block h-full"
              >
                <div className="relative flex flex-col h-full overflow-hidden rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 
                              transition-all duration-300 group-hover:border-[#E6B325]/30 group-hover:bg-gray-900/80">
                  <div className="relative aspect-square w-full overflow-hidden">
                    {product.status === 'sold_out' && (
                      <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">SOLD OUT</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gray-900/20 z-10" />
                    <div className="relative w-full h-full flex items-center justify-center transform transition-transform duration-500 group-hover:scale-105">
                      <Image 
                        src={product.image} 
                        alt={product.name}
                        width={IMAGE_CONFIG.width}
                        height={IMAGE_CONFIG.height}
                        className="object-contain max-h-full max-w-full w-auto h-auto p-4"
                        quality={IMAGE_CONFIG.quality}
                      />
                    </div>
                    
                    {product.status !== 'sold_out' && (
                      <motion.div 
                        className="absolute inset-0 bg-black/40 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={false}
                      >
                        <span className="text-white font-semibold text-lg">View Details</span>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="flex flex-col flex-grow p-4 pt-6">
                    <h3 className="text-sm font-medium text-white/90 group-hover:text-white mb-2 line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2 flex-grow">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-800/50">
                      <div className="flex items-center gap-2">
                        {product.salePrice ? (
                          <>
                            <span className="text-[#E6B325] font-semibold">${product.salePrice.toFixed(2)}</span>
                            <span className="text-gray-500 line-through text-sm">${product.price.toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="text-[#E6B325] font-semibold">${product.price.toFixed(2)}</span>
                        )}
                      </div>
                      {product.status !== 'sold_out' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            // Add to cart logic here
                          }}
                          className="p-2 rounded-lg bg-[#E6B325]/10 text-[#E6B325] hover:bg-[#E6B325]/20 transition-colors"
                          aria-label="Quick add to cart"
                        >
                          <ShoppingCart size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 