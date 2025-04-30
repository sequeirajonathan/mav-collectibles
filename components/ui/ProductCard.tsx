"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@contexts/CartContext';
import toast from 'react-hot-toast';

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
  sizes?: string;
  imageConfig?: {
    width: number;
    height: number;
    quality: number;
  };
}

export function ProductCard({ 
  product, 
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  imageConfig
}: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const itemToAdd = {
        id: product.id,
        name: product.name,
        price: product.salePrice || product.price,
        imageUrl: product.image,
      };
      
      addItem(itemToAdd);
      
      toast.success(`${product.name} added to cart!`, {
        position: 'top-right',
        duration: 2000,
      });
    } catch {
      toast.error('Failed to add item to cart');
    }
  };

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
          
          {product.status === 'sold_out' && (
            <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-lg">SOLD OUT</span>
            </div>
          )}
          
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <div className={`relative ${imageConfig ? 'w-full h-full' : 'absolute inset-0'}`}>
              <Image
                src={product.image || '/images/placeholder.png'}
                alt={product.name}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes={sizes}
                {...(imageConfig ? {
                  width: imageConfig.width,
                  height: imageConfig.height,
                  quality: imageConfig.quality
                } : {
                  fill: true
                })}
              />
            </div>
          </div>
            
          {product.status !== 'sold_out' && (
            <motion.div 
              className="absolute inset-0 bg-black/40 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              initial={false}
            >
              <span className="text-white font-semibold text-lg">View Details</span>
            </motion.div>
          )}
          
          <div className="p-4">
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
                  type="button"
                  onClick={handleAddToCart}
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