import { useQuery } from '@tanstack/react-query';
import { getGoogleReviews } from '@services/googleReviewsService';

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url: string;
}

interface UseGoogleReviewsResult {
  reviews: GoogleReview[];
  isLoading: boolean;
  error: string | null;
  isError: boolean;
}

export function useGoogleReviews(): UseGoogleReviewsResult {
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['googleReviews'],
    queryFn: async () => {
      try {
        const result = await getGoogleReviews();
        if (!result) {
          throw new Error('No data received from Google Reviews API');
        }
        return result;
      } catch (err) {
        console.error('Error fetching Google reviews:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle API error response
  const apiError = data?.error;
  const errorMessage = error 
    ? (error instanceof Error ? error.message : 'Failed to fetch reviews')
    : apiError || null;

  return {
    reviews: data?.reviews || [],
    isLoading,
    error: errorMessage,
    isError: isError || !!apiError,
  };
} 