import useSWRInfinite from "swr/infinite";
import { axiosClient } from "@lib/axios";
import type {
  NormalizedCatalogItem,
  NormalizedCatalogResponse,
} from "@interfaces";

const axiosFetcher = (url: string) =>
  axiosClient.get<NormalizedCatalogResponse>(url).then((r) => r.data);

export function useInfiniteCatalogItemsBySlug(slug: string, group: string) {
  const getKey = (
    pageIndex: number,
    previousPageData: NormalizedCatalogResponse | null
  ) => {
    if (!slug) return null;
    if (previousPageData && previousPageData.cursor === null) return null;
    const cursorSegment = previousPageData?.cursor
      ? `&cursor=${encodeURIComponent(previousPageData.cursor)}`
      : "";
    return `/category/${encodeURIComponent(slug)}?group=${encodeURIComponent(
      group
    )}${cursorSegment}`;
  };

  const {
    data,
    error,
    size,
    setSize,
    isValidating,
  } = useSWRInfinite<NormalizedCatalogResponse>(getKey, axiosFetcher, {
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
