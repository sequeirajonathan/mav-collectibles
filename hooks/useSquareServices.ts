import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type {
  NormalizedCatalogResponse,
  NormalizedProductResponse,
} from "@interfaces";
import {
  fetchCategoryItems,
  fetchProduct,
  searchProducts,
} from "@services/squareService";

const DEFAULT_QUERY_CONFIG = {
  staleTime: 0,
  refetchOnWindowFocus: true,
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnMount: true,
  refetchOnReconnect: true,
  cacheTime: 10 * 60 * 1000, // 10 minutes
};

export function useInfiniteCatalogItemsBySlug(
  slug: string,
  search: string = "",
  stock: string = "IN_STOCK",
  sort: string = "name_asc"
) {
  return useInfiniteQuery<NormalizedCatalogResponse, Error>({
    queryKey: ["catalogItemsBySlug", slug, search, stock, sort],
    queryFn: async ({ pageParam }) => {
      try {
        const result = await fetchCategoryItems(
          slug,
          pageParam as string | null,
          search,
          stock,
          sort
        );
        return result;
      } catch (err) {
        throw err;
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.cursor ?? undefined;
    },
    initialPageParam: null,
    ...DEFAULT_QUERY_CONFIG,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    enabled: Boolean(slug),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache between navigations
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
    ...DEFAULT_QUERY_CONFIG,
    enabled: true,
  });
}

export function useSquareProduct(id: string) {
  return useQuery<NormalizedProductResponse, Error>({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
    ...DEFAULT_QUERY_CONFIG,
  });
}