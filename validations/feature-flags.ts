import { z } from 'zod';
import { idSchema, dateSchema, nonEmptyStringSchema } from "./base";

// Feature Flag validation schema
export const featureFlagSchema = z.object({
  id: idSchema,
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  enabled: z.boolean().default(false),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

export type FeatureFlag = z.infer<typeof featureFlagSchema>;

export const createFeatureFlagSchema = featureFlagSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFeatureFlagSchema = createFeatureFlagSchema.partial();

// Feature Flag update validation schema
export const featureFlagUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
});

export type FeatureFlagUpdateInput = z.infer<typeof featureFlagUpdateSchema>;

// Alert Banner validation schema
export const featureFlagAlertBannerSchema = z.object({
  id: idSchema,
  message: nonEmptyStringSchema,
  code: nonEmptyStringSchema.optional(),
  backgroundColor: nonEmptyStringSchema,
  textColor: nonEmptyStringSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

export const createFeatureFlagAlertBannerSchema = featureFlagAlertBannerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFeatureFlagAlertBannerSchema = createFeatureFlagAlertBannerSchema.partial(); 