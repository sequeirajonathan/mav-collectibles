import { z } from 'zod';

// Feature Flag validation schema
export const featureFlagSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  enabled: z.boolean().default(false),
});

export type FeatureFlagInput = z.infer<typeof featureFlagSchema>;

// Feature Flag update validation schema
export const featureFlagUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
});

export type FeatureFlagUpdateInput = z.infer<typeof featureFlagUpdateSchema>;

// Alert Banner validation schema
export const alertBannerSchema = z.object({
  message: z.string().min(1, "Message is required"),
  code: z.string().optional(),
  backgroundColor: z.string().default("#E6B325"),
  textColor: z.string().default("#000000"),
  enabled: z.boolean().default(true),
});

export type AlertBannerInput = z.infer<typeof alertBannerSchema>;

// Featured Event validation schema
export const featuredEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  imageSrc: z.string().min(1, "Image source is required"),
  imageAlt: z.string().min(1, "Image alt text is required"),
  bulletPoints: z.array(z.string()).default([]),
  link: z.string().optional(),
  enabled: z.boolean().default(true),
  order: z.number().int().default(0),
});

export type FeaturedEventInput = z.infer<typeof featuredEventSchema>; 