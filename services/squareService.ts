import { SquareProduct } from '@interfaces';
import { QueryClient } from '@tanstack/react-query';
import { axiosClient } from '@lib/axios';

const FEATURED_CATEGORIES = ['pokemon', 'yugioh', 'dragonball', 'onepiece'];

export async function fetchAllProducts(filter?: string): Promise<SquareProduct[]> {
  try {
    const { data } = await axiosClient.get(`/api/products${filter ? `?filter=${filter}` : ''}`);
    return data.products || [];
  } catch (error) {
    console.error("Error fetching all products from API route:", error);
    return [];
  }
}

export async function fetchProductById(productId: string, category: string): Promise<SquareProduct | null> {
  try {
    const { data } = await axiosClient.get(`/api/products/${category}/${productId}`);
    return data.product ?? null;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    return null;
  }
}

export async function fetchProductsByCategory(category: string): Promise<SquareProduct[]> {
  try {
    const { data } = await axiosClient.get(`/api/products/${category}`);
    return data.products ?? [];
  } catch (error) {
    console.error(`Error fetching products for category ${category}:`, error);
    return [];
  }
}

export async function prefetchFeaturedProducts(queryClient: QueryClient): Promise<void> {
  await Promise.all(
    FEATURED_CATEGORIES.map(category => 
      queryClient.prefetchQuery({
        queryKey: ['products', category],
        queryFn: () => fetchProductsByCategory(category),
      })
    )
  );
}

export async function fetchInventoryCounts(variationIds: string[]): Promise<Record<string, number>> {
  try {
    const { data } = await axiosClient.post('/api/inventory', { variationIds });
    return data.inventory ?? {};
  } catch (error) {
    console.error('Error fetching inventory counts:', error);
    return {};
  }
}