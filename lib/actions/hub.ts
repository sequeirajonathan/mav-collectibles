"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import { Prisma } from "@lib/generated/prisma/client";
import { ActionError, createAction } from "@lib/actions/safe-action";
import { CONTENT_ROLES } from "@interfaces/roles";
import {
  commentInput,
  eventInput,
  postInput,
  registrationStatusSchema,
  resultsInput,
  seasonInput,
  vendorApplicationInput,
} from "@lib/contracts/hub";
import { slug as slugSchema, uuid } from "@lib/contracts/common";
import { tags } from "@lib/data/tags";
import { getFlags } from "@lib/data/site";

const REGISTRATION_ERRORS: Record<string, string> = {
  event_not_open: "This event isn't open for registration.",
  registration_not_open: "Registration hasn't opened yet.",
  registration_closed: "Registration for this event has closed.",
};

function refreshEvent(slug: string) {
  updateTag(tags.events);
  updateTag(tags.event(slug));
}

// ---------------------------------------------------------------------------
// Players: RSVP
// ---------------------------------------------------------------------------
export const registerForEvent = createAction(
  { input: z.object({ eventId: uuid }), access: "user" },
  async ({ eventId }, user) => {
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
    if (!event) throw new ActionError("Event not found.");
    try {
      const rows = await prisma.$queryRaw<{ status: string }[]>`
        select public.register_for_event(${eventId}::uuid, ${user.id}::uuid)::text as status`;
      refreshEvent(event.slug);
      return { status: registrationStatusSchema.parse(rows[0]?.status) };
    } catch (error) {
      const message = error instanceof Error ? Object.keys(REGISTRATION_ERRORS).find((k) => error.message.includes(k)) : undefined;
      if (message) throw new ActionError(REGISTRATION_ERRORS[message]);
      throw error;
    }
  }
);

export const cancelRegistration = createAction(
  { input: z.object({ eventId: uuid }), access: "user" },
  async ({ eventId }, user) => {
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
    if (!event) throw new ActionError("Event not found.");
    await prisma.$executeRaw`select public.cancel_event_registration(${eventId}::uuid, ${user.id}::uuid)`;
    refreshEvent(event.slug);
    return null;
  }
);

// ---------------------------------------------------------------------------
// Players: posts
// ---------------------------------------------------------------------------
async function requirePublishedPost(postId: string) {
  const post = await prisma.post.findFirst({ where: { id: postId, status: "published" }, select: { id: true } });
  if (!post) throw new ActionError("That post is no longer available.");
}

export const toggleLike = createAction(
  { input: z.object({ postId: uuid, liked: z.boolean() }), access: "user" },
  async ({ postId, liked }, user) => {
    await requirePublishedPost(postId);
    if (liked) {
      await prisma.postLike.upsert({
        where: { post_id_user_id: { post_id: postId, user_id: user.id } },
        create: { post_id: postId, user_id: user.id },
        update: {},
      });
    } else {
      await prisma.postLike.deleteMany({ where: { post_id: postId, user_id: user.id } });
    }
    updateTag(tags.posts);
    updateTag(tags.post(postId));
    return { liked };
  }
);

export const toggleSave = createAction(
  { input: z.object({ postId: uuid, saved: z.boolean() }), access: "user" },
  async ({ postId, saved }, user) => {
    await requirePublishedPost(postId);
    if (saved) {
      await prisma.postSave.upsert({
        where: { post_id_user_id: { post_id: postId, user_id: user.id } },
        create: { post_id: postId, user_id: user.id },
        update: {},
      });
    } else {
      await prisma.postSave.deleteMany({ where: { post_id: postId, user_id: user.id } });
    }
    return { saved };
  }
);

export const addComment = createAction({ input: commentInput, access: "user" }, async ({ postId, body }, user) => {
  await requirePublishedPost(postId);
  const recent = await prisma.postComment.count({
    where: { user_id: user.id, created_at: { gte: new Date(Date.now() - 60_000) } },
  });
  if (recent >= 5) throw new ActionError("You're commenting a lot. Take a breather and try again in a minute.");
  const comment = await prisma.postComment.create({ data: { post_id: postId, user_id: user.id, body } });
  updateTag(tags.post(postId));
  updateTag(tags.posts);
  return { id: comment.id };
});

export const deleteComment = createAction({ input: z.object({ commentId: uuid }), access: "user" }, async ({ commentId }, user) => {
  const comment = await prisma.postComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.deleted_at) throw new ActionError("Comment not found.");
  const isStaff = CONTENT_ROLES.includes(user.role);
  if (comment.user_id !== user.id && !isStaff) throw new ActionError("You can only delete your own comments.");
  await prisma.postComment.update({ where: { id: commentId }, data: { deleted_at: new Date(), deleted_by: user.id } });
  updateTag(tags.post(comment.post_id));
  updateTag(tags.posts);
  return null;
});

// ---------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------
function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "vendor";
}

/** A signed-in user applies as a vendor (or updates their pending application). */
export const applyAsVendor = createAction({ input: vendorApplicationInput, access: "user" }, async (input, user) => {
  if (!(await getFlags()).vendorsVisible) throw new ActionError("Vendor applications are closed right now.");
  if (input.eventId) {
    const event = await prisma.event.findFirst({
      where: { id: input.eventId, kind: "vendor_day", status: "published", starts_at: { gt: new Date() } },
    });
    if (!event) throw new ActionError("That vendor day isn't taking applications.");
  }
  const existing = await prisma.vendor.findUnique({ where: { owner_user_id: user.id } });
  const data = {
    name: input.name,
    bio: input.bio,
    specialties: input.specialties,
    games: input.games,
    instagram: input.instagram,
    website: input.website,
    contact_email: input.contactEmail,
  };
  let vendorId: string;
  if (existing) {
    vendorId = existing.id;
    // Edits to an approved profile go back to staff before they're public again.
    await prisma.vendor.update({
      where: { id: existing.id },
      data: { ...data, status: existing.status === "approved" ? "pending" : existing.status },
    });
  } else {
    let slug = slugify(input.name);
    if (await prisma.vendor.findUnique({ where: { slug } })) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    const created = await prisma.vendor.create({ data: { ...data, slug, owner_user_id: user.id, status: "pending" } });
    vendorId = created.id;
  }
  if (input.eventId) {
    await prisma.eventVendor.upsert({
      where: { event_id_vendor_id: { event_id: input.eventId, vendor_id: vendorId } },
      create: { event_id: input.eventId, vendor_id: vendorId, message: input.message, status: "requested" },
      update: { message: input.message },
    });
  }
  updateTag(tags.vendors);
  return { vendorId, status: existing?.status === "rejected" ? "rejected" : "pending" };
});

// ---------------------------------------------------------------------------
// Staff: events
// ---------------------------------------------------------------------------
function eventData(input: z.infer<typeof eventInput>) {
  return {
    title: input.title,
    slug: input.slug,
    summary: input.summary,
    description: input.description,
    kind: input.kind,
    game_id: input.gameId,
    format: input.format,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    location: input.location,
    cover_image_url: input.coverImageUrl,
    capacity: input.capacity,
    entry_fee_cents: input.entryFeeDollars === null ? null : Math.round(input.entryFeeDollars * 100),
    registration_opens_at: input.registrationOpensAt,
    registration_closes_at: input.registrationClosesAt,
    status: input.status,
    featured: input.featured,
  };
}

function uniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export const createEvent = createAction({ input: eventInput, access: CONTENT_ROLES }, async (input, user) => {
  try {
    const event = await prisma.event.create({ data: { ...eventData(input), created_by: user.id } });
    refreshEvent(event.slug);
    return { id: event.id, slug: event.slug };
  } catch (error) {
    if (uniqueViolation(error)) throw new ActionError("Another event already uses that URL slug.");
    throw error;
  }
});

export const updateEvent = createAction(
  { input: z.object({ id: uuid, values: eventInput }), access: CONTENT_ROLES },
  async ({ id, values }) => {
    const before = await prisma.event.findUnique({ where: { id }, select: { slug: true } });
    if (!before) throw new ActionError("Event not found.");
    try {
      const event = await prisma.event.update({ where: { id }, data: eventData(values) });
      refreshEvent(before.slug);
      refreshEvent(event.slug);
      return { id: event.id, slug: event.slug };
    } catch (error) {
      if (uniqueViolation(error)) throw new ActionError("Another event already uses that URL slug.");
      throw error;
    }
  }
);

export const duplicateEvent = createAction(
  { input: z.object({ id: uuid, startsAt: z.coerce.date() }), access: CONTENT_ROLES },
  async ({ id, startsAt }, user) => {
    const source = await prisma.event.findUnique({ where: { id } });
    if (!source) throw new ActionError("Event not found.");
    const shift = startsAt.getTime() - source.starts_at.getTime();
    const moved = (d: Date | null) => (d ? new Date(d.getTime() + shift) : null);
    const slug = `${source.slug.replace(/-\d{4}-\d{2}-\d{2}$/, "")}-${startsAt.toISOString().slice(0, 10)}`;
    const copy = await prisma.event.create({
      data: {
        title: source.title,
        slug: slugSchema.parse(slug),
        summary: source.summary,
        description: source.description,
        kind: source.kind,
        game_id: source.game_id,
        format: source.format,
        starts_at: startsAt,
        ends_at: moved(source.ends_at),
        location: source.location,
        cover_image_url: source.cover_image_url,
        capacity: source.capacity,
        entry_fee_cents: source.entry_fee_cents,
        registration_opens_at: moved(source.registration_opens_at),
        registration_closes_at: moved(source.registration_closes_at),
        status: "draft",
        created_by: user.id,
      },
    });
    updateTag(tags.events);
    return { id: copy.id, slug: copy.slug };
  }
);

export const deleteEvent = createAction({ input: z.object({ id: uuid }), access: CONTENT_ROLES }, async ({ id }) => {
  const event = await prisma.event.delete({ where: { id } });
  refreshEvent(event.slug);
  return null;
});

export const setCheckIn = createAction(
  { input: z.object({ eventId: uuid, userId: uuid, checkedIn: z.boolean() }), access: CONTENT_ROLES },
  async ({ eventId, userId, checkedIn }) => {
    const reg = await prisma.eventRegistration.update({
      where: { event_id_user_id: { event_id: eventId, user_id: userId } },
      data: checkedIn ? { status: "checked_in", checked_in_at: new Date() } : { status: "registered", checked_in_at: null },
      include: { event: { select: { slug: true } } },
    });
    refreshEvent(reg.event.slug);
    return null;
  }
);

/** Staff remove a player (also promotes the waitlist). */
export const removeAttendee = createAction(
  { input: z.object({ eventId: uuid, userId: uuid }), access: CONTENT_ROLES },
  async ({ eventId, userId }) => {
    await prisma.$executeRaw`select public.cancel_event_registration(${eventId}::uuid, ${userId}::uuid)`;
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
    if (event) refreshEvent(event.slug);
    return null;
  }
);

// ---------------------------------------------------------------------------
// Staff: tournament results and seasons
// ---------------------------------------------------------------------------
export const saveResults = createAction({ input: resultsInput, access: CONTENT_ROLES }, async ({ eventId, rows }) => {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
  if (!event) throw new ActionError("Event not found.");
  await prisma.$transaction([
    prisma.tournamentResult.deleteMany({ where: { event_id: eventId } }),
    prisma.tournamentResult.createMany({
      data: rows.map((r) => ({
        event_id: eventId,
        user_id: r.userId,
        player_name: r.playerName,
        placement: r.placement,
        wins: r.wins,
        losses: r.losses,
        draws: r.draws,
        points: r.points,
        deck: r.deck,
      })),
    }),
    prisma.event.update({ where: { id: eventId }, data: { status: "completed" } }),
  ]);
  refreshEvent(event.slug);
  updateTag(tags.leaderboard);
  return { saved: rows.length };
});

export const createSeason = createAction({ input: seasonInput, access: CONTENT_ROLES }, async (input) => {
  const season = await prisma.season.create({
    data: { game_id: input.gameId, name: input.name, starts_on: new Date(input.startsOn), ends_on: new Date(input.endsOn) },
  });
  updateTag(tags.leaderboard);
  return { id: season.id };
});

// ---------------------------------------------------------------------------
// Staff: posts
// ---------------------------------------------------------------------------
function postData(input: z.infer<typeof postInput>) {
  return {
    title: input.title,
    body: input.body,
    image_url: input.imageUrl,
    game_id: input.gameId,
    event_id: input.eventId,
    pinned: input.pinned,
    status: input.status,
  };
}

export const createPost = createAction({ input: postInput, access: CONTENT_ROLES }, async (input, user) => {
  const post = await prisma.post.create({
    data: { ...postData(input), author_id: user.id, published_at: input.status === "published" ? new Date() : null },
  });
  updateTag(tags.posts);
  return { id: post.id };
});

export const updatePost = createAction(
  { input: z.object({ id: uuid, values: postInput }), access: CONTENT_ROLES },
  async ({ id, values }) => {
    const before = await prisma.post.findUnique({ where: { id }, select: { published_at: true } });
    if (!before) throw new ActionError("Post not found.");
    await prisma.post.update({
      where: { id },
      data: {
        ...postData(values),
        published_at: values.status === "published" ? (before.published_at ?? new Date()) : before.published_at,
      },
    });
    updateTag(tags.posts);
    updateTag(tags.post(id));
    return { id };
  }
);

export const deletePost = createAction({ input: z.object({ id: uuid }), access: CONTENT_ROLES }, async ({ id }) => {
  await prisma.post.delete({ where: { id } });
  updateTag(tags.posts);
  updateTag(tags.post(id));
  return null;
});

// ---------------------------------------------------------------------------
// Staff: vendors
// ---------------------------------------------------------------------------
export const setVendorStatus = createAction(
  { input: z.object({ id: uuid, status: z.enum(["pending", "approved", "rejected"]) }), access: CONTENT_ROLES },
  async ({ id, status }) => {
    await prisma.vendor.update({ where: { id }, data: { status } });
    updateTag(tags.vendors);
    updateTag(tags.events);
    return null;
  }
);

export const setVendorTable = createAction(
  {
    input: z.object({
      eventId: uuid,
      vendorId: uuid,
      status: z.enum(["requested", "confirmed", "declined"]),
      tableLabel: z.string().trim().max(20).nullable(),
    }),
    access: CONTENT_ROLES,
  },
  async ({ eventId, vendorId, status, tableLabel }) => {
    const row = await prisma.eventVendor.upsert({
      where: { event_id_vendor_id: { event_id: eventId, vendor_id: vendorId } },
      create: { event_id: eventId, vendor_id: vendorId, status, table_label: tableLabel },
      update: { status, table_label: tableLabel },
      include: { event: { select: { slug: true } } },
    });
    refreshEvent(row.event.slug);
    updateTag(tags.vendors);
    return null;
  }
);
