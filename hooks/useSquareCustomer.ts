import useSWR from 'swr';
import { toast } from 'react-hot-toast';
import { fetcherPost } from '@lib/swr';

interface SquareCustomer {
  id: string;
  emailAddress: string;
  givenName: string;
  familyName: string;
  phoneNumber: string;
  address?: {
    addressLine1: string;
    addressLine2?: string;
    locality: string;
    postalCode: string;
  };
}

interface SearchResponse {
  customers: SquareCustomer[];
}

export function useSquareCustomer(phoneNumber?: string) {
  const { data, error, isLoading, mutate } = useSWR<SearchResponse>(
    phoneNumber ? ['/search-square-customer', { phoneNumber }] : null,
    ([url, body]) => fetcherPost(url, body),
    {
      onError: (error: Error) => {
        console.error('Error fetching customer data:', error);
        toast.error('Failed to load customer information');
      }
    }
  );

  const customer = data?.customers?.[0] || null;

  return {
    customer,
    error,
    isLoading,
    refresh: mutate
  };
} 