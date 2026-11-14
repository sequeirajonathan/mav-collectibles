import { z } from "zod";
import { isoDateTime, optionalText } from "./common";

/** Every feature flag the app knows about. Unknown rows in the table are ignored. */
export const FLAG_NAMES = [
  "shopLive",
  "showAlertBanner",
  "showYouTubeVideo",
  "showVideoPlayer",
  "showGoogleReviews",
] as const;
const flagNameSchema = z.enum(FLAG_NAMES);
export type FlagName = z.infer<typeof flagNameSchema>;

/** Flags as a name → enabled map, with every known flag present. */
export type FlagMap = Record<FlagName, boolean>;

export const setFlagInput = z.object({ name: flagNameSchema, enabled: z.boolean() });

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a hex color like #E6B325");

export const alertBannerSchema = z.object({
  id: z.string(),
  message: z.string(),
  code: z.string().nullable(),
  backgroundColor: hexColor,
  textColor: hexColor,
  enabled: z.boolean(),
  updatedAt: isoDateTime,
});
export type AlertBanner = z.infer<typeof alertBannerSchema>;

export const alertBannerInput = z.object({
  message: z.string().trim().min(1, "Message is required").max(200),
  code: optionalText(40),
  backgroundColor: hexColor,
  textColor: hexColor,
  enabled: z.boolean(),
});

export const youTubeSettingsSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  autoplay: z.boolean(),
  muted: z.boolean(),
  playlistId: z.string(),
});
export type YouTubeSettings = z.infer<typeof youTubeSettingsSchema>;

export const youTubeSettingsInput = z.object({
  videoId: z.string().trim().regex(/^[A-Za-z0-9_-]{6,20}$/, "Paste the video ID (the part after v=)"),
  title: z.string().trim().min(1).max(120),
  autoplay: z.boolean(),
  muted: z.boolean(),
  playlistId: z.string().trim().max(64),
});

export const videoSettingsSchema = z.object({
  src: z.string(),
  type: z.string(),
  isLive: z.boolean(),
  poster: z.string(),
  title: z.string(),
  autoplay: z.boolean(),
  muted: z.boolean(),
});
export type VideoSettings = z.infer<typeof videoSettingsSchema>;

export const videoSettingsInput = videoSettingsSchema.extend({
  src: z.url("Enter the stream URL"),
  title: z.string().trim().min(1).max(120),
  poster: z.string().trim().max(500),
});

export const installerSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.url(),
  type: z.string(),
  createdAt: isoDateTime,
});
export type Installer = z.infer<typeof installerSchema>;

export const installerInput = z.object({
  name: z.string().trim().min(1).max(120),
  url: z.url("Paste the GitHub release URL"),
});

export const googleReviewSchema = z.object({
  author_name: z.string(),
  profile_photo_url: z.string().optional(),
  rating: z.number().min(0).max(5),
  relative_time_description: z.string(),
  text: z.string(),
  time: z.number(),
});
export type GoogleReview = z.infer<typeof googleReviewSchema>;
