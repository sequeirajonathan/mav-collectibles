import { z } from "zod";

export const idSchema = z.string().uuid();
export const dateSchema = z.string().datetime();
export const urlSchema = z.string().url();
export const hexColorSchema = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
export const booleanSchema = z.boolean();
export const positiveNumberSchema = z.number().positive();
export const nonEmptyStringSchema = z.string().min(1);
export const optionalStringSchema = z.string().optional();
export const optionalUrlSchema = urlSchema.optional(); 