import { z } from 'zod';
import { idSchema, dateSchema } from "./base";

// Feature Flag validation schema
export const featureFlagSchema = z.object({
  id: idSchema,
  name: z.string().min(1, "Name is required").refine(name => name !== 'maintenanceMode', { message: 'maintenanceMode is now handled via env' }),
  description: z.string().optional(),
  enabled: z.boolean().default(false),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});