import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@lib/prisma";

/**
 * Exercises the SQL that guards seats: public.register_for_event and
 * public.cancel_event_registration (supabase/migrations/*_event_hub.sql).
 */
let eventId: string;
const users: string[] = [];

async function register(userId: string) {
  const rows = await prisma.$queryRaw<{ status: string }[]>`select public.register_for_event(${eventId}::uuid, ${userId}::uuid)::text as status`;
  return rows[0]?.status;
}
async function cancel(userId: string) {
  await prisma.$executeRaw`select public.cancel_event_registration(${eventId}::uuid, ${userId}::uuid)`;
}
const statusOf = async (userId: string) =>
  (await prisma.eventRegistration.findUnique({ where: { event_id_user_id: { event_id: eventId, user_id: userId } } }))?.status;

beforeAll(async () => {
  const event = await prisma.event.create({
    data: {
      slug: `it-capacity-${Date.now()}`,
      title: "Integration capacity test",
      kind: "tournament",
      starts_at: new Date(Date.now() + 86_400_000),
      capacity: 2,
      status: "published",
    },
  });
  eventId = event.id;
  for (let i = 0; i < 4; i++) users.push(crypto.randomUUID());
});

afterAll(async () => {
  await prisma.event.deleteMany({ where: { id: eventId } });
  await prisma.$disconnect();
});

describe("event registration", () => {
  it("fills seats, then waitlists", async () => {
    expect(await register(users[0])).toBe("registered");
    expect(await register(users[1])).toBe("registered");
    expect(await register(users[2])).toBe("waitlisted");
  });

  it("is idempotent for someone already registered", async () => {
    expect(await register(users[0])).toBe("registered");
    expect(await prisma.eventRegistration.count({ where: { event_id: eventId, user_id: users[0] } })).toBe(1);
  });

  it("promotes the earliest waitlisted player when a seat frees up", async () => {
    await register(users[3]); // second on the waitlist
    await cancel(users[1]);
    expect(await statusOf(users[1])).toBe("cancelled");
    expect(await statusOf(users[2])).toBe("registered");
    expect(await statusOf(users[3])).toBe("waitlisted");
  });

  it("never oversells under concurrent registrations", async () => {
    const racers = Array.from({ length: 8 }, () => crypto.randomUUID());
    const event = await prisma.event.create({
      data: { slug: `it-race-${Date.now()}`, title: "Race", kind: "tournament", starts_at: new Date(Date.now() + 86_400_000), capacity: 3, status: "published" },
    });
    try {
      const results = await Promise.all(
        racers.map((u) => prisma.$queryRaw<{ status: string }[]>`select public.register_for_event(${event.id}::uuid, ${u}::uuid)::text as status`)
      );
      const statuses = results.map((r) => r[0]?.status);
      expect(statuses.filter((s) => s === "registered")).toHaveLength(3);
      expect(statuses.filter((s) => s === "waitlisted")).toHaveLength(5);
    } finally {
      await prisma.event.delete({ where: { id: event.id } });
    }
  });

  it("refuses drafts and closed events", async () => {
    const draft = await prisma.event.create({
      data: { slug: `it-draft-${Date.now()}`, title: "Draft", kind: "tournament", starts_at: new Date(Date.now() + 86_400_000), status: "draft" },
    });
    const past = await prisma.event.create({
      data: { slug: `it-past-${Date.now()}`, title: "Past", kind: "tournament", starts_at: new Date(Date.now() - 86_400_000), status: "published" },
    });
    try {
      await expect(prisma.$queryRaw`select public.register_for_event(${draft.id}::uuid, ${users[0]}::uuid)`).rejects.toThrow(/event_not_open/);
      await expect(prisma.$queryRaw`select public.register_for_event(${past.id}::uuid, ${users[0]}::uuid)`).rejects.toThrow(/registration_closed/);
    } finally {
      await prisma.event.deleteMany({ where: { id: { in: [draft.id, past.id] } } });
    }
  });
});
