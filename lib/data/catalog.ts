import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { serverEnv } from "@lib/env.server";
import { catalogPageSchema, productSchema, type CatalogPage, type Product } from "@lib/contracts/catalog";
import type { CatalogSource, ListOptions } from "@lib/catalog/source";
import { CATEGORY_MAPPING, COLLECTIBLES_MAPPING, SUPPLIES_MAPPING, CATEGORY_GROUP_SLUGS } from "@const/categories";
import { searchIndex, searchIndexReady, syncSearchIndex } from "@lib/catalog/search-index";
import { tags } from "./tags";

async function source(): Promise<CatalogSource> {
  if (serverEnv().CATALOG_SOURCE === "fixtures") {
    const { fixtureCatalogSource } = await import("@lib/catalog/fixture-source");
    return fixtureCatalogSource;
  }
  const { squareCatalogSource } = await import("@lib/catalog/square-source");
  return squareCatalogSource;
}

const GROUP_MAPPINGS = { TCG: CATEGORY_MAPPING, COLLECTIBLES: COLLECTIBLES_MAPPING, SUPPLIES: SUPPLIES_MAPPING } as const;
const ALL = [...Object.values(CATEGORY_MAPPING), ...Object.values(COLLECTIBLES_MAPPING), ...Object.values(SUPPLIES_MAPPING)];

/** Square category IDs for a site category slug, or null if the slug is unknown. */
export function categoryIdsFor(slug: string, group?: string): string[] | null {
  if (slug === "tcg") return Object.values(CATEGORY_MAPPING).map((c) => c.squareCategoryId);
  if (CATEGORY_GROUP_SLUGS[slug]) return CATEGORY_GROUP_SLUGS[slug];
  if (group && group in GROUP_MAPPINGS) {
    const match = GROUP_MAPPINGS[group as keyof typeof GROUP_MAPPINGS][slug];
    if (match) return [match.squareCategoryId];
  }
  const match = ALL.find((c) => c.slug === slug);
  return match ? [match.squareCategoryId] : null;
}

export async function listCategory(slug: string, group: string | undefined, options: ListOptions): Promise<CatalogPage | null> {
  "use cache";
  cacheTag(tags.catalog);
  cacheLife("minutes");
  const ids = categoryIdsFor(slug, group);
  if (!ids) return null;
  return catalogPageSchema.parse(await (await source()).listByCategories(ids, options));
}

export async function searchCatalog(query: string, options: ListOptions): Promise<CatalogPage> {
  "use cache";
  cacheTag(tags.catalog);
  cacheLife("minutes");
  const catalog = await source();
  // The shop's own index gives better matches; until it has been built, ask the catalog directly.
  const page = (await searchIndexReady().catch(() => false)) ? await searchIndex(catalog, query, options) : await catalog.search(query, options);
  return catalogPageSchema.parse(page);
}

/** Rebuilds the search index from the live catalog (Admin → Site, and the daily job). */
export async function refreshSearchIndex(): Promise<{ itemCount: number }> {
  return syncSearchIndex(await source());
}

export async function getProduct(id: string): Promise<Product | null> {
  "use cache";
  cacheTag(tags.catalog);
  cacheLife("minutes");
  const product = await (await source()).getProduct(id);
  return product ? productSchema.parse(product) : null;
}
