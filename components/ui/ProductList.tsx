"use client";

import { NormalizedCatalogItem } from '@interfaces';
import { ProductCard } from './ProductCard';
import { SkeletonProductCard } from './SkeletonProductCard';
import { EmptyStateMessage } from './EmptyStateMessage';
// Add image dimensions configuration
const IMAGE_CONFIG = {
  width: 160,    // Significantly reduced width
  height: 120,   // Maintaining 4:3 aspect ratio
  quality: 75,
} as const;

interface ProductListProps {
  products: NormalizedCatalogItem[];
  title?: string;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  gridCols?: number; // default to 4
}

export function ProductList({ 
  products, 
  title,
  isLoadingMore = false,
  hasNextPage = false,
  gridCols = 4,
}: ProductListProps) {
  if (!products?.length) {
    return <EmptyStateMessage />;
  }

  // Calculate skeletons needed to fill the last row
  const remainder = products.length % gridCols;
  const skeletonCount = isLoadingMore && hasNextPage
    ? (remainder === 0 ? gridCols : gridCols - remainder)
    : 0;

  return (
    <div className="w-full">
      {title && (
        <h2 className="text-2xl font-bold mb-6 text-white/90">{title}</h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {products.map((product) => (
          <div 
            key={product.variationId}
            className="animate-fadeIn"
          >
            <ProductCard 
              product={product}
              imageConfig={IMAGE_CONFIG}
            />
          </div>
        ))}
        {/* Render skeletons in the same grid */}
        {[...Array(skeletonCount)].map((_, index) => (
          <SkeletonProductCard key={`skeleton-${index}`} />
        ))}
      </div>
    </div>
  );
} 