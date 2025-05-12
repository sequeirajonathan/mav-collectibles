"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@contexts/CartContext";
import toast from "react-hot-toast";
import { NormalizedCatalogItem } from "@interfaces";
import React, { useState, useEffect } from 'react';

interface ProductCardProps {
  product: NormalizedCatalogItem;
  sizes?: string;
  imageConfig: {
    width: number;
    height: number;
    quality: number;
  };
}

export function ProductCard({
  product,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  imageConfig,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  console.log(product);

  const imageUrl = product.imageUrls?.[0] || "/images/placeholder.png";

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const itemToAdd = {
        id: product.variationId,
        name: product.name,
        price: product.priceAmount / 100,
        imageUrl,
      };

      addItem(itemToAdd);

      toast.success(`${product.name} added to cart!`, {
        position: "top-right",
        duration: 2000,
      });
    } catch {
      toast.error("Failed to add item to cart");
    }
  };

  return (
    <motion.div
      initial={false}
      animate={mounted ? { opacity: 1, y: 0 } : false}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="group relative max-w-[280px] mx-auto w-full h-[420px] flex flex-col"
    >
      <Link
        href={`/product/${product.itemId}`}
        className="block h-full"
      >
        <div className="relative flex flex-col h-full overflow-hidden rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 transition-all duration-300 group-hover:border-[#E6B325]/30 group-hover:bg-gray-900/80">
          {product.soldOut && (
            <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-lg">SOLD OUT</span>
            </div>
          )}

          <motion.div
            className="aspect-[4/3] w-full bg-gradient-to-br from-black via-gray-900 to-[#E6B325] rounded-lg overflow-hidden"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative w-full h-full">
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-contain w-full h-full p-4 transition-transform duration-300 group-hover:scale-105"
                sizes={sizes}
                quality={imageConfig?.quality || 90}
                priority={false}
              />
            </div>
          </motion.div>

          <div className="p-4 flex flex-col flex-1">
            <h3 className="text-sm font-medium text-white/90 group-hover:text-white mb-2 line-clamp-2 min-h-[2.5rem]">
              {product.name}
            </h3>
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
              {product.description}
            </p>
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-800/50">
              <span className="text-[#E6B325] font-semibold">
                ${(product.priceAmount / 100).toFixed(2)}
              </span>
              {!product.soldOut && (
                <motion.button
                  type="button"
                  onClick={handleAddToCart}
                  className="p-2 rounded-lg bg-[#E6B325]/10 text-[#E6B325] hover:bg-[#E6B325]/20 transition-colors"
                  aria-label="Quick add to cart"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ShoppingCart size={18} />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
