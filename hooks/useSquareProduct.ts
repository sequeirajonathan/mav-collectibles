import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProductById,
  fetchAllProducts,
  fetchProductsByCategory,
  prefetchFeaturedProducts,
  fetchInventoryCounts,
} from "@services/squareService";

import { SquareProduct } from "@interfaces";
import { useEffect } from "react";
import { STALE_TIME } from "@const";

export function useSquareProduct(productId: string, category: string) {
  return useQuery<SquareProduct | null>({
    queryKey: ["product", category, productId],
    queryFn: () => fetchProductById(productId, category),
    staleTime: STALE_TIME,
    enabled: !!productId && !!category,
  });
}

export function useAllProducts(filter?: string) {
  return useQuery<SquareProduct[]>({
    queryKey: ["products", "all", filter],
    queryFn: () => fetchAllProducts(filter),
    staleTime: STALE_TIME,
  });
}

export function useProductsByCategory(category: string) {
  return useQuery<SquareProduct[]>({
    queryKey: ["products", category],
    queryFn: () => fetchProductsByCategory(category),
    staleTime: STALE_TIME,
    enabled: !!category,
  });
}

export function usePrefetchProducts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    prefetchFeaturedProducts(queryClient);
  }, [queryClient]);
}

export function useInventoryCounts(variationIds: string[]) {
  return useQuery({
    queryKey: ["inventory", variationIds],
    queryFn: () => fetchInventoryCounts(variationIds),
    enabled: variationIds.length > 0,
    staleTime: STALE_TIME,
  });
}
