import useSWR from 'swr';
import { fetcherPost } from '@lib/swr';
import { SquareCustomer } from '@interfaces/square';
import { toast } from 'react-hot-toast';

export function useSearchSquareCustomer(phoneNumber?: string) {
  // Convert to E.164 if it's a 10-digit US number
  const e164Phone = phoneNumber && phoneNumber.length === 10
    ? `+1${phoneNumber}`
    : phoneNumber;

  const { data, error, isLoading } = useSWR<SquareCustomer>(
    e164Phone ? '/square/customers/search' : null,
    (url) => fetcherPost(url, { phoneNumber: e164Phone }),
    {
      onError: (error) => {
        console.error('Failed to fetch customer:', error);
        toast.error('Failed to load customer information');
      }
    }
  );

  return {
    customer: data,
    isLoading,
    error
  };
} 