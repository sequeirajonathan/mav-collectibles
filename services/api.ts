// Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  value: boolean;
}

// API functions using Next.js API routes 
export const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch('/api/products');
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
};

export const fetchProductById = async (id: string): Promise<Product> => {
  const response = await fetch(`/api/products/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch product ${id}`);
  return response.json();
};

export const fetchProductsByCategory = async (category: string): Promise<Product[]> => {
  const response = await fetch(`/api/products?category=${category}`);
  if (!response.ok) throw new Error(`Failed to fetch products in category ${category}`);
  return response.json();
};

export const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch('/api/categories');
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
};

export const fetchFeatureFlags = async (): Promise<FeatureFlag[]> => {
  const response = await fetch('/api/feature-flags');
  if (!response.ok) throw new Error('Failed to fetch feature flags');
  return response.json();
};