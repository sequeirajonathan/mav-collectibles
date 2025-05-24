"use client";

import React, { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useInfiniteCatalogItemsBySearch } from "@hooks/useSquareServices";
import { ProductFilters } from "@components/ui/ProductFilters";
import { ProductCard } from "@components/ui/ProductCard";
import { SkeletonProductCard } from "@components/ui/SkeletonProductCard";
import { useQueryState } from "nuqs";
import { useRouter, useSearchParams } from "next/navigation";
import { EndOfListMessage } from "@components/ui/EndOfListMessage";

// Enhanced loading indicator component (copied from InfiniteCardGrid)
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-8 space-y-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    <p className="text-sm text-gray-500 animate-pulse">Loading more items...</p>
  </div>
);

export default function SearchPage() {
  const [stock] = useQueryState("stock");
  const [sort] = useQueryState("sort");
  const [search] = useQueryState("q");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
    refetch,
  } = useInfiniteCatalogItemsBySearch(
    search || "",
    stock || "IN_STOCK",
    sort || "name_asc"
  );

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  useEffect(() => {
    refetch();
  }, [search, stock, sort, refetch]);

  useEffect(() => setMounted(true), []);

  // Initial loader: 8 skeletons (with fade-in and md:grid-cols-3)
  const initialLoader = (
    <div className="grid gap-4 mt-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 animate-fade-in">
      {[...Array(8)].map((_, i) => (
        <SkeletonProductCard key={`init-${i}`} />
      ))}
    </div>
  );

  // Next-page loader: spinner (for consistency)
  const nextLoader = isFetchingNextPage ? <LoadingSpinner /> : null;

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Failed to load search results</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-[#E6B325] text-black rounded-lg hover:bg-[#FFD966] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#E6B325] mb-6">
        {search
          ? `Search Results for “${search}”`
          : "All Products"}
      </h1>

      <ProductFilters />

      {/* Mount check for initial loader */}
      {!mounted || isLoading ? (
        initialLoader
      ) : (
        <InfiniteScroll
          key={`${search}-${stock}-${sort}-${searchParams.toString()}`}
          dataLength={items.length}
          next={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          hasMore={Boolean(hasNextPage)}
          loader={nextLoader}
          scrollThreshold="200px"
          style={{ overflow: "visible" }}
        >
          <div className="grid gap-4 mt-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 animate-fade-in">
            {items.map((item) => (
              <ProductCard
                key={item.variationId}
                product={item}
                imageConfig={{ width: 160, height: 160, quality: 80 }}
              />
            ))}
          </div>
        </InfiniteScroll>
      )}

      {/* No results found */}
      {!hasNextPage && !isLoading && items.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          <div className="text-2xl font-semibold mb-2">No results found</div>
          <button
            className="mt-4 px-6 py-2 rounded bg-[#E6B325] text-black font-semibold hover:bg-[#FFD966] transition"
            onClick={() => router.push("/category/tcg")}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* End of list message */}
      {!hasNextPage && items.length > 0 && <EndOfListMessage />}
    </div>
  );
}
