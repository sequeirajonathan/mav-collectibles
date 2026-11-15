import type { Metadata } from "next";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@components/ui/page-header";
import { CatalogGrid } from "@components/shop/catalog-grid";
import { CatalogFilters } from "@components/shop/catalog-filters";
import { ProductGridSkeleton } from "@components/shop/product-card";
import { searchCatalog } from "@lib/data/catalog";
import { searchQuerySchema } from "@lib/contracts/catalog";
import { isSearchable, suggestQuery } from "@lib/catalog/search-query";

export const metadata: Metadata = { title: "Search products" };

type SearchParams = Promise<{ q?: string }>;

async function SearchBox({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  return (
    <form action="/search" className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-panel-2 px-3 transition-shadow focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30">
      <Search className="size-5 text-muted-foreground" />
      <label htmlFor="q" className="sr-only">Search products</label>
      <input id="q" name="q" type="search" defaultValue={q} placeholder="Search cards, boxes, sleeves…" className="min-h-12 w-full border-0 bg-transparent text-base outline-none" />
    </form>
  );
}

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  const parsed = searchQuerySchema.shape.query.safeParse(q);
  if (!parsed.success) return <p className="text-muted-foreground">Type something to search the catalog.</p>;
  if (!isSearchable(parsed.data)) return <p className="text-muted-foreground">Type at least 3 letters, a card name or a set, for example &ldquo;charizard&rdquo; or &ldquo;151&rdquo;.</p>;

  const options = { stock: "IN_STOCK", sort: "name_asc", limit: 24 } as const;
  let query = parsed.data;
  let initialPage = await searchCatalog(query, options).catch(() => null);
  // Nothing found: try again with likely misspellings fixed, and say so.
  let correctedFrom: string | null = null;
  if (initialPage && initialPage.items.length === 0) {
    const suggestion = suggestQuery(query);
    const retry = suggestion ? await searchCatalog(suggestion, options).catch(() => null) : null;
    if (suggestion && retry && retry.items.length > 0) {
      correctedFrom = query;
      query = suggestion;
      initialPage = retry;
    }
  }
  return (
    <>
      {correctedFrom && (
        <p role="status" className="mb-4 text-sm text-muted-foreground">
          No matches for &ldquo;{correctedFrom}&rdquo;. Showing results for <strong className="text-foreground">{query}</strong>.
        </p>
      )}
      <CatalogFilters />
      <CatalogGrid key={query} source={{ kind: "search", query }} initialPage={initialPage} />
    </>
  );
}

export default function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader eyebrow="Shop" title="Search" />
      <Suspense fallback={<div className="mb-4 h-12 rounded-xl bg-panel-2" />}>
        <SearchBox searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<ProductGridSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </>
  );
}
