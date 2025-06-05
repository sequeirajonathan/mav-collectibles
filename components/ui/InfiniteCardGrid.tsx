"use client";

import React, { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { ProductCard } from "./ProductCard";
import { SkeletonProductCard } from "./SkeletonProductCard";
import type { NormalizedCatalogItem, NormalizedCatalogResponse } from "@interfaces";
import { toast } from "react-hot-toast";
import { EndOfListMessage } from "./EndOfListMessage";
import { EmptyStateMessage } from "./EmptyStateMessage";

// Enhanced loading indicator component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-8 space-y-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    <p className="text-sm text-gray-500 animate-pulse">Loading more items...</p>
  </div>
);

interface InfiniteCardGridProps {
  data?: NormalizedCatalogResponse[];
  isLoading: boolean;
  isError: boolean;
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export function InfiniteCardGrid({
  data,
  isLoading,
  isError,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: InfiniteCardGridProps) {
  const [mounted, setMounted] = useState(false);
  const [previousItemCount, setPreviousItemCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  
  useEffect(() => setMounted(true), []);

  // Process items from data pages
  const items: NormalizedCatalogItem[] = React.useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.flatMap((page) => {
      if (!page?.items) return [];
      return page.items;
    });
  }, [data]);

  // Reset state when data changes significantly
  useEffect(() => {
    if (Array.isArray(data) && data[0]?.items?.[0]?.categoryId) {
      const newSlug = data[0].items[0].categoryId;
      if (newSlug !== currentSlug) {
        setCurrentSlug(newSlug);
        setPreviousItemCount(0);
        setIsInitialLoad(true);
      }
    }
  }, [data, currentSlug]);

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

  // Show loading state for initial load
  if (!mounted || isLoading) {
    return (
      <div className="grid gap-4 mt-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 animate-fade-in">
        {[...Array(8)].map((_, i) => (
          <SkeletonProductCard key={`init-${i}`} />
        ))}
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <EmptyStateMessage 
        title="Failed to load products"
        buttonText="Try Again"
        onButtonClick={() => {
          setIsInitialLoad(true);
          fetchNextPage();
        }}
      />
    );
  }

  // Show empty state
  if (items.length === 0) {
    return <EmptyStateMessage />;
  }

  return (
    <InfiniteScroll
      dataLength={items.length}
      next={() => {
        if (!isFetchingNextPage && hasNextPage) {
          fetchNextPage();
        }
      }}
      hasMore={hasNextPage}
      loader={isFetchingNextPage ? <LoadingSpinner /> : null}
      endMessage={
        !hasNextPage && !isFetchingNextPage ? (
          <EndOfListMessage />
        ) : null
      }
      scrollThreshold="20%"
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
