import useSWRInfinite from "swr/infinite";
import { axiosClient } from "@lib/axios";
import type {
  NormalizedCatalogItem,
  NormalizedCatalogResponse,
} from "@interfaces";

const axiosFetcher = (url: string) =>
  axiosClient.get<NormalizedCatalogResponse>(url).then((r) => r.data);

/**
 * Fetch an “infinite” list of items for a given category slug + group,
 * filtered/sorted by `stock` and `sort`.
 *
 * @param slug  The category slug (e.g. "pokemon")
 * @param group The category group (e.g. "TCG", "COLLECTIBLES", etc.)
 * @param stock A comma-separated stock filter, e.g. "IN_STOCK" or "IN_STOCK,SOLD_OUT"
 * @param sort  A sort key, either "name_asc" or "name_desc"
 */
export function useInfiniteCatalogItemsBySlug(
  slug: string,
  group: string,
  stock: string | undefined,
  sort: string | undefined
) {
  const getKey = (
    pageIndex: number,
    previousPageData: NormalizedCatalogResponse | null
  ) => {
    // Don’t fetch if slug is not set or we've exhausted pages
    if (!slug) return null;
    if (previousPageData && previousPageData.cursor === null) return null;

    // Build cursor segment if present
    const cursorSegment = previousPageData?.cursor
      ? `&cursor=${encodeURIComponent(previousPageData.cursor)}`
      : "";

    // Default to IN_STOCK / name_asc if undefined
    const stockParam = encodeURIComponent(stock || "IN_STOCK");
    const sortParam = encodeURIComponent(sort || "name_asc");

    // Final URL that our Next.js route will respond to:
    return `/category/${encodeURIComponent(slug)}?group=${encodeURIComponent(
      group
    )}&stock=${stockParam}&sort=${sortParam}${cursorSegment}`;
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

  // Flatten all pages’ items into one array
  const items: NormalizedCatalogItem[] = data
    ? data.flatMap((page) => page.items)
    : [];

  // Determine if there’s another page by checking last page’s cursor
  const lastPage = data ? data[data.length - 1] : null;
  const hasNextPage = Boolean(lastPage && lastPage.cursor !== null);

  return {
    data,
    items,
    isLoading: !data && !error,
    isError: Boolean(error),
    isFetchingNextPage: isValidating,
    hasNextPage,

    // Bump the page count to fetch next page (cursor-based)
    fetchNextPage: (): Promise<unknown> => {
      if (hasNextPage) {
        return setSize(size + 1);
      }
      return Promise.resolve(undefined);
    },
  };
}