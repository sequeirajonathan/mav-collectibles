"use client";

import React, { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { ProductCard } from "./ProductCard";
import { SkeletonProductCard } from "./SkeletonProductCard";
import { useInfiniteCatalogItemsBySlug } from "@hooks/useSquareServices";
import type { NormalizedCatalogItem } from "@interfaces";
import { toast } from "react-hot-toast";
import { EndOfListMessage } from "./EndOfListMessage";

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
  const [previousItemCount, setPreviousItemCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
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

  // Show toast notification when items are added in the background
  useEffect(() => {
    if (items.length > previousItemCount) {
      // Don't show toast on initial load
      if (!isInitialLoad) {
        toast.success("More items available to view!", {
          duration: 3000,
          position: "top-right",
          style: {
            background: "#E6B325",
            color: "#000000",
          },
        });
      }
      setIsInitialLoad(false);
    }
    setPreviousItemCount(items.length);
  }, [items.length, previousItemCount, isInitialLoad]);

  if (!mounted || isLoading) {
    // initial loading: show 8 skeleton cards with a fade-in effect
    return (
      <div className="grid gap-4 mt-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 animate-fade-in">
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
      loader={hasNextPage && isFetchingNextPage ? <LoadingSpinner /> : null}
      endMessage={
        <EndOfListMessage />
      }
      scrollThreshold="10%"
      style={{ overflow: "visible" }}
      className="animate-fade-in"
    >
      <div className="grid gap-4 mt-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {items.filter(item => item && item.variationId).map((item) => (
          <ProductCard
            key={item.variationId}
            product={item}
            imageConfig={{ width: 160, height: 160, quality: 80 }}
          />
        ))}
      </div>
    </InfiniteScroll>
  );
}
