import { z } from "zod";
import { nonEmptyStringSchema, optionalStringSchema } from "./base";

export const youtubeSettingsSchema = z.object({
  videoId: optionalStringSchema,
  title: nonEmptyStringSchema,
  autoplay: z.boolean().default(false),
  muted: z.boolean().default(true),
  playlistId: optionalStringSchema,
  isLiveStream: z.boolean().default(false),
  liveStreamId: optionalStringSchema,
  showLiveIndicator: z.boolean().default(true),
});

export const updateYoutubeSettingsSchema = youtubeSettingsSchema.partial(); 