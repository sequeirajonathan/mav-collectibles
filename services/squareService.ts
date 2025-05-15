import {
  NormalizedCatalogResponse,
  NormalizedProductResponse,
} from "@interfaces";
import { axiosClient } from "@lib/axios";

export async function fetchCatalogItems(
  cursor: string | null = null,
  group: string = "TCG",
  search: string = "",
  categoryId: string | null = null,
  stock: string = "IN_STOCK",
  sort: string = "name_asc"
): Promise<NormalizedCatalogResponse> {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  if (group) params.append('group', group);
  if (search) params.append('search', search);
  if (categoryId) params.append('categoryId', categoryId);
  if (stock) params.append('stock', stock);
  if (sort) params.append('sort', sort);

  const { data } = await axiosClient.get(`/products?${params.toString()}`);
  return data;
}

export async function searchProducts(
  search: string,
  cursor: string | null = null,
  stock: string = "IN_STOCK",
  sort: string = "name_asc"
): Promise<NormalizedCatalogResponse> {
  const { data } = await axiosClient.post(`/search`, {
    search,
    cursor,
    stock,
    sort,
  });
  return data;
}

export async function fetchCategoryItems(
  slug: string,
  cursor: string | null = null,
  search: string = "",
  stock: string = "IN_STOCK",
  sort: string = "name_asc"
): Promise<NormalizedCatalogResponse> {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  if (search) params.append('search', search);
  if (stock) params.append('stock', stock);
  if (sort) params.append('sort', sort);

  const { data } = await axiosClient.get(`/category/${slug}?${params.toString()}`);
  return data;
}

export async function fetchProduct(id: string): Promise<NormalizedProductResponse> {
  const response = await fetch(`/api/v1/product/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  return response.json();
}

export async function fetchInventoryCounts(variationIds: string[]): Promise<Record<string, number>> {
  const params = new URLSearchParams();
  variationIds.forEach(id => params.append('variationIds', id));
  
  const { data } = await axiosClient.get(`/inventory?${params.toString()}`);
  return data.inventory;
}
