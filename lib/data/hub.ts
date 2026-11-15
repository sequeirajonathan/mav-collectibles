import "server-only";
import { parseStoredAnswers, parseStoredQuestions, type Answers } from "@lib/event-questions";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import type { Prisma } from "@lib/generated/prisma/client";
import {
  attendeeSchema,
  commentSchema,
  eventDetailSchema,
  eventSummarySchema,
  gameSchema,
  leaderboardRowSchema,
  postSchema,
  seasonSchema,
  vendorSchema,
  type Attendee,
  type Comment,
  type EventDetail,
  type EventKind,
  type EventSummary,
  type Game,
  type LeaderboardRow,
  type Post,
  type RegistrationStatus,
  type Season,
  type Vendor,
} from "@lib/contracts/hub";
import { tags } from "./tags";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type GameRow = { id: string; name: string; short_name: string; color: string };
const toGame = (g: GameRow | null): Game | null =>
  g ? { id: g.id, name: g.name, shortName: g.short_name, color: g.color } : null;

/** Public display names for a set of users (username, then first name). */
async function displayNames(userIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return new Map();
  const rows = await prisma.profile.findMany({
    where: { id: { in: unique } },
    select: { id: true, username: true, first_name: true, last_name: true },
  });
  return new Map(
    rows.map((r) => [
      r.id,
      r.username ?? ([r.first_name, r.last_name?.[0] ? `${r.last_name[0]}.` : null].filter(Boolean).join(" ") || "Player"),
    ])
  );
}

async function registrationCounts(eventIds: string[]) {
  const counts = new Map<string, { registered: number; waitlisted: number }>();
  if (eventIds.length === 0) return counts;
  const rows = await prisma.eventRegistration.groupBy({
    by: ["event_id", "status"],
    where: { event_id: { in: eventIds }, status: { in: ["registered", "checked_in", "waitlisted"] } },
    _count: { _all: true },
  });
  for (const row of rows) {
    const entry = counts.get(row.event_id) ?? { registered: 0, waitlisted: 0 };
    if (row.status === "waitlisted") entry.waitlisted += row._count._all;
    else entry.registered += row._count._all;
    counts.set(row.event_id, entry);
  }
  return counts;
}

const eventInclude = { game: true } satisfies Prisma.EventInclude;
type EventRow = Prisma.EventGetPayload<{ include: typeof eventInclude }>;

function toSummary(e: EventRow, counts: Map<string, { registered: number; waitlisted: number }>): EventSummary {
  const c = counts.get(e.id) ?? { registered: 0, waitlisted: 0 };
  return eventSummarySchema.parse({
    id: e.id,
    slug: e.slug,
    title: e.title,
    summary: e.summary,
    kind: e.kind,
    game: toGame(e.game),
    format: e.format,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    location: e.location,
    coverImageUrl: e.cover_image_url,
    capacity: e.capacity,
    entryFeeCents: e.entry_fee_cents,
    status: e.status,
    featured: e.featured,
    registeredCount: c.registered,
    waitlistCount: c.waitlisted,
  });
}

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------
export async function listGames(): Promise<Game[]> {
  "use cache";
  cacheTag(tags.games);
  cacheLife("hours");
  const rows = await prisma.game.findMany({ where: { active: true }, orderBy: { sort_order: "asc" } });
  return z.array(gameSchema).parse(rows.map(toGame));
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
interface EventFilter {
  gameId?: string;
  kind?: EventKind;
  /** ISO date-time; defaults to now (upcoming events). */
  from?: string;
  to?: string;
  limit?: number;
}

/** Published events from `from` onward (upcoming by default). */
export async function listEvents(filter: EventFilter = {}): Promise<EventSummary[]> {
  "use cache";
  cacheTag(tags.events);
  cacheLife("minutes");
  const from = filter.from ? new Date(filter.from) : new Date(Date.now() - 6 * 60 * 60 * 1000);
  const rows = await prisma.event.findMany({
    where: {
      status: { in: ["published", "cancelled"] },
      game_id: filter.gameId,
      kind: filter.kind,
      OR: [{ starts_at: { gte: from } }, { ends_at: { gte: from } }],
      ...(filter.to ? { starts_at: { lte: new Date(filter.to) } } : {}),
    },
    include: eventInclude,
    orderBy: { starts_at: "asc" },
    take: filter.limit ?? 50,
  });
  const counts = await registrationCounts(rows.map((r) => r.id));
  return rows.map((r) => toSummary(r, counts));
}

/** Completed or past events, newest first (for results history). */
export async function listPastEvents(limit = 20, gameId?: string): Promise<EventSummary[]> {
  "use cache";
  cacheTag(tags.events);
  const rows = await prisma.event.findMany({
    where: { status: { in: ["published", "completed"] }, starts_at: { lt: new Date() }, game_id: gameId },
    include: eventInclude,
    orderBy: { starts_at: "desc" },
    take: limit,
  });
  const counts = await registrationCounts(rows.map((r) => r.id));
  return rows.map((r) => toSummary(r, counts));
}

/** Public event detail (no viewer-specific data; see getMyRegistration). */
export async function getEvent(slug: string): Promise<Omit<EventDetail, "myRegistration"> | null> {
  "use cache";
  cacheTag(tags.events, tags.event(slug));
  cacheLife("minutes");
  const e = await prisma.event.findFirst({
    where: { slug, status: { in: ["published", "cancelled", "completed"] } },
    include: {
      ...eventInclude,
      event_vendors: { where: { status: "confirmed" }, include: { vendor: true } },
      tournament_results: { orderBy: { placement: "asc" } },
    },
  });
  if (!e) return null;
  const counts = await registrationCounts([e.id]);
  const detail = eventDetailSchema.omit({ myRegistration: true }).parse({
    ...toSummary(e, counts),
    description: e.description,
    linkUrl: e.link_url,
    linkLabel: e.link_label,
    questions: parseStoredQuestions(e.questions),
    registrationOpensAt: e.registration_opens_at,
    registrationClosesAt: e.registration_closes_at,
    vendors: e.event_vendors
      .filter((ev) => ev.vendor.status === "approved")
      .map((ev) => ({ slug: ev.vendor.slug, name: ev.vendor.name, logoUrl: ev.vendor.logo_url, tableLabel: ev.table_label })),
    results: e.tournament_results.map((r) => ({
      placement: r.placement,
      playerName: r.player_name,
      wins: r.wins,
      losses: r.losses,
      draws: r.draws,
      points: r.points,
      deck: r.deck,
    })),
  });
  return detail;
}

export async function getMyRegistration(eventId: string, userId: string): Promise<RegistrationStatus | null> {
  const row = await prisma.eventRegistration.findUnique({
    where: { event_id_user_id: { event_id: eventId, user_id: userId } },
    select: { status: true },
  });
  return row && row.status !== "cancelled" ? row.status : null;
}

/** The signed-in player's saved answers to an event's questions. */
export async function getMyAnswers(eventId: string, userId: string): Promise<Answers> {
  const row = await prisma.eventRegistration.findUnique({
    where: { event_id_user_id: { event_id: eventId, user_id: userId } },
    select: { answers: true, status: true },
  });
  return row && row.status !== "cancelled" ? parseStoredAnswers(row.answers) : {};
}

export async function listMyEvents(userId: string): Promise<(EventSummary & { myStatus: RegistrationStatus })[]> {
  const regs = await prisma.eventRegistration.findMany({
    where: { user_id: userId, status: { not: "cancelled" }, event: { starts_at: { gte: new Date(Date.now() - 86_400_000) } } },
    include: { event: { include: eventInclude } },
    orderBy: { event: { starts_at: "asc" } },
  });
  const counts = await registrationCounts(regs.map((r) => r.event_id));
  return regs.map((r) => ({ ...toSummary(r.event, counts), myStatus: r.status }));
}

// ---- Staff --------------------------------------------------------------------
export async function listAllEventsForStaff(): Promise<EventSummary[]> {
  const rows = await prisma.event.findMany({ include: eventInclude, orderBy: { starts_at: "desc" }, take: 200 });
  const counts = await registrationCounts(rows.map((r) => r.id));
  return rows.map((r) => toSummary(r, counts));
}

export async function getEventForEdit(id: string) {
  return prisma.event.findUnique({ where: { id } });
}

export async function listAttendees(eventId: string): Promise<Attendee[]> {
  const regs = await prisma.eventRegistration.findMany({
    where: { event_id: eventId, status: { not: "cancelled" } },
    orderBy: [{ status: "asc" }, { created_at: "asc" }],
  });
  const names = await displayNames(regs.map((r) => r.user_id));
  const emails = regs.length
    ? await prisma.$queryRaw<{ id: string; email: string | null }[]>`
        select id, email from auth.users where id = any(${regs.map((r) => r.user_id)}::uuid[])`
    : [];
  const emailById = new Map(emails.map((e) => [e.id, e.email]));
  return z.array(attendeeSchema).parse(
    regs.map((r) => ({
      userId: r.user_id,
      displayName: names.get(r.user_id) ?? "Player",
      email: emailById.get(r.user_id) ?? null,
      status: r.status,
      registeredAt: r.created_at,
      checkedInAt: r.checked_in_at,
      answers: parseStoredAnswers(r.answers),
    }))
  );
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------
const postInclude = {
  game: true,
  event: { select: { slug: true, title: true, starts_at: true } },
  _count: { select: { post_likes: true, post_comments: { where: { deleted_at: null } } } },
} satisfies Prisma.PostInclude;
type PostRow = Prisma.PostGetPayload<{ include: typeof postInclude }>;

async function toPosts(rows: PostRow[]): Promise<Omit<Post, "likedByMe" | "savedByMe">[]> {
  const names = await displayNames(rows.flatMap((r) => (r.author_id ? [r.author_id] : [])));
  return rows.map((p) =>
    postSchema.omit({ likedByMe: true, savedByMe: true }).parse({
      id: p.id,
      title: p.title,
      body: p.body,
      imageUrl: p.image_url,
      game: toGame(p.game),
      event: p.event ? { slug: p.event.slug, title: p.event.title, startsAt: p.event.starts_at } : null,
      pinned: p.pinned,
      status: p.status,
      publishedAt: p.published_at,
      authorName: (p.author_id && names.get(p.author_id)) || "MAV Collectibles",
      likeCount: p._count.post_likes,
      commentCount: p._count.post_comments,
    })
  );
}

export type PublicPost = Omit<Post, "likedByMe" | "savedByMe">;

/** Published posts, pinned first, newest first. `before` is an ISO cursor. */
export async function listPosts(options: { limit?: number; before?: string; gameId?: string } = {}): Promise<{
  posts: PublicPost[];
  nextCursor: string | null;
}> {
  "use cache";
  cacheTag(tags.posts);
  cacheLife("minutes");
  const limit = options.limit ?? 10;
  const rows = await prisma.post.findMany({
    where: {
      status: "published",
      game_id: options.gameId,
      ...(options.before ? { published_at: { lt: new Date(options.before) }, pinned: false } : {}),
    },
    include: postInclude,
    orderBy: options.before ? [{ published_at: "desc" }] : [{ pinned: "desc" }, { published_at: "desc" }],
    take: limit + 1,
  });
  const page = rows.slice(0, limit);
  const last = page.at(-1);
  return {
    posts: await toPosts(page),
    nextCursor: rows.length > limit && last?.published_at ? last.published_at.toISOString() : null,
  };
}

export async function getPost(id: string): Promise<PublicPost | null> {
  "use cache";
  cacheTag(tags.posts, tags.post(id));
  const row = await prisma.post.findFirst({ where: { id, status: "published" }, include: postInclude });
  return row ? (await toPosts([row]))[0] : null;
}

/** Which of these posts the viewer has liked/saved. */
export async function getMyReactions(postIds: string[], userId: string) {
  if (postIds.length === 0) return { liked: new Set<string>(), saved: new Set<string>() };
  const [likes, saves] = await Promise.all([
    prisma.postLike.findMany({ where: { user_id: userId, post_id: { in: postIds } }, select: { post_id: true } }),
    prisma.postSave.findMany({ where: { user_id: userId, post_id: { in: postIds } }, select: { post_id: true } }),
  ]);
  return { liked: new Set(likes.map((l) => l.post_id)), saved: new Set(saves.map((s) => s.post_id)) };
}

export async function listSavedPosts(userId: string): Promise<PublicPost[]> {
  const saves = await prisma.postSave.findMany({
    where: { user_id: userId, post: { status: "published" } },
    include: { post: { include: postInclude } },
    orderBy: { created_at: "desc" },
    take: 50,
  });
  return toPosts(saves.map((s) => s.post));
}

export async function listComments(postId: string): Promise<Comment[]> {
  "use cache";
  cacheTag(tags.post(postId));
  const rows = await prisma.postComment.findMany({
    where: { post_id: postId, deleted_at: null },
    orderBy: { created_at: "asc" },
    take: 200,
  });
  const names = await displayNames(rows.map((r) => r.user_id));
  return z.array(commentSchema).parse(
    rows.map((c) => ({ id: c.id, body: c.body, authorId: c.user_id, authorName: names.get(c.user_id) ?? "Player", createdAt: c.created_at }))
  );
}

export async function listAllPostsForStaff() {
  const rows = await prisma.post.findMany({ include: postInclude, orderBy: [{ created_at: "desc" }], take: 200 });
  return toPosts(rows);
}

export async function getPostForEdit(id: string) {
  return prisma.post.findUnique({ where: { id } });
}

// ---------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------
const vendorInclude = {
  event_vendors: {
    where: { status: "confirmed", event: { status: "published", starts_at: { gte: new Date(0) } } },
    include: { event: { select: { slug: true, title: true, starts_at: true } } },
  },
} satisfies Prisma.VendorInclude;
type VendorRow = Prisma.VendorGetPayload<{ include: typeof vendorInclude }>;

function toVendor(v: VendorRow, games: Game[]): Vendor {
  const now = Date.now();
  return vendorSchema.parse({
    id: v.id,
    slug: v.slug,
    name: v.name,
    bio: v.bio,
    specialties: v.specialties,
    games: games.filter((g) => v.games.includes(g.id)),
    logoUrl: v.logo_url,
    instagram: v.instagram,
    website: v.website,
    status: v.status,
    upcomingEvents: v.event_vendors
      .filter((ev) => ev.event.starts_at.getTime() >= now - 86_400_000)
      .map((ev) => ({ slug: ev.event.slug, title: ev.event.title, startsAt: ev.event.starts_at })),
  });
}

export async function listVendors(): Promise<Vendor[]> {
  "use cache";
  cacheTag(tags.vendors);
  cacheLife("minutes");
  const [rows, games] = await Promise.all([
    prisma.vendor.findMany({ where: { status: "approved" }, include: vendorInclude, orderBy: { name: "asc" } }),
    listGames(),
  ]);
  return rows.map((v) => toVendor(v, games));
}

export async function getVendor(slugValue: string): Promise<Vendor | null> {
  "use cache";
  cacheTag(tags.vendors);
  const [row, games] = await Promise.all([
    prisma.vendor.findFirst({ where: { slug: slugValue, status: "approved" }, include: vendorInclude }),
    listGames(),
  ]);
  return row ? toVendor(row, games) : null;
}

export async function listVendorsForStaff() {
  const [rows, games] = await Promise.all([
    prisma.vendor.findMany({
      include: {
        ...vendorInclude,
        event_vendors: { include: { event: { select: { id: true, slug: true, title: true, starts_at: true } } } },
      },
      orderBy: [{ status: "asc" }, { created_at: "desc" }],
    }),
    listGames(),
  ]);
  return rows.map((v) => ({
    ...toVendor({ ...v, event_vendors: v.event_vendors.filter((ev) => ev.status === "confirmed") }, games),
    contactEmail: v.contact_email,
    requests: v.event_vendors.map((ev) => ({
      eventId: ev.event.id,
      eventTitle: ev.event.title,
      startsAt: ev.event.starts_at.toISOString(),
      status: ev.status,
      message: ev.message,
      tableLabel: ev.table_label,
    })),
  }));
}

export async function getMyVendor(userId: string) {
  return prisma.vendor.findUnique({ where: { owner_user_id: userId } });
}

// ---------------------------------------------------------------------------
// Tournaments
// ---------------------------------------------------------------------------
export async function listSeasons(gameId?: string): Promise<Season[]> {
  "use cache";
  cacheTag(tags.leaderboard);
  const rows = await prisma.season.findMany({ where: { game_id: gameId }, orderBy: { starts_on: "desc" } });
  return z.array(seasonSchema).parse(
    rows.map((s) => ({
      id: s.id,
      gameId: s.game_id,
      name: s.name,
      startsOn: s.starts_on.toISOString().slice(0, 10),
      endsOn: s.ends_on.toISOString().slice(0, 10),
    }))
  );
}

/**
 * Season points leaderboard for a game. Players are grouped by linked account
 * when they have one, otherwise by name.
 */
export async function getLeaderboard(gameId: string, seasonId?: string): Promise<LeaderboardRow[]> {
  "use cache";
  cacheTag(tags.leaderboard);
  cacheLife("minutes");
  const season = seasonId ? await prisma.season.findUnique({ where: { id: seasonId } }) : null;
  const rows = await prisma.tournamentResult.findMany({
    where: {
      event: {
        game_id: gameId,
        ...(season ? { starts_at: { gte: season.starts_on, lt: new Date(season.ends_on.getTime() + 86_400_000) } } : {}),
      },
    },
    select: { user_id: true, player_name: true, points: true, wins: true, placement: true, event_id: true },
  });
  const names = await displayNames(rows.flatMap((r) => (r.user_id ? [r.user_id] : [])));

  const byPlayer = new Map<string, { playerName: string; userId: string | null; points: number; events: Set<string>; wins: number; best: number }>();
  for (const r of rows) {
    const key = r.user_id ?? `name:${r.player_name.toLowerCase()}`;
    const entry = byPlayer.get(key) ?? {
      playerName: (r.user_id && names.get(r.user_id)) || r.player_name,
      userId: r.user_id,
      points: 0,
      events: new Set<string>(),
      wins: 0,
      best: Number.MAX_SAFE_INTEGER,
    };
    entry.points += r.points;
    entry.wins += r.wins;
    entry.events.add(r.event_id);
    entry.best = Math.min(entry.best, r.placement);
    byPlayer.set(key, entry);
  }

  const sorted = [...byPlayer.values()].sort(
    (a, b) => b.points - a.points || b.wins - a.wins || a.best - b.best || a.playerName.localeCompare(b.playerName)
  );
  let lastPoints = -1;
  let lastRank = 0;
  return z.array(leaderboardRowSchema).parse(
    sorted.map((p, i) => {
      const rank = p.points === lastPoints ? lastRank : i + 1;
      lastPoints = p.points;
      lastRank = rank;
      return { rank, playerName: p.playerName, userId: p.userId, points: p.points, events: p.events.size, wins: p.wins, bestPlacement: p.best };
    })
  );
}
