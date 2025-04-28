"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, ShoppingCart } from 'lucide-react';
import { SquareProduct } from '@interfaces';

interface ProductCardProps {
  product: SquareProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const imageUrl = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls[0] 
    : '';

  return (
    <motion.div 
      className="flex flex-col h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full pt-[100%] overflow-hidden rounded-lg bg-gray-900">
        {/* Image */}
        <div 
          className="absolute inset-0 transition-transform duration-300 ease-in-out transform"
          style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
        >
          {imageUrl && (
            <Image 
              src={imageUrl} 
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          )}
        </div>
        
        {/* Status badge */}
        {product.status === 'AVAILABLE' && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md">
            In Stock
          </div>
        )}
        
        {/* Quick view button */}
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Link 
            href={`/products/${product.id}`}
            className="bg-[#E6B325] hover:bg-[#FFD966] text-black font-semibold px-4 py-2 rounded-md transition-colors"
          >
            Quick View
          </Link>
        </div>
      </div>
      
      {/* Product info */}
      <div className="mt-4 flex flex-col flex-grow">
        <h3 className="text-white font-semibold text-lg line-clamp-2 mb-1">
          {product.name}
        </h3>
        
        {/* Rating stars - static for now */}
        <div className="flex items-center mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={14} className="text-[#E6B325] fill-[#E6B325]" />
          ))}
        </div>
        
        {/* Price */}
        <div className="text-[#E6B325] font-bold text-lg mb-3">
          ${product.price.toFixed(2)}
        </div>
        
        {/* Add to cart button */}
        <button 
          className="mt-auto flex items-center justify-center gap-2 bg-[#E6B325] hover:bg-[#FFD966] text-black font-semibold py-2 px-4 rounded-md transition-colors w-full"
        >
          <ShoppingCart size={18} />
          Add to Cart
        </button>
      </div>
    </motion.div>
  );
} 