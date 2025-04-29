import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProductById, fetchAllProducts, fetchProductsByCategory, prefetchFeaturedProducts } from '@services/squareService';
import { SquareProduct } from '@interfaces';
import { useEffect } from 'react';

export function useSquareProduct(productId: string, category: string) {
  return useQuery<SquareProduct | null>({
    queryKey: ['product', category, productId],
    queryFn: () => fetchProductById(productId, category),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!productId && !!category,
  });
}

export function useAllProducts() {
  return useQuery<SquareProduct[]>({
    queryKey: ['products', 'all'],
    queryFn: fetchAllProducts,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useProductsByCategory(category: string) {
  return useQuery<SquareProduct[]>({
    queryKey: ['products', category],
    queryFn: () => fetchProductsByCategory(category),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!category,
  });
}

export function usePrefetchProducts() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    prefetchFeaturedProducts(queryClient);
  }, [queryClient]);
} 