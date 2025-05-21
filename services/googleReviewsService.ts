import { axiosClient } from '@lib/axios';

export interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url: string;
}

export interface GoogleReviewsResponse {
  reviews: GoogleReview[];
  error?: string;
}

export async function getGoogleReviews(): Promise<GoogleReviewsResponse> {
  try {
    const response = await axiosClient.get('/google-reviews');
    return response.data;
  } catch (error) {
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