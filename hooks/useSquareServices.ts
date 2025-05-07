import { useInfiniteQuery } from "@tanstack/react-query";
import type { NormalizedCatalogResponse } from "@interfaces";
import { fetchCatalogItems, fetchProduct } from "@services/squareService";
import { useQuery } from '@tanstack/react-query';

export function useInfiniteCatalogItems(
  group: string, 
  search: string = "",
  categoryId: string | null = null
) {
  return useInfiniteQuery<NormalizedCatalogResponse, Error>({
    queryKey: ["catalogItemsInfinite", group, search, categoryId],
    queryFn: ({ pageParam }) => 
      fetchCatalogItems(
        pageParam as string | null, 
        group, 
        search,
        categoryId
      ),
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    initialPageParam: null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useSquareProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
  });
}
