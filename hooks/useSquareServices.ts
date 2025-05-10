import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type {
  NormalizedCatalogResponse,
  NormalizedProductResponse,
} from "@interfaces";
import {
  fetchCatalogItems,
  fetchCategoryItems,
  fetchProduct,
} from "@services/squareService";

export function useInfiniteCatalogItems(
  group: string,
  search: string = "",
  categoryId: string | null = null,
  stock: string = "IN_STOCK",
  sort: string = "name_asc"
) {
  return useInfiniteQuery<NormalizedCatalogResponse, Error>({
    queryKey: ["catalogItemsInfinite", group, search, categoryId, stock, sort],
    queryFn: ({ pageParam }) =>
      fetchCatalogItems(
        pageParam as string | null,
        group,
        search,
        categoryId,
        stock,
        sort
      ),
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    initialPageParam: null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useInfiniteCatalogItemsBySlug(
  slug: string,
  search: string = "",
  stock: string = "IN_STOCK",
  sort: string = "name_asc"
) {
  return useInfiniteQuery<NormalizedCatalogResponse, Error>({
    queryKey: ["catalogItemsBySlug", slug, search, stock, sort],
    queryFn: ({ pageParam }) =>
      fetchCategoryItems(
        slug,
        pageParam as string | null,
        search,
        stock,
        sort
      ),
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    initialPageParam: null,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useSquareProduct(id: string) {
  return useQuery<NormalizedProductResponse, Error>({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
  });
}
