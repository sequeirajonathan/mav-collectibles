import { axiosClient } from '@lib/axios';
import { SquareProduct } from '@interfaces';
import { QueryClient } from '@tanstack/react-query';

// Featured categories to display
const FEATURED_CATEGORIES = ['pokemon', 'yugioh', 'dragonball', 'onepiece'];

// Fetch products by category from our internal API
export async function fetchProductsByCategory(category: string): Promise<SquareProduct[]> {
  try {
    const { data } = await axiosClient.get('/api/products', {
      params: { category }
    });
    return data.products;
  } catch (error) {
    console.error("Error fetching products from API:", error);
    throw error;
  }
}

// Fetch a single product by ID
export async function fetchProductById(productId: string): Promise<SquareProduct | null> {
  try {
    const { data } = await axiosClient.get(`/api/products/${productId}`);
    return data.product || null;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    return null;
  }
}

// Prefetch all featured categories
export async function prefetchFeaturedProducts(queryClient: QueryClient): Promise<void> {
  await Promise.all(
    FEATURED_CATEGORIES.map(category => 
      queryClient.prefetchQuery({
        queryKey: ['products', category],
        queryFn: () => fetchProductsByCategory(category)
      })
    )
  );
}
