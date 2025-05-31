"use client";

import React, { useEffect, useCallback } from "react";
import { useQueryState } from "nuqs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ProductFilters } from "@components/ui/ProductFilters";
import { InfiniteCardGrid } from "@components/ui/InfiniteCardGrid";
import {
  CATEGORY_MAPPING,
  COLLECTIBLES_MAPPING,
  SUPPLIES_MAPPING,
} from "@const/categories";
import { useInfiniteCatalogItemsBySlug } from "@hooks/useSquareServices";

const ALL_CATEGORIES = {
  ...CATEGORY_MAPPING,
  ...COLLECTIBLES_MAPPING,
  ...SUPPLIES_MAPPING,
};

export default function CategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // read filter & sort query params
  const [stock] = useQueryState("stock");
  const [sort] = useQueryState("sort");
  const [search, setSearch] = useQueryState("q");

  // grab the slug from the URL
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const category = ALL_CATEGORIES[slug];

  // Initialize the data fetching
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteCatalogItemsBySlug(
    slug,
    search || "",
    stock || "IN_STOCK",
    sort || "name_asc"
  );

  // Memoize the fetch function
  const fetchData = useCallback(() => {
    if (slug) {
      refetch();
    }
  }, [slug, search, stock, sort, refetch]);

  // Force refetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Force refetch when parameters change
  useEffect(() => {
    if (slug) {
      fetchData();
    }
  }, [slug, search, stock, sort, fetchData]);

  // whenever we navigate to a new category, clear any free-text search
  useEffect(() => {
    if (search) {
      setSearch(null);
    }
  }, [slug, search, setSearch]);

  // Redirect if category doesn't exist
  useEffect(() => {
    if (!category && slug && slug.toLowerCase() !== "tcg") {
      router.replace('/category/tcg');
    }
  }, [category, slug, router]);

  // Reset scroll position on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Defensive: ensure all variables are always defined
  const safeData = data || null;
  const safeHasNextPage = typeof hasNextPage === 'boolean' ? hasNextPage : false;
  const safeIsFetchingNextPage = typeof isFetchingNextPage === 'boolean' ? isFetchingNextPage : false;
  const safeIsLoading = typeof isLoading === 'boolean' ? isLoading : false;
  const safeIsError = typeof isError === 'boolean' ? isError : false;

  // Log data updates
  useEffect(() => {
    // (logs removed)
  }, [safeData, safeHasNextPage, safeIsFetchingNextPage, safeIsLoading, safeIsError]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#E6B325] mb-6">
        {category?.displayName || "All TCG"}
      </h1>
      <ProductFilters />
      <InfiniteCardGrid
        data={data}
        isLoading={isLoading}
        isError={isError}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
}