import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import {
  FLAG_NAMES,
  alertBannerSchema,
  googleReviewSchema,
  installerSchema,
  videoSettingsSchema,
  youTubeSettingsSchema,
  type AlertBanner,
  type FlagMap,
  type GoogleReview,
  type Installer,
  type VideoSettings,
  type YouTubeSettings,
} from "@lib/contracts/site";
import { publicEnv } from "@lib/env";
import { serverEnv } from "@lib/env.server";
import { tags } from "./tags";

const FLAG_DEFAULTS: FlagMap = {
  shopLive: false,
  showAlertBanner: true,
  showYouTubeVideo: false,
  showVideoPlayer: false,
  showGoogleReviews: true,
};

export async function getFlags(): Promise<FlagMap> {
  "use cache";
  cacheTag(tags.flags);
  cacheLife("minutes");
  const rows = await prisma.featureFlag.findMany({ select: { name: true, enabled: true } });
  const flags: FlagMap = { ...FLAG_DEFAULTS };
  for (const row of rows) {
    if ((FLAG_NAMES as readonly string[]).includes(row.name)) {
      flags[row.name as keyof FlagMap] = row.enabled;
    }
  }
  return flags;
}

export async function listFlagRows() {
  "use cache";
  cacheTag(tags.flags);
  const rows = await prisma.featureFlag.findMany({ orderBy: { name: "asc" } });
  return rows
    .filter((r) => (FLAG_NAMES as readonly string[]).includes(r.name))
    .map((r) => ({ id: r.id, name: r.name as keyof FlagMap, description: r.description, enabled: r.enabled }));
}

export async function getAlertBanner(): Promise<AlertBanner | null> {
  "use cache";
  cacheTag(tags.banner);
  cacheLife("minutes");
  const row = await prisma.alertBanner.findFirst({ orderBy: { updatedAt: "desc" } });
  return row ? alertBannerSchema.parse(row) : null;
}

export async function getYouTubeSettings(): Promise<YouTubeSettings | null> {
  "use cache";
  cacheTag(tags.media);
  const row = await prisma.youTubeSettings.findFirst();
  return row ? youTubeSettingsSchema.parse(row) : null;
}

export async function getVideoSettings(): Promise<VideoSettings | null> {
  "use cache";
  cacheTag(tags.media);
  const row = await prisma.videoSettings.findFirst();
  return row ? videoSettingsSchema.parse(row) : null;
}

export async function listInstallers(): Promise<Installer[]> {
  "use cache";
  cacheTag(tags.installers);
  const rows = await prisma.installer.findMany({ orderBy: { createdAt: "desc" } });
  return z.array(installerSchema).parse(rows);
}

const placesResponse = z.object({
  result: z.object({ reviews: z.array(googleReviewSchema).optional() }).optional(),
});

/** Google reviews for the shop, cached for an hour (the Places API is billed per call). */
export async function getGoogleReviews(): Promise<GoogleReview[]> {
  "use cache";
  cacheLife("hours");
  const placeId = publicEnv().NEXT_PUBLIC_GOOGLE_PLACE_ID;
  const apiKey = serverEnv().GOOGLE_PLACES_API_KEY;
  if (!placeId || !apiKey) return [];
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "reviews");
  url.searchParams.set("key", apiKey);
  try {
    const response = await fetch(url);
    const parsed = placesResponse.safeParse(await response.json());
    return parsed.success ? (parsed.data.result?.reviews ?? []) : [];
  } catch {
    return [];
  }
}
