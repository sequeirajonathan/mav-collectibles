import { z } from "zod";
import { urlSchema, nonEmptyStringSchema, optionalStringSchema } from "./base";

export const videoSettingsSchema = z.object({
  src: urlSchema,
  type: z.string().default("application/x-mpegURL"),
  isLive: z.boolean().default(true),
  poster: optionalStringSchema,
  title: nonEmptyStringSchema,
  autoplay: z.boolean().default(false),
  muted: z.boolean().default(true),
  twitchChannel: optionalStringSchema,
});

export const updateVideoSettingsSchema = videoSettingsSchema.partial(); 