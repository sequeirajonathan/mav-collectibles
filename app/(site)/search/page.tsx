"use client";

import React, { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useInfiniteCatalogItemsBySearch } from "@hooks/useInfiniteCatalogItemsBySearch";
import { ProductFilters } from "@components/ui/ProductFilters";
import { ProductCard } from "@components/ui/ProductCard";
import { useSearchParams } from "next/navigation";
import { NormalizedCatalogItem } from "@interfaces";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const search = searchParams.get("q") || "";
  const [stock, setStock] = useState("IN_STOCK");
  const [sort, setSort] = useState("name_asc");

  const {
    items,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteCatalogItemsBySearch(search, stock, sort);

  useEffect(() => {
    // Reset scroll position when search changes
    window.scrollTo(0, 0);
  }, [search]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E6B325]"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Failed to load products</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64">
          <ProductFilters />
        </div>
        <div className="flex-1">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-4">No products found</h2>
              <p className="text-gray-600">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <InfiniteScroll
              dataLength={items.length}
              next={fetchNextPage}
              hasMore={hasNextPage}
              loader={
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E6B325]"></div>
                </div>
              }
              endMessage={
                <p className="text-center py-4 text-gray-500">
                  No more products to load
                </p>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item: NormalizedCatalogItem) => (
                  <ProductCard
                    key={item.itemId}
                    product={item}
                    imageConfig={{
                      width: 160,
                      height: 160,
                      quality: 80
                    }}
                  />
                ))}
              </div>
            </InfiniteScroll>
          )}
        </div>
      </div>
    </div>
  );
}
