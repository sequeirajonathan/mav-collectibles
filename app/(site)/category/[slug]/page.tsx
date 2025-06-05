"use client";
import React, { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs"; // ← import useQueryState
import { useInfiniteCatalogItemsBySlug } from "@hooks/useInfiniteCatalogItemsBySlug";
import { InfiniteCardGrid } from "@components/ui/InfiniteCardGrid";
import { ProductFilters } from "@components/ui/ProductFilters";

export default function CategoryPage() {
  // 1) Grab the raw `slug` from useParams:
  const params = useParams(); // params.slug: string | string[] | undefined

  // 2) Narrow it to a string (or default to an empty string)
  const slug = typeof params.slug === "string" ? params.slug : "";

  // 3) Grab `group` from ?group=…
  const rawGroup = useSearchParams().get("group");
  const group = rawGroup ?? "TCG";

  // 4) Grab `stock` and `sort` out of the URL querystring
  //    (these match exactly the keys used by <ProductFilters />)
  const [stockQuery] = useQueryState("stock"); // e.g. "IN_STOCK" or "IN_STOCK,SOLD_OUT"
  const [sortQuery] = useQueryState("sort");   // e.g. "name_asc" or "name_desc"

  // Store last visited category in localStorage (unchanged)
  useEffect(() => {
    if (slug) {
      const categoryUrl = `/category/${slug}${group ? `?group=${group}` : ""}`;
      localStorage.setItem("lastCategoryUrl", categoryUrl);
    }
  }, [slug, group]);

  // 5) Pass slug, group, stockQuery, and sortQuery into the hook
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCatalogItemsBySlug(
    slug,
    group,
    stockQuery || undefined,
    sortQuery || undefined
  );

  return (
    <section className="px-4 md:px-8 lg:px-12">
      <h1 className="text-2xl font-bold mb-6">
        {slug ? `Category: ${slug}` : "Loading…"}
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