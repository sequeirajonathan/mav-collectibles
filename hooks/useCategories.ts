import { useQuery } from "@tanstack/react-query";
import { axiosClient } from "@lib/axios";
import { CategoryGroup, SquareCategory } from "@interfaces";

interface CategoriesResponse {
  categories: Record<string, SquareCategory>;
  groups: Record<string, SquareCategory[]>;
  categoryGroups: CategoryGroup[];
}

export function useCategories() {
  return useQuery<CategoriesResponse>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await axiosClient.get("/api/v1/categories");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });
} 