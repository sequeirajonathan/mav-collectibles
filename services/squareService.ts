import { axiosClient } from '@lib/axios';
import { SquareProduct, SquareItem } from '@interfaces';
import { QueryClient } from '@tanstack/react-query';

// Featured categories to display
const FEATURED_CATEGORIES = ['pokemon', 'yugioh', 'dragonball', 'onepiece'];

// Transform SquareItem to SquareProduct
function transformSquareItemToProduct(item: SquareItem & { imageUrls?: string[] }, category: string): SquareProduct {
  const itemData = item.itemData ?? {};
  const mainVariation = itemData.variations?.[0]?.itemVariationData ?? {};
  
  return {
    id: item.id ?? "",
    name: itemData.name ?? "Unnamed Product",
    description: itemData.description ?? "",
    price: Number(mainVariation.priceMoney?.amount ?? 0n) / 100,
    status: "AVAILABLE", // TODO: Implement proper status check
    imageIds: itemData.imageIds ?? [],
    imageUrls: item.imageUrls ?? [],
    category,
    variations: (itemData.variations ?? []).map((variation) => ({
      id: variation.id ?? "",
      name: variation.itemVariationData?.name ?? "",
      price: Number(variation.itemVariationData?.priceMoney?.amount ?? 0n) / 100,
      sku: variation.itemVariationData?.sku,
    })),
  };
}

// Fetch products by category
export async function fetchProductsByCategory(category: string): Promise<SquareProduct[]> {
  try {
    const { data } = await axiosClient.get(`/api/products/${category}`);
    return data.products;
  } catch (error) {
    console.error(`Error fetching products for category ${category}:`, error);
    throw error;
  }
}

// Fetch a single product by ID
export async function fetchProductById(productId: string, category: string): Promise<SquareProduct | null> {
  try {
    const { data } = await axiosClient.get(`/api/products/${category}/${productId}`);
    if (!data.product) return null;
    return transformSquareItemToProduct(data.product, category);
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

// Fetch all products from Square
export async function fetchAllProducts(): Promise<SquareProduct[]> {
  try {
    const { data } = await axiosClient.get('/api/products');
    return data.products;
  } catch (error) {
    console.error("Error fetching all products:", error);
    throw error;
  }
}
