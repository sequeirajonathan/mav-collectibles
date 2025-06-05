import useSWRInfinite from "swr/infinite";
import { fetcherPost } from '@lib/swr';
import type {
  NormalizedCatalogItem,
  NormalizedCatalogResponse,
} from "@interfaces";

export function useInfiniteCatalogItemsBySearch(
  search: string,
  stock: string = "IN_STOCK",
  sort: string = "name_asc"
) {
  const getKey = (
    pageIndex: number,
    previousPageData: NormalizedCatalogResponse | null
  ) => {
    if (!search) return null;
    if (previousPageData && previousPageData.cursor === null) return null;
    return [
      "/search",
      {
        search,
        stock,
        sort,
        cursor: previousPageData?.cursor ?? null,
      },
    ];
  };

  const {
    data,
    error,
    size,
    setSize,
    isValidating,
  } = useSWRInfinite<NormalizedCatalogResponse>(getKey, ([url, body]) => fetcherPost(url, body), {
    revalidateFirstPage: false,
  });

  const items: NormalizedCatalogItem[] = data
    ? data.flatMap((page) => page.items)
    : [];

  const lastPage = data ? data[data.length - 1] : null;
  const hasNextPage = Boolean(lastPage && lastPage.cursor !== null);

  return {
    data,
    items,
    isLoading: !data && !error,
    isError: Boolean(error),
    isFetchingNextPage: isValidating,
    hasNextPage,
    fetchNextPage: (): Promise<unknown> => {
      if (hasNextPage) {
        return setSize(size + 1);
      }
      return Promise.resolve(undefined);
    },
  };
} 