import axiosClient from '@/lib/axios';

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

// API functions
export const fetchProducts = async (): Promise<Product[]> => {
  const response = await axiosClient.get('/products');
  return response.data;
};

export const fetchProductById = async (id: string): Promise<Product> => {
  const response = await axiosClient.get(`/products/${id}`);
  return response.data;
};

export const fetchProductsByCategory = async (category: string): Promise<Product[]> => {
  const response = await axiosClient.get(`/products/category/${category}`);
  return response.data;
};

export const fetchCategories = async (): Promise<Category[]> => {
  const response = await axiosClient.get('/categories');
  return response.data;
};

// Add more API functions as needed 