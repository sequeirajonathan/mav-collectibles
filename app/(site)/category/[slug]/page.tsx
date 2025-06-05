"use client";
import React, { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useInfiniteCatalogItemsBySlug } from "@hooks/useInfiniteCatalogItemsBySlug";
import { InfiniteCardGrid } from "@components/ui/InfiniteCardGrid";

export default function CategoryPage() {
  // 1) Grab the raw `slug` from useParams:
  const params = useParams(); // params.slug: string | string[] | undefined

  // 2) Narrow it to a string (or default to an empty string)
  const slug =
    typeof params.slug === "string" 
      ? params.slug 
      : "";

  // 3) Grab `group` from ?group=… (useSearchParams().get returns string|null)
  const rawGroup = useSearchParams().get("group");
  const group = rawGroup ?? "TCG"; // now `group` is definitely a string

  // Store last visited category
  useEffect(() => {
    if (slug) {
      const categoryUrl = `/category/${slug}${group ? `?group=${group}` : ''}`;
      localStorage.setItem("lastCategoryUrl", categoryUrl);
    }
  }, [slug, group]);

  // 4) Only call the SWR hook when `slug` is non-empty.
  //    If slug === "", we pass an empty string anyway; the hook will
  //    immediately return no data because `getKey` returns null.
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCatalogItemsBySlug(slug, group);

  return (
    <section className="px-4 md:px-8 lg:px-12">
      <h1 className="text-2xl font-bold mb-6">
        {slug ? `Category: ${slug} (Group: ${group})` : "Loading…"}
      </h1>

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
