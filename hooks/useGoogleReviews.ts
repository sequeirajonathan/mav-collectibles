import { useState, useEffect } from 'react';
import { getGoogleReviews, type GoogleReview } from '@services/googleReviewsService';

interface UseGoogleReviewsResult {
  reviews: GoogleReview[];
  isLoading: boolean;
  error: string | null;
}

export function useGoogleReviews(): UseGoogleReviewsResult {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const response = await getGoogleReviews();
        
        if (response.error) {
          throw new Error(response.error);
        }

        setReviews(response.reviews);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return { reviews, isLoading, error };
} 