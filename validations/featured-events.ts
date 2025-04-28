import { z } from "zod";
import { idSchema, dateSchema, urlSchema, booleanSchema, positiveNumberSchema, nonEmptyStringSchema, optionalUrlSchema } from "./base";

export const bulletPointSchema = z.string().min(1).max(200);

export const featuredEventSchema = z.object({
  id: idSchema,
  title: nonEmptyStringSchema,
  description: nonEmptyStringSchema,
  date: dateSchema,
  imageSrc: urlSchema,
  imageAlt: nonEmptyStringSchema,
  bulletPoints: z.array(bulletPointSchema).default([]),
  link: optionalUrlSchema,
  enabled: booleanSchema.default(true),
  order: positiveNumberSchema.default(0),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

export const createFeaturedEventSchema = featuredEventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFeaturedEventSchema = createFeaturedEventSchema.partial(); 