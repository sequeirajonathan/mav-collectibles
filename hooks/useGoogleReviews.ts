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
      if (error instanceof Error) {
        if (error.status === 404) {
          toast.error('No reviews found');
        } else if (error.status === 500) {
          toast.error('Server error while loading reviews');
        } else if (error.code === 'TIMEOUT') {
          toast.error('Request timed out while loading reviews');
        } else if (error.code === 'NO_RESPONSE') {
          toast.error('Unable to connect to the server');
        } else if (error.code === 'INVALID_FORMAT') {
          toast.error('Invalid data format received from server');
        } else {
          toast.error(error.message || 'Failed to load reviews');
        }
      } else {
        toast.error('Failed to load reviews');
      }
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