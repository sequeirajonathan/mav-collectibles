import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type {
  NormalizedCatalogResponse,
  NormalizedProductResponse,
} from "@interfaces";
import {
  fetchCategoryItems,
  fetchProduct,
  searchProducts,
  fetchInventoryCounts,
} from "@services/squareService";


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
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!slug,
  });
}

export function useInfiniteCatalogItemsBySearch(
  search: string,
  stock: string = "IN_STOCK",
  sort: string = "name_asc"
) {
  return useInfiniteQuery<NormalizedCatalogResponse, Error>({
    queryKey: ["catalogItemsBySearch", search, stock, sort],
    queryFn: ({ pageParam }) =>
      searchProducts(
        search,
        pageParam as string | null,
        stock,
        sort
      ),
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    initialPageParam: null,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!search,
  });
}

export function useSquareProduct(id: string) {
  return useQuery<NormalizedProductResponse, Error>({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
  });
}

export function useInventoryCounts(variationIds: string[]) {
  return useQuery<Record<string, number>, Error>({
    queryKey: ["inventory", variationIds],
    queryFn: () => fetchInventoryCounts(variationIds),
    enabled: variationIds.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchIntervalInBackground: true,
  });
}
