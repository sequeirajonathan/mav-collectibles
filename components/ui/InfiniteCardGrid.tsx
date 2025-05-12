"use client";

import React, { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { ProductCard } from "./ProductCard";
import { SkeletonProductCard } from "./SkeletonProductCard";
import { useInfiniteCatalogItemsBySlug } from "@hooks/useSquareServices";
import type { NormalizedCatalogItem } from "@interfaces";

// Enhanced loading indicator component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-8 space-y-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    <p className="text-sm text-gray-500 animate-pulse">Loading more items...</p>
  </div>
);

interface InfiniteCardGridProps {
  slug: string;
  search?: string;
  stock?: string;
  sort?: string;
}

export function InfiniteCardGrid({
  slug,
  search = "",
  stock = "IN_STOCK",
  sort = "name_asc",
}: InfiniteCardGridProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteCatalogItemsBySlug(slug, search, stock, sort);

  const items: NormalizedCatalogItem[] =
    data?.pages.flatMap((p) => p.items) ?? [];

  if (!mounted || isLoading) {
    // initial loading: show 8 skeleton cards with a fade-in effect
    return (
      <div className="grid gap-6 mt-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in">
        {[...Array(8)].map((_, i) => (
          <SkeletonProductCard key={`init-${i}`} />
        ))}
      </div>
    );
  }

  return (
    <InfiniteScroll
      dataLength={items.length}
      next={() => {
        if (!isFetchingNextPage && hasNextPage) {
          fetchNextPage();
        }
      }}
      hasMore={Boolean(hasNextPage)}
      loader={<LoadingSpinner />}
      endMessage={
        <div className="text-center text-gray-400 py-12 animate-fade-in">
          <div className="text-2xl font-semibold mb-2">
            You have reached the end of the list
          </div>
        </div>
      }
      scrollThreshold="300px"
      style={{ overflow: "visible" }}
      className="animate-fade-in"
    >
      <div className="grid gap-6 mt-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <ProductCard
            key={item.variationId}
            product={item}
            imageConfig={{ width: 280, height: 280, quality: 90 }}
          />
        ))}
      </div>
    </InfiniteScroll>
  );
}
