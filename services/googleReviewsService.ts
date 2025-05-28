import { axiosClient } from '@lib/axios';
import { googleReviewsResponseSchema, type GoogleReviewsResponse } from '@validations/google-reviews';

export async function getGoogleReviews(): Promise<GoogleReviewsResponse> {
  try {
    const response = await axiosClient.get('/google-reviews');
    
    // Check if response data exists
    if (!response.data) {
      console.warn('No data received from Google reviews API');
      return {
        reviews: [],
        error: 'No data received from API'
      };
    }

    // Validate response format using Zod
    const result = googleReviewsResponseSchema.safeParse(response.data);
    
    if (!result.success) {
      console.warn('Invalid response format from Google reviews API:', result.error);
      return {
        reviews: [],
        error: 'Invalid response format from API'
      };
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    
    if (error instanceof Error) {
      return {
        reviews: [],
        error: error.message || 'Failed to fetch reviews'
      };
    }
    return {
      reviews: [],
      error: 'An unexpected error occurred'
    };
  }
} 