import { z } from 'zod';

const googleReviewSchema = z.object({
  author_name: z.string(),
  rating: z.number().min(1).max(5),
  text: z.string(),
  time: z.number(),
  profile_photo_url: z.string().url(),
});

export const googleReviewsResponseSchema = z.object({
  reviews: z.array(googleReviewSchema),
  error: z.string().optional(),
});

export type GoogleReviewsResponse = z.infer<typeof googleReviewsResponseSchema>; 