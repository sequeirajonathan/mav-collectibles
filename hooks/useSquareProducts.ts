import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProductsByCategory, prefetchFeaturedProducts } from '@services/squareService';
import { SquareProduct } from '@interfaces';
import { useEffect } from 'react';

export function useSquareProducts(category: string) {
  return useQuery<SquareProduct[]>({
    queryKey: ['products', category],
    queryFn: () => fetchProductsByCategory(category),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function usePrefetchProducts() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    prefetchFeaturedProducts(queryClient);
  }, [queryClient]);
} 