"use client";

import { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, ChevronLeft } from 'lucide-react';
import { useSquareProduct } from '@hooks/useSquareProduct';

const IMAGE_CONFIG = {
  width: 500,
  height: 500,
  quality: 90,
} as const;

export default function ProductPage({ params }: { params: Promise<{ category: string; id: string }> }) {
  const resolvedParams = use(params);
  const [quantity, setQuantity] = useState(1);
  
  const { data: product, isLoading, isError } = useSquareProduct(resolvedParams.id);

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

  if (isError || !product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#E6B325] mb-4">Product Not Found</h1>
          <Link
            href={`/products/${resolvedParams.category}`}
            className="text-white hover:text-[#E6B325] transition-colors"
          >
            Return to Products
          </Link>
        </div>
      </div>
    );
  }

  const mainVariation = product.variations[0];
  const price = mainVariation?.price || product.price;
  const isAvailable = product.status === "AVAILABLE";

  return (
    <div className="min-h-[60vh] px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <Link
          href={`/products/${resolvedParams.category}`}
          className="inline-flex items-center text-[#E6B325] hover:text-[#FFD966] mb-8 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image Container */}
          <div className="relative">
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-900/50 backdrop-blur-sm border border-gray-800/50"
            >
              {!isAvailable && (
                <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">SOLD OUT</span>
                </div>
              )}
              <Image
                src={product.imageUrls?.[0] || '/placeholder.jpg'}
                alt={product.name}
                width={IMAGE_CONFIG.width}
                height={IMAGE_CONFIG.height}
                className="object-contain w-full h-full p-8"
                quality={IMAGE_CONFIG.quality}
                priority
              />
            </motion.div>
          </div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <h1 className="text-3xl font-bold text-white mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-[#E6B325]">
                  ${price.toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-gray-300 mb-8">{product.description}</p>

            {isAvailable && (
              <div className="flex items-center gap-4 mb-8">
                <div className="relative">
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="appearance-none bg-gray-900 border border-gray-800/50 hover:border-[#E6B325]/30 text-white py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:border-[#E6B325] transition-colors"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
                <button
                  className="flex-1 bg-[#E6B325] hover:bg-[#FFD966] text-black font-semibold py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
              </div>
            )}

            {/* Product Variations */}
            {product.variations.length > 1 && (
              <div className="border-t border-gray-800 pt-8">
                <h2 className="text-xl font-semibold text-white mb-4">Available Options</h2>
                <div className="space-y-2">
                  {product.variations.map((variation) => (
                    <div key={variation.id} className="flex justify-between items-center">
                      <span className="text-gray-300">{variation.name}</span>
                      <span className="text-[#E6B325] font-semibold">
                        ${variation.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SKU Information */}
            {mainVariation?.sku && (
              <div className="border-t border-gray-800 pt-8 mt-8">
                <h2 className="text-xl font-semibold text-white mb-4">Product Details</h2>
                <div>
                  <dt className="text-gray-400">SKU</dt>
                  <dd className="text-white">{mainVariation.sku}</dd>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 