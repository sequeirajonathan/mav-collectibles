import useSWR from 'swr';
import { fetcherPost } from '@lib/swr';
import { SquareCustomer } from '@interfaces/square';
import { toast } from 'react-hot-toast';

/**
 * Loads the signed-in user's own Square customer record. The server decides
 * which customer that is; pass the user id only so the request waits for sign-in
 * and refetches when the user changes.
 */
export function useSearchSquareCustomer(userId?: string) {
  const { data, error, isLoading } = useSWR<SquareCustomer | null>(
    userId ? ['/square/customers/search', userId] : null,
    ([url]: [string, string]) => fetcherPost(url, {}),
    {
      onError: (error) => {
        console.error('Failed to fetch customer:', error);
        toast.error('Failed to load customer information');
      }
    }
  );

  return {
    customer: data ?? undefined,
    isLoading,
    error
  };
}
