import type { Metadata } from "next";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@components/ui/page-header";
import { CatalogGrid } from "@components/shop/catalog-grid";
import { CatalogFilters } from "@components/shop/catalog-filters";
import { ProductGridSkeleton } from "@components/shop/product-card";
import { searchCatalog } from "@lib/data/catalog";
import { searchQuerySchema } from "@lib/contracts/catalog";

export const metadata: Metadata = { title: "Search products" };

type SearchParams = Promise<{ q?: string }>;

async function SearchBox({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  return (
    <form action="/search" className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-panel-2 px-3 focus-within:border-gold">
      <Search className="size-5 text-muted-foreground" />
      <label htmlFor="q" className="sr-only">Search products</label>
      <input id="q" name="q" type="search" defaultValue={q} placeholder="Search cards, boxes, sleeves…" className="min-h-12 w-full bg-transparent text-base outline-none" />
    </form>
  );
}

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  const parsed = searchQuerySchema.shape.query.safeParse(q);
  if (!parsed.success) return <p className="text-muted-foreground">Type something to search the catalog.</p>;
  const initialPage = await searchCatalog(parsed.data, { stock: "IN_STOCK", sort: "name_asc", limit: 24 }).catch(() => null);
  return (
    <>
      <CatalogFilters />
      <CatalogGrid source={{ kind: "search", query: parsed.data }} initialPage={initialPage} />
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
