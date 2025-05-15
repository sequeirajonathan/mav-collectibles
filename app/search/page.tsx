"use client";

import React from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useInfiniteCatalogItemsBySearch } from "@hooks/useSquareServices";
import { ProductFilters } from "@components/ui/ProductFilters";
import { ProductCard } from "@components/ui/ProductCard";
import { SkeletonProductCard } from "@components/ui/SkeletonProductCard";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { EndOfListMessage } from "@components/ui/EndOfListMessage";

export default function SearchPage() {
  const [stock] = useQueryState("stock");
  const [sort] = useQueryState("sort");
  const [search] = useQueryState("q");
  const router = useRouter();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteCatalogItemsBySearch(
    search || "",
    stock || "IN_STOCK",
    sort || "name_asc"
  );

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  // Initial loader: 8 skeletons
  const initialLoader = (
    <div className="grid gap-4 mt-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <SkeletonProductCard key={`init-${i}`} />
      ))}
    </div>
  );

  // Next-page loader: 4 skeletons
  const nextLoader = isFetchingNextPage ? (
    <div className="grid gap-4 mt-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <SkeletonProductCard key={`next-${i}`} />
      ))}
    </div>
  ) : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#E6B325] mb-6">
        {search
          ? `Search Results for “${search}”`
          : "All Products"}
      </h1>

      <ProductFilters />

      {isLoading ? (
        initialLoader
      ) : (
        <InfiniteScroll
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
          <div className="grid gap-4 mt-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            onClick={() => router.push("/products")}
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
