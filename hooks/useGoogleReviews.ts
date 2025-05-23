import { useQuery } from '@tanstack/react-query';
import { getGoogleReviews, type GoogleReview } from '@services/googleReviewsService';

interface UseGoogleReviewsResult {
  reviews: GoogleReview[];
  isLoading: boolean;
  error: string | null;
}

export function useGoogleReviews(): UseGoogleReviewsResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['googleReviews'],
    queryFn: getGoogleReviews,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  return {
    reviews: data?.reviews || [],
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch reviews') : null,
  };
} 