"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useInfiniteCatalogItemsBySearch } from "@hooks/useInfiniteCatalogItemsBySearch";
import { InfiniteCardGrid } from "@components/ui/InfiniteCardGrid";
import { ProductFilters } from "@components/ui/ProductFilters";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const search = searchParams.get("q") || "";
  const stock = searchParams.get("stock") || "IN_STOCK";
  const sort = searchParams.get("sort") || "name_asc";

  // Store last search
  useEffect(() => {
    if (search) {
      const searchUrl = `/search?q=${encodeURIComponent(search)}${stock ? `&stock=${stock}` : ''}${sort ? `&sort=${sort}` : ''}`;
      localStorage.setItem("lastSearchUrl", searchUrl);
    }
  }, [search, stock, sort]);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCatalogItemsBySearch(search, stock, sort);

  return (
    <section className="px-4 md:px-8 lg:px-12">
      <h1 className="text-2xl font-bold mb-6">
        {search ? `Search Results for: ${search}` : "Search"}
      </h1>

      <ProductFilters />

      <InfiniteCardGrid
        data={data ?? []}
        isLoading={isLoading}
        isError={isError}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </section>
  );
}
