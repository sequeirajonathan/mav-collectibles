import { z } from "zod";

export const idSchema = z.string().uuid();
export const dateSchema = z.string().datetime();
export const urlSchema = z.string().url();
export const booleanSchema = z.boolean();
export const positiveNumberSchema = z.number().positive();
export const nonEmptyStringSchema = z.string().min(1);
export const optionalUrlSchema = urlSchema.optional(); 