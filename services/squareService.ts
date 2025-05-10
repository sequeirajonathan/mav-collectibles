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
  const { data } = await axiosClient.post("/api/products", {
    cursor,
    group,
    search,
    categoryId,
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
  const { data } = await axiosClient.post(`/api/v1/category/${slug}`, {
    cursor,
    search,
    sort,
    stock,
  });

  return data;
}

export async function fetchProduct(id: string): Promise<NormalizedProductResponse> {
  const response = await fetch(`/api/products/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  return response.json();
}
