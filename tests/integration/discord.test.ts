import { generateKeyPairSync, sign } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@lib/prisma";
import { createLinkToken, readLinkToken, verifyDiscordSignature } from "@lib/discord/core";
import { COMMANDS, handleInteraction } from "@lib/discord/commands";
import { announceEvent, remindUpcomingEvents } from "@lib/discord/announce";
import { encryptServiceKey } from "@lib/service-keys";

// The site's data loaders mark their results for Next's cache; outside Next those markers do nothing.
vi.mock("next/cache", () => ({ cacheTag: () => undefined, cacheLife: () => undefined, updateTag: () => undefined, revalidateTag: () => undefined }));

const DISCORD_USER: { id: string; username: string; global_name: string | null } = { id: "123456789012345678", username: "misty", global_name: "Misty" };
const OTHER_DISCORD_USER = { id: "223456789012345678", username: "brock", global_name: null };
const made: string[] = [];
let customerId: string;

async function event(title: string, extra: Record<string, unknown> = {}) {
  const row = await prisma.event.create({
    data: { slug: `discord-test-${Math.random().toString(36).slice(2, 10)}`, title, kind: "tournament", game_id: "pokemon", starts_at: new Date(Date.now() + 5 * 86_400_000), status: "published", ...extra },
  });
  made.push(row.id);
  return row;
}

const command = (name: string, options: Record<string, string> = {}, user = DISCORD_USER) => ({
  type: 2,
  data: { name, options: Object.entries(options).map(([n, value]) => ({ name: n, value })) },
  member: { user },
});
interface Reply {
  type: number;
  data?: { content?: string; flags?: number; embeds?: { description?: string; title?: string }[]; components?: { components: { url?: string; label?: string }[] }[]; choices?: { name: string; value: string }[] };
}
const run = async (interaction: unknown) => (await handleInteraction(interaction)) as unknown as Reply;

beforeAll(async () => {
  const [row] = await prisma.$queryRaw<{ id: string }[]>`select id from auth.users where email = 'customer@mav.local'`;
  if (!row) throw new Error("seed user missing");
  customerId = row.id;
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await prisma.profile.updateMany({ where: { discord_user_id: { in: [DISCORD_USER.id, OTHER_DISCORD_USER.id] } }, data: { discord_user_id: null, discord_username: null } });
  await prisma.profile.update({ where: { id: customerId }, data: { pokemon_player_id: null, birth_month: null } });
  await prisma.serviceKey.deleteMany({ where: { name: "DISCORD_BOT_TOKEN" } });
  await prisma.discordSettings.update({ where: { id: 1 }, data: { announce_channel_id: null, staff_channel_id: null } });
});
afterAll(async () => {
  await prisma.event.deleteMany({ where: { id: { in: made } } });
});

describe("requests from Discord", () => {
  it("are accepted only with Discord's signature over the exact body", () => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    const hex = publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("hex");
    const body = JSON.stringify({ type: 1 });
    const timestamp = "1700000000";
    const signature = sign(null, Buffer.from(timestamp + body), privateKey).toString("hex");
    expect(verifyDiscordSignature(hex, signature, timestamp, body)).toBe(true);
    // Any change to the body or timestamp, a missing header, or another key fails.
    expect(verifyDiscordSignature(hex, signature, timestamp, body.replace("1", "2"))).toBe(false);
    expect(verifyDiscordSignature(hex, signature, "1700000001", body)).toBe(false);
    expect(verifyDiscordSignature(hex, null, timestamp, body)).toBe(false);
    expect(verifyDiscordSignature(hex, "zz", timestamp, body)).toBe(false);
    const other = generateKeyPairSync("ed25519").publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("hex");
    expect(verifyDiscordSignature(other, signature, timestamp, body)).toBe(false);
    expect(verifyDiscordSignature("not-a-key", signature, timestamp, body)).toBe(false);
  });

  it("answers Discord's check-in ping", async () => {
    expect(await run({ type: 1 })).toEqual({ type: 1 });
  });
});

describe("connecting a Discord account", () => {
  it("link tokens can't be forged, altered or used late", () => {
    const now = Date.now();
    const token = createLinkToken(DISCORD_USER.id, "Misty", now);
    expect(readLinkToken(token, now)).toEqual({ discordUserId: DISCORD_USER.id, discordUsername: "Misty" });
    expect(readLinkToken(token, now + 16 * 60 * 1000)).toBeNull();
    const [payload, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ id: OTHER_DISCORD_USER.id, name: "x", exp: now + 60_000 })).toString("base64url");
    expect(readLinkToken(`${forged}.${signature}`, now)).toBeNull();
    expect(readLinkToken(`${payload}.AAAA`, now)).toBeNull();
    expect(readLinkToken("nonsense", now)).toBeNull();
  });

  it("/link gives a private button; once connected it says so, and /unlink disconnects", async () => {
    const first = await run(command("link"));
    expect(first.data?.flags).toBe(64);
    const url = first.data?.components?.[0]?.components[0]?.url ?? "";
    expect(url).toContain("/link-discord?token=");
    expect(readLinkToken(decodeURIComponent(url.split("token=")[1] ?? ""))?.discordUserId).toBe(DISCORD_USER.id);

    await prisma.profile.update({ where: { id: customerId }, data: { discord_user_id: DISCORD_USER.id, discord_username: "Misty" } });
    expect((await run(command("link"))).data?.content).toContain("already connected");
    expect((await run(command("unlink"))).data?.content).toContain("no longer connected");
    expect((await prisma.profile.findUniqueOrThrow({ where: { id: customerId } })).discord_user_id).toBeNull();
  });
});

describe("slash commands", () => {
  it("/events lists published events and never drafts", async () => {
    const shown = await event(`Discord Cup ${Date.now()}`, { starts_at: new Date(Date.now() + 3_600_000) });
    const draft = await event(`Secret Draft ${Date.now()}`, { status: "draft", starts_at: new Date(Date.now() + 3_600_000) });
    // listEvents is cached in the app; here it reads straight from the database.
    const reply = await run(command("events"));
    const text = reply.data?.embeds?.[0]?.description ?? "";
    expect(text).toContain(shown.title);
    expect(text).not.toContain(draft.title);
    expect(reply.data?.flags).toBeUndefined();
  });

  it("/rsvp needs a connected account, then registers, and /cancel releases the seat", async () => {
    const cup = await event(`RSVP Night ${Date.now()}`);
    expect((await run(command("rsvp", { event: cup.slug }))).data?.content).toContain("/link");

    await prisma.profile.update({ where: { id: customerId }, data: { discord_user_id: DISCORD_USER.id } });
    const joined = await run(command("rsvp", { event: cup.slug }));
    expect(joined.data?.content).toContain("You're in");
    expect(joined.data?.flags).toBe(64);
    const registration = () => prisma.eventRegistration.findUnique({ where: { event_id_user_id: { event_id: cup.id, user_id: customerId } } });
    expect((await registration())?.status).toBe("registered");

    // Someone else's Discord account can't touch this registration.
    expect((await run(command("cancel", { event: cup.slug }, OTHER_DISCORD_USER))).data?.content).toContain("/link");
    expect((await registration())?.status).toBe("registered");

    expect((await run(command("cancel", { event: cup.slug }))).data?.content).toContain("released");
    expect((await registration())?.status).toBe("cancelled");
  });

  it("/rsvp sends players to the form when the event needs answers their profile can't give", async () => {
    const questions = [{ id: "q_pid", label: "Player ID", help: "", type: "number", required: true, autofill: "playerId", options: [] }];
    const cup = await event(`Questions Cup ${Date.now()}`, { questions });
    await prisma.profile.update({ where: { id: customerId }, data: { discord_user_id: DISCORD_USER.id } });

    const blocked = await run(command("rsvp", { event: cup.slug }));
    expect(blocked.data?.components?.[0]?.components[0]?.url).toContain(`/events/${cup.slug}?rsvp=1`);
    expect(await prisma.eventRegistration.count({ where: { event_id: cup.id } })).toBe(0);

    // With the Player ID saved on their profile, the bot can answer for them.
    await prisma.profile.update({ where: { id: customerId }, data: { pokemon_player_id: "7654321" } });
    expect((await run(command("rsvp", { event: cup.slug }))).data?.content).toContain("You're in");
    const saved = await prisma.eventRegistration.findUniqueOrThrow({ where: { event_id_user_id: { event_id: cup.id, user_id: customerId } } });
    expect(saved.answers).toEqual({ q_pid: "7654321" });
  });

  it("refuses an event that is closed, and one that doesn't exist", async () => {
    const past = await event(`Old Cup ${Date.now()}`, { starts_at: new Date(Date.now() - 86_400_000), status: "completed" });
    await prisma.profile.update({ where: { id: customerId }, data: { discord_user_id: DISCORD_USER.id } });
    expect((await run(command("rsvp", { event: past.slug }))).data?.content?.toLowerCase()).toContain("closed");
    expect((await run(command("rsvp", { event: "no-such-event" }))).data?.content).toContain("couldn't find");
  });

  it("suggests events as someone types, and never pings anyone", async () => {
    const cup = await event(`Typeahead Cup ${Date.now()}`, { starts_at: new Date(Date.now() + 7_200_000) });
    const reply = await run({ type: 4, data: { name: "rsvp", options: [{ name: "event", value: "typeahead", focused: true }] }, member: { user: DISCORD_USER } });
    expect(reply.type).toBe(8);
    expect(reply.data?.choices).toContainEqual({ name: cup.title, value: cup.slug });
    const anyReply = (await handleInteraction(command("hours"))) as { data: { allowed_mentions: unknown } };
    expect(anyReply.data.allowed_mentions).toEqual({ parse: [] });
  });

  it("every command Discord is told about has a handler", async () => {
    for (const c of COMMANDS) {
      const reply = await run(command(c.name, "options" in c && c.options.some((o) => "required" in o && o.required) ? { event: "no-such-event" } : {}));
      expect(reply.data?.content ?? "", c.name).not.toContain("don't know that command");
    }
  });
});

describe("more commands", () => {
  const link = (userId: string, discord = DISCORD_USER) => prisma.profile.update({ where: { id: userId }, data: { discord_user_id: discord.id } });

  it("/help is private and lists every command a player can use", async () => {
    const reply = (await handleInteraction(command("help"))) as { data: { flags?: number; embeds: { fields: { value: string }[] }[] } };
    expect(reply.data.flags).toBe(64);
    const text = reply.data.embeds[0]?.fields.map((f) => f.value).join("\n") ?? "";
    for (const c of COMMANDS) {
      // Help itself and the staff command are the only ones left out.
      if (c.name === "help" || c.name === "attendees") expect(text, c.name).not.toContain(`/${c.name}\``);
      else expect(text, c.name).toContain(`\`/${c.name}\` ${c.description}`);
    }
  });

  it("/event shows the details and what sign-up asks for", async () => {
    const questions = [{ id: "q_pid", label: "Player ID", help: "", type: "number", required: true, autofill: "playerId", options: [] }];
    const cup = await event(`Details Cup ${Date.now()}`, { questions, entry_fee_cents: 2000, capacity: 32, format: "Standard", link_url: "https://example.com/rules", link_label: "Rules" });
    const reply = await run(command("event", { event: cup.slug }));
    const text = reply.data?.embeds?.[0]?.description ?? "";
    expect(text).toContain("$20");
    expect(text).toContain("Standard");
    expect(text).toContain("Sign-up asks for: Player ID");
    const buttons = reply.data?.components?.[0]?.components ?? [];
    expect(buttons.map((b) => b.label)).toEqual(["Details and RSVP", "Rules"]);
    expect((await run(command("event", { event: "no-such-event" }))).data?.content).toContain("couldn't find");
  });

  it("/playerid saves, shows and validates the ID for a connected account", async () => {
    expect((await run(command("playerid", { id: "1234567" }))).data?.content).toContain("/link");
    await link(customerId);
    expect((await run(command("playerid"))).data?.content).toContain("haven't saved");
    expect((await run(command("playerid", { id: "12ab" }))).data?.content).toContain("numbers only");
    expect((await run(command("playerid", { id: "1234567" }))).data?.content).toContain("1234567");
    expect((await prisma.profile.findUniqueOrThrow({ where: { id: customerId } })).pokemon_player_id).toBe("1234567");
    expect((await run(command("playerid"))).data?.content).toContain("1234567");
  });

  it("/rank needs a connected account and says so when there are no results", async () => {
    expect((await run(command("rank"))).data?.content).toContain("/link");
    await link(customerId);
    const reply = await run(command("rank"));
    expect(reply.data?.flags).toBe(64);
    expect(reply.data?.content).toMatch(/you're \*\*#\d+|don't have any/);
  });

  it("/news, /sell and /jobs answer in public with a link", async () => {
    for (const name of ["sell", "jobs"]) {
      const reply = await run(command(name));
      expect(reply.data?.flags, name).toBeUndefined();
      expect(reply.data?.components?.[0]?.components[0]?.url, name).toContain("http");
    }
    const news = await run(command("news"));
    expect(news.data?.content ?? news.data?.embeds?.[0]?.title).toBeTruthy();
  });

  it("/attendees is for staff only and is never shown to the channel", async () => {
    const cup = await event(`Staff Cup ${Date.now()}`);
    await prisma.eventRegistration.create({ data: { event_id: cup.id, user_id: customerId, status: "registered", answers: {} } });

    // A customer who has connected Discord is refused.
    await link(customerId);
    expect((await run(command("attendees", { event: cup.slug }))).data?.content).toContain("for MAV staff");
    await prisma.profile.update({ where: { id: customerId }, data: { discord_user_id: null } });

    const [staff] = await prisma.$queryRaw<{ id: string }[]>`select id from auth.users where email = 'staff@mav.local'`;
    if (!staff) throw new Error("seed staff missing");
    await link(staff.id, OTHER_DISCORD_USER);
    const reply = await run(command("attendees", { event: cup.slug }, OTHER_DISCORD_USER));
    expect(reply.data?.flags).toBe(64);
    expect(reply.data?.embeds?.[0]?.title).toContain("1 signed up");
    expect(reply.data?.embeds?.[0]?.description).toContain("customer");
    // Someone who hasn't connected Discord at all is refused too.
    expect((await run(command("attendees", { event: cup.slug }))).data?.content).toContain("/link");
  });
});

describe("announcements", () => {
  const calls: { url: string; body: { embeds?: { title?: string }[]; allowed_mentions?: unknown } }[] = [];
  const stubDiscord = (ok = true) => {
    calls.length = 0;
    vi.stubGlobal("fetch", async (url: string, init: { body: string }) => {
      calls.push({ url, body: JSON.parse(init.body) as (typeof calls)[number]["body"] });
      return new Response(JSON.stringify(ok ? { id: "1" } : { message: "Missing Access" }), { status: ok ? 200 : 403, headers: { "Content-Type": "application/json" } });
    });
  };
  const connect = async () => {
    await prisma.serviceKey.create({ data: { name: "DISCORD_BOT_TOKEN", ciphertext: encryptServiceKey("testtokentesttokentesttoken.AbCdEf.testtokentesttokentesttoken") } });
    await prisma.discordSettings.update({ where: { id: 1 }, data: { announce_channel_id: "333456789012345678" } });
  };

  it("does nothing until the bot is set up", async () => {
    stubDiscord();
    const cup = await event(`Quiet Cup ${Date.now()}`);
    await announceEvent(cup.id);
    expect(calls).toHaveLength(0);
    expect((await prisma.event.findUniqueOrThrow({ where: { id: cup.id } })).discord_announced_at).toBeNull();
  });

  it("announces a published event once, in the right channel, without pings", async () => {
    stubDiscord();
    await connect();
    const cup = await event(`Loud Cup ${Date.now()}`);
    await Promise.all([announceEvent(cup.id), announceEvent(cup.id)]);
    await announceEvent(cup.id);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toContain("/channels/333456789012345678/messages");
    expect(calls[0]?.body.embeds?.[0]?.title).toBe(cup.title);
    expect(calls[0]?.body.allowed_mentions).toEqual({ parse: [] });
  });

  it("never announces a draft, and tries again later if Discord refused", async () => {
    await connect();
    stubDiscord();
    const draft = await event(`Draft Cup ${Date.now()}`, { status: "draft" });
    await announceEvent(draft.id);
    expect(calls).toHaveLength(0);

    stubDiscord(false);
    const cup = await event(`Retry Cup ${Date.now()}`);
    await announceEvent(cup.id);
    expect((await prisma.event.findUniqueOrThrow({ where: { id: cup.id } })).discord_announced_at).toBeNull();
    stubDiscord();
    await announceEvent(cup.id);
    expect(calls).toHaveLength(1);
  });

  it("reminds about events in the next day, once each", async () => {
    await connect();
    stubDiscord();
    const soon = await event(`Tomorrow Cup ${Date.now()}`, { starts_at: new Date(Date.now() + 6 * 3_600_000) });
    await event(`Next Week Cup ${Date.now()}`, { starts_at: new Date(Date.now() + 6 * 86_400_000) });
    await remindUpcomingEvents();
    await remindUpcomingEvents();
    const reminded = calls.filter((c) => c.body.embeds?.[0]?.title === soon.title);
    expect(reminded).toHaveLength(1);
    expect(calls.some((c) => c.body.embeds?.[0]?.title?.startsWith("Next Week Cup"))).toBe(false);
  });
});
