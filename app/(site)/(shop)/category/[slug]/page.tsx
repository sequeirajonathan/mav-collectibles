import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@components/hub/page-header";
import { CatalogGrid } from "@components/shop/catalog-grid";
import { CatalogFilters } from "@components/shop/catalog-filters";
import { ProductGridSkeleton } from "@components/shop/product-card";
import { categoryIdsFor, listCategory } from "@lib/data/catalog";
import { CATEGORY_MAPPING, COLLECTIBLES_MAPPING, SUPPLIES_MAPPING } from "@const/categories";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ group?: string }>;

const ALL = [...Object.values(CATEGORY_MAPPING), ...Object.values(COLLECTIBLES_MAPPING), ...Object.values(SUPPLIES_MAPPING)];
const titleFor = (slug: string) => (slug === "tcg" ? "Trading card games" : (ALL.find((c) => c.slug === slug)?.displayName ?? "Products"));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: titleFor((await params).slug) };
}

async function Products({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ slug }, { group }] = await Promise.all([params, searchParams]);
  if (!categoryIdsFor(slug, group)) notFound();
  const initialPage = await listCategory(slug, group, { stock: "IN_STOCK", sort: "name_asc", limit: 24 }).catch(() => null);
  return <CatalogGrid source={{ kind: "category", slug, group }} initialPage={initialPage} />;
}

async function Title({ params }: { params: Params }) {
  return <PageHeader eyebrow="Shop" title={titleFor((await params).slug)} />;
}

export default function CategoryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  return (
    <>
      <Suspense fallback={<div className="mb-6 h-14" />}>
        <Title params={params} />
      </Suspense>
      <Suspense fallback={<div className="mb-5 h-10" />}>
        <CatalogFilters />
      </Suspense>
      <Suspense fallback={<ProductGridSkeleton />}>
        <Products params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
