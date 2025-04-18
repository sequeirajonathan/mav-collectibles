import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, fetchProductById, fetchProductsByCategory, Product } from '@/services/api';
import axiosClient from '@/lib/axios';

// Hook for fetching all products
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
};

// Hook for fetching a single product
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id),
    enabled: !!id, // Only run the query if id is provided
  });
};

// Hook for fetching products by category
export const useProductsByCategory = (category: string) => {
  return useQuery({
    queryKey: ['products', 'category', category],
    queryFn: () => fetchProductsByCategory(category),
    enabled: !!category, // Only run the query if category is provided
  });
};

// Example mutation hook for adding a product (if you have an admin section)
export const useAddProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newProduct: Omit<Product, 'id'>) => 
      axiosClient.post('/products', newProduct),
    onSuccess: () => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}; 