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
  const { data } = await axiosClient.post("/products", {
    cursor,
    group,
    search,
    categoryId,
    stock,
    sort,
  });

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
  const { data } = await axiosClient.post(`/category/${slug}`, {
    cursor,
    search,
    sort,
    stock,
  });

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
  const { data } = await axiosClient.post("/inventory", {
    variationIds,
  });
  return data.inventory;
}
