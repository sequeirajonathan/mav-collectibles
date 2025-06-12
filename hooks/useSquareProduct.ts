import { useResource } from '@lib/swr';
import { NormalizedProductResponse } from '@interfaces';
import { toast } from 'react-hot-toast';

export function useSquareProduct(id: string) {
  return useResource<NormalizedProductResponse>(`/product/${id}`, {
    onError: (error) => {
      console.error('Failed to fetch product:', error);
      if (error instanceof Error) {
        if (error.status === 404) {
          toast.error('Product not found');
        } else if (error.status === 500) {
          toast.error('Server error while loading product details');
        } else if (error.code === 'TIMEOUT') {
          toast.error('Request timed out while loading product details');
        } else if (error.code === 'NO_RESPONSE') {
          toast.error('Unable to connect to the server');
        } else if (error.code === 'INVALID_FORMAT') {
          toast.error('Invalid data format received from server');
        } else {
          toast.error(error.message || 'Failed to load product details');
        }
      } else {
        toast.error('Failed to load product details');
      }
    }
  });
} 