"use client";

import { Product } from '@interfaces';
import { ProductCard } from './ProductCard';
// Add image dimensions configuration
const IMAGE_CONFIG = {
  width: 160,    // Significantly reduced width
  height: 120,   // Maintaining 4:3 aspect ratio
  quality: 75,
} as const;

interface ProductListProps {
  products: Product[];
  title?: string;
}

export function ProductList({ 
  products, 
  title
}: ProductListProps) {
  if (!products?.length) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No products found</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <h2 className="text-2xl font-bold mb-6 text-white/90">{title}</h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product}
            imageConfig={IMAGE_CONFIG}
          />
        ))}
      </div>
    </div>
  );
} 