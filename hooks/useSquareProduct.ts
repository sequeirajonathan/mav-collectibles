import { useResource } from '@lib/swr';
import { NormalizedProductResponse } from '@interfaces';
import { toast } from 'react-hot-toast';

export function useSquareProduct(id: string) {
  return useResource<NormalizedProductResponse>(`/product/${id}`, {
    onError: (error) => {
      console.error('Failed to fetch product:', error);
      toast.error('Failed to load product details');
    }
  });
} 