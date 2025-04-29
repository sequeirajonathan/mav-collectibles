"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  status: 'in_stock' | 'sale' | 'sold_out' | 'AVAILABLE' | 'UNAVAILABLE';
  salePrice?: number;
  stockQuantity: number;
}

interface ProductCardProps {
  product: Product;
  imageConfig: {
    width: number;
    height: number;
    quality: number;
  };
}

export function ProductCard({ product, imageConfig }: ProductCardProps) {
  return (
    <motion.div
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
                width={imageConfig.width}
                height={imageConfig.height}
                className="object-contain max-h-full max-w-full w-auto h-auto p-4"
                quality={imageConfig.quality}
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
  );
} 