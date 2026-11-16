import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import {
  DISCORD_INVITE,
  FLAG_NAMES,
  communitySchema,
  discordInviteSchema,
  type Community,
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
  shopVisible: false,
  showAlertBanner: true,
  showYouTubeVideo: false,
  showVideoPlayer: false,
  showGoogleReviews: true,
  tcgplayerPhotos: false,
  paidBackgroundRemoval: false,
  facebookSignIn: false,
  vendorsVisible: true,
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
  result: z
    .object({
      rating: z.number().min(0).max(5).optional(),
      user_ratings_total: z.number().int().nonnegative().optional(),
      reviews: z.array(googleReviewSchema).optional(),
    })
    .optional(),
});

interface GoogleReviewSummary {
  /** Average star rating and how many people left one; null until Google can be reached. */
  rating: number | null;
  total: number | null;
  reviews: GoogleReview[];
  /** Where anyone can read every review, or write one. Null when the shop's Google listing isn't set. */
  readUrl: string | null;
  writeUrl: string | null;
}

/**
 * The shop's Google rating and recent reviews, cached for an hour (the Places
 * API is billed per call). Without a working server key the links still work,
 * so the site can always point people at the reviews.
 */
export async function getGoogleReviews(): Promise<GoogleReviewSummary> {
  "use cache";
  cacheLife("hours");
  const placeId = publicEnv().NEXT_PUBLIC_GOOGLE_PLACE_ID;
  const apiKey = serverEnv().GOOGLE_PLACES_API_KEY;
  const empty: GoogleReviewSummary = {
    rating: null,
    total: null,
    reviews: [],
    readUrl: placeId ? `https://search.google.com/local/reviews?placeid=${encodeURIComponent(placeId)}` : null,
    writeUrl: placeId ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}` : null,
  };
  if (!placeId || !apiKey) return empty;
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "rating,user_ratings_total,reviews");
  url.searchParams.set("key", apiKey);
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const parsed = placesResponse.safeParse(await response.json());
    const result = parsed.success ? parsed.data.result : undefined;
    if (!result) return empty;
    return { ...empty, rating: result.rating ?? null, total: result.user_ratings_total ?? null, reviews: result.reviews ?? [] };
  } catch {
    return empty;
  }
}

/**
 * The shop's Discord invite plus live member counts. Counts come from
 * Discord's public invite API and refresh about hourly.
 */
export async function getCommunity(): Promise<Community> {
  "use cache";
  cacheTag(tags.community);
  cacheLife("hours");
  const row = await prisma.communitySettings.findUnique({ where: { id: 1 } });
  const discordUrl = row?.discord_url ?? null;
  const empty: Community = { discordUrl, serverName: null, members: null, online: null, expiresAt: null, valid: Boolean(discordUrl) };
  const code = discordUrl?.match(DISCORD_INVITE)?.[2];
  if (!code) return empty;
  try {
    const response = await fetch(`https://discord.com/api/v10/invites/${code}?with_counts=true&with_expiration=true`, {
      signal: AbortSignal.timeout(4000),
    });
    if (response.status === 404) return { ...empty, valid: false };
    if (!response.ok) return empty;
    const invite = discordInviteSchema.parse(await response.json());
    return communitySchema.parse({
      discordUrl,
      serverName: invite.guild?.name ?? null,
      members: invite.approximate_member_count ?? null,
      online: invite.approximate_presence_count ?? null,
      expiresAt: invite.expires_at ? new Date(invite.expires_at).toISOString() : null,
      valid: true,
    });
  } catch {
    return empty;
  }
}
