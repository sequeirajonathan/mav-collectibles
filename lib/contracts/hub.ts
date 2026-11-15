import { z } from "zod";
import { httpUrl, isoDateTime, optionalText, optionalUrl, slug, uuid } from "./common";

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------
export const gameSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  color: z.string(),
});
export type Game = z.infer<typeof gameSchema>;

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export const EVENT_KINDS = [
  "tournament",
  "league",
  "prerelease",
  "release",
  "casual",
  "trade_night",
  "vendor_day",
  "special",
] as const;
export const eventKindSchema = z.enum(EVENT_KINDS);
export type EventKind = z.infer<typeof eventKindSchema>;

export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  tournament: "Tournament",
  league: "League night",
  prerelease: "Pre-release",
  release: "Release event",
  casual: "Casual play",
  trade_night: "Trade night",
  vendor_day: "Vendor day",
  special: "Special event",
};

const eventStatusSchema = z.enum(["draft", "published", "cancelled", "completed"]);
export type EventStatus = z.infer<typeof eventStatusSchema>;

export const registrationStatusSchema = z.enum(["registered", "waitlisted", "checked_in", "cancelled"]);
export type RegistrationStatus = z.infer<typeof registrationStatusSchema>;

/** Card-sized event, used in lists, the home page and calendars. */
export const eventSummarySchema = z.object({
  id: uuid,
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  kind: eventKindSchema,
  game: gameSchema.nullable(),
  format: z.string().nullable(),
  startsAt: isoDateTime,
  endsAt: isoDateTime.nullable(),
  location: z.string(),
  coverImageUrl: z.string().nullable(),
  capacity: z.number().int().nullable(),
  entryFeeCents: z.number().int().nullable(),
  status: eventStatusSchema,
  featured: z.boolean(),
  registeredCount: z.number().int(),
  waitlistCount: z.number().int(),
});
export type EventSummary = z.infer<typeof eventSummarySchema>;

export const eventDetailSchema = eventSummarySchema.extend({
  description: z.string(),
  registrationOpensAt: isoDateTime.nullable(),
  registrationClosesAt: isoDateTime.nullable(),
  /** The signed-in viewer's registration, if any. */
  myRegistration: registrationStatusSchema.nullable(),
  vendors: z.array(z.object({ slug: z.string(), name: z.string(), logoUrl: z.string().nullable(), tableLabel: z.string().nullable() })),
  results: z.array(
    z.object({
      placement: z.number().int(),
      playerName: z.string(),
      wins: z.number().int(),
      losses: z.number().int(),
      draws: z.number().int(),
      points: z.number().int(),
      deck: z.string().nullable(),
    })
  ),
});
export type EventDetail = z.infer<typeof eventDetailSchema>;

const optionalDateTime = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z.coerce.date().nullable()
);

export const eventInput = z
  .object({
    title: z.string().trim().min(3, "Give the event a title").max(120),
    slug: slug.max(80),
    summary: z.string().trim().max(200),
    description: z.string().trim().max(10_000),
    kind: eventKindSchema,
    gameId: z.preprocess((v) => (v === "" ? null : v), z.string().nullable()),
    format: optionalText(60),
    startsAt: z.coerce.date({ error: "Pick a start date and time" }),
    endsAt: optionalDateTime,
    location: z.string().trim().min(1).max(120),
    coverImageUrl: optionalUrl,
    capacity: z.preprocess((v) => (v === "" || v === null ? null : v), z.coerce.number().int().positive().nullable()),
    entryFeeDollars: z.preprocess(
      (v) => (v === "" || v === null ? null : v),
      z.coerce.number().min(0).max(10_000).nullable()
    ),
    registrationOpensAt: optionalDateTime,
    registrationClosesAt: optionalDateTime,
    status: eventStatusSchema,
    featured: z.boolean(),
  })
  .refine((e) => !e.endsAt || e.endsAt >= e.startsAt, { path: ["endsAt"], message: "Ends before it starts" });

export const attendeeSchema = z.object({
  userId: uuid,
  displayName: z.string(),
  email: z.string().nullable(),
  status: registrationStatusSchema,
  registeredAt: isoDateTime,
  checkedInAt: isoDateTime.nullable(),
});
export type Attendee = z.infer<typeof attendeeSchema>;

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------
export const postSchema = z.object({
  id: uuid,
  title: z.string(),
  body: z.string(),
  imageUrl: z.string().nullable(),
  game: gameSchema.nullable(),
  event: z.object({ slug: z.string(), title: z.string(), startsAt: isoDateTime }).nullable(),
  pinned: z.boolean(),
  status: z.enum(["draft", "published"]),
  publishedAt: isoDateTime.nullable(),
  authorName: z.string(),
  likeCount: z.number().int(),
  commentCount: z.number().int(),
  likedByMe: z.boolean(),
  savedByMe: z.boolean(),
});
export type Post = z.infer<typeof postSchema>;

export const postInput = z.object({
  title: z.string().trim().min(3, "Give the post a title").max(140),
  body: z.string().trim().max(10_000),
  imageUrl: optionalUrl,
  gameId: z.preprocess((v) => (v === "" ? null : v), z.string().nullable()),
  eventId: z.preprocess((v) => (v === "" ? null : v), uuid.nullable()),
  pinned: z.boolean(),
  status: z.enum(["draft", "published"]),
});

export const commentSchema = z.object({
  id: uuid,
  body: z.string(),
  authorName: z.string(),
  authorId: uuid,
  createdAt: isoDateTime,
});
export type Comment = z.infer<typeof commentSchema>;

export const commentInput = z.object({
  postId: uuid,
  body: z.string().trim().min(1, "Write something first").max(2000),
});

// ---------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------
export const vendorSchema = z.object({
  id: uuid,
  slug: z.string(),
  name: z.string(),
  bio: z.string(),
  specialties: z.string(),
  games: z.array(gameSchema),
  logoUrl: z.string().nullable(),
  instagram: z.string().nullable(),
  website: z.string().nullable(),
  status: z.enum(["pending", "approved", "rejected"]),
  upcomingEvents: z.array(z.object({ slug: z.string(), title: z.string(), startsAt: isoDateTime })),
});
export type Vendor = z.infer<typeof vendorSchema>;

const instagramHandle = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "") || null : v),
  z.string().regex(/^[A-Za-z0-9._]{1,30}$/, "Instagram handle only, e.g. mavcollectibles").nullable()
);

export const vendorApplicationInput = z.object({
  name: z.string().trim().min(2, "Shop or vendor name").max(80),
  bio: z.string().trim().max(1000),
  specialties: z.string().trim().max(300),
  games: z.array(z.string()).max(12),
  instagram: instagramHandle,
  website: z.preprocess((v) => (v === "" ? null : v), httpUrl().nullable()),
  contactEmail: z.email("Where should we reach you?"),
  /** Optional vendor day to request a table at. */
  eventId: z.preprocess((v) => (v === "" ? null : v), uuid.nullable()),
  message: optionalText(500),
});

// ---------------------------------------------------------------------------
// Tournaments
// ---------------------------------------------------------------------------
const resultRowInput = z.object({
  placement: z.coerce.number().int().positive(),
  playerName: z.string().trim().min(1).max(80),
  userId: z.preprocess((v) => (v === "" ? null : v), uuid.nullable()),
  wins: z.coerce.number().int().min(0),
  losses: z.coerce.number().int().min(0),
  draws: z.coerce.number().int().min(0),
  points: z.coerce.number().int().min(0),
  deck: optionalText(80),
});

export const resultsInput = z.object({
  eventId: uuid,
  rows: z
    .array(resultRowInput)
    .max(512)
    .refine((rows) => new Set(rows.map((r) => r.playerName.toLowerCase())).size === rows.length, {
      message: "Each player can only appear once",
    }),
});

export const leaderboardRowSchema = z.object({
  rank: z.number().int(),
  playerName: z.string(),
  userId: uuid.nullable(),
  points: z.number().int(),
  events: z.number().int(),
  wins: z.number().int(),
  bestPlacement: z.number().int(),
});
export type LeaderboardRow = z.infer<typeof leaderboardRowSchema>;

export const seasonSchema = z.object({
  id: uuid,
  gameId: z.string(),
  name: z.string(),
  startsOn: z.string(),
  endsOn: z.string(),
});
export type Season = z.infer<typeof seasonSchema>;

export const seasonInput = z
  .object({
    gameId: z.string().min(1),
    name: z.string().trim().min(2).max(80),
    startsOn: z.iso.date(),
    endsOn: z.iso.date(),
  })
  .refine((s) => s.endsOn >= s.startsOn, { path: ["endsOn"], message: "Ends before it starts" });
