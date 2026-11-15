"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { apiRequest } from "@lib/api/client";
import { catalogPageSchema, type CatalogPage } from "@lib/contracts/catalog";
import { ProductCard, ProductGridSkeleton } from "./product-card";
import { SORTS, STOCKS } from "./catalog-filters";
import { cardVariants } from "@components/ui/card";
import { cn } from "@utils";

type Source = { kind: "category"; slug: string; group?: string } | { kind: "search"; query: string };

/**
 * Infinite product grid. The first page is rendered on the server and passed
 * in; following pages load as the user scrolls, each response validated
 * against the catalog contract.
 */
export function CatalogGrid({ source, initialPage }: { source: Source; initialPage: CatalogPage | null }) {
  const [stock] = useQueryState("stock", parseAsStringLiteral(STOCKS).withDefault("IN_STOCK"));
  const [sort] = useQueryState("sort", parseAsStringLiteral(SORTS).withDefault("name_asc"));
  const isDefaultFilters = stock === "IN_STOCK" && sort === "name_asc";

  const query = useInfiniteQuery({
    queryKey: ["catalog", source, stock, sort],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      source.kind === "category"
        ? apiRequest(catalogPageSchema, `/catalog/category/${encodeURIComponent(source.slug)}`, {
            query: { group: source.group, stock, sort, cursor: pageParam, limit: 24 },
            signal,
          })
        : apiRequest(catalogPageSchema, "/catalog/search", {
            query: { query: source.query, stock, sort, cursor: pageParam, limit: 24 },
            signal,
          }),
    getNextPageParam: (last) => last.cursor ?? undefined,
    initialData: initialPage && isDefaultFilters ? { pages: [initialPage], pageParams: [undefined] } : undefined,
  });

  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (query.isPending) return <ProductGridSkeleton />;
  if (query.isError) {
    return (
      <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
        We couldn&apos;t load products right now. Please try again in a moment.
      </p>
    );
  }

  const items = query.data.pages.flatMap((p) => p.items);
  if (items.length === 0) {
    return <p className={cn(cardVariants({ variant: "dashed" }), "px-6 py-10 text-center text-muted-foreground")}>No products match these filters.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 fold:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item, i) => (
          <ProductCard key={item.variationId} item={item} priority={i < 4} />
        ))}
      </div>
      <div ref={sentinel} aria-hidden className="h-1" />
      {isFetchingNextPage && (
        <div className="mt-3">
          <ProductGridSkeleton count={4} />
        </div>
      )}
      {!hasNextPage && items.length > 24 && <p className="mt-6 text-center text-sm text-muted-foreground">That&apos;s everything.</p>}
    </>
  );
}
