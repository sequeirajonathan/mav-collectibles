import { useQuery } from '@tanstack/react-query';
import { fetchProductById } from '@services/squareService';
import { SquareProduct } from '@interfaces';

export function useSquareProduct(productId: string) {
  return useQuery<SquareProduct | null>({
    queryKey: ['product', productId],
    queryFn: () => fetchProductById(productId),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!productId,
  });
} 