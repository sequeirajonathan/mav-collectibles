import { useResource } from '@lib/swr';
import { toast } from 'react-hot-toast';

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url: string;
  response?: string | { text: string };
}

interface GoogleReviewsResponse {
  reviews: GoogleReview[];
  error?: string;
}

interface UseGoogleReviewsResult {
  reviews: GoogleReview[];
  isLoading: boolean;
  error: string | null;
  isError: boolean;
}

export function useGoogleReviews(): UseGoogleReviewsResult {
  const { data, isLoading, error } = useResource<GoogleReviewsResponse>('/google-reviews', {
    onError: (error) => {
      console.error('Error fetching Google reviews:', error);
      toast.error('Failed to load reviews');
    }
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
    isError: !!error || !!apiError,
  };
} 