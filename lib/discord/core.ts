import "server-only";
import { createHmac, createPublicKey, hkdfSync, timingSafeEqual, verify } from "node:crypto";
import { prisma } from "@lib/prisma";
import { serverEnv } from "@lib/env.server";
import { getServiceKey } from "@lib/service-keys";

/**
 * The plumbing for the shop's Discord bot.
 *
 * The site can't hold a permanent connection to Discord, so the bot works over
 * plain web requests: Discord calls /api/discord/interactions when someone uses
 * a slash command, and the site calls Discord's REST API to post messages.
 */

const API = "https://discord.com/api/v10";
/** DER prefix that turns a raw 32-byte Ed25519 key into a key Node can load. */
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

export interface DiscordSettings {
  applicationId: string | null;
  publicKey: string | null;
  guildId: string | null;
  announceChannelId: string | null;
  staffChannelId: string | null;
  announceEvents: boolean;
  announceReminders: boolean;
  announceResults: boolean;
  staffAlerts: boolean;
  commandsRegisteredAt: string | null;
}

export async function getDiscordSettings(): Promise<DiscordSettings> {
  const row = await prisma.discordSettings.findUnique({ where: { id: 1 } });
  return {
    applicationId: row?.application_id ?? null,
    publicKey: row?.public_key ?? null,
    guildId: row?.guild_id ?? null,
    announceChannelId: row?.announce_channel_id ?? null,
    staffChannelId: row?.staff_channel_id ?? null,
    announceEvents: row?.announce_events ?? true,
    announceReminders: row?.announce_reminders ?? true,
    announceResults: row?.announce_results ?? true,
    staffAlerts: row?.staff_alerts ?? true,
    commandsRegisteredAt: row?.commands_registered_at?.toISOString() ?? null,
  };
}

/**
 * Checks that a request really came from Discord: every interaction is signed
 * with the application's Ed25519 key over the timestamp and the exact body.
 */
export function verifyDiscordSignature(publicKeyHex: string, signatureHex: string | null, timestamp: string | null, body: string): boolean {
  if (!signatureHex || !timestamp || !/^[0-9a-f]{64}$/i.test(publicKeyHex) || !/^[0-9a-f]{128}$/i.test(signatureHex)) return false;
  try {
    const key = createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(publicKeyHex, "hex")]), format: "der", type: "spki" });
    return verify(null, Buffer.from(timestamp + body), key, Buffer.from(signatureHex, "hex"));
  } catch {
    return false;
  }
}

export class DiscordError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

/** Calls Discord's REST API as the bot. Throws a DiscordError with Discord's own explanation when it refuses. */
export async function discordApi<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = await getServiceKey("DISCORD_BOT_TOKEN");
  if (!token) throw new DiscordError("The Discord bot token isn't set (Admin → Site → Service keys).", 0);
  const response = await fetch(`${API}${path}`, {
    method: init.method ?? (init.body === undefined ? "GET" : "POST"),
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json", "User-Agent": "DiscordBot (https://mavcollectibles.com, 1.0)" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new DiscordError(detail?.message ?? `Discord answered ${response.status}`, response.status);
  }
  return (response.status === 204 ? null : await response.json()) as T;
}

interface DiscordMessage {
  content?: string;
  embeds?: Record<string, unknown>[];
  components?: Record<string, unknown>[];
}

/**
 * Posts in a channel. Best-effort: announcements must never break the thing
 * that triggered them, so failures are logged and reported as `false`.
 */
export async function postToChannel(channelId: string | null, message: DiscordMessage): Promise<boolean> {
  if (!channelId) return false;
  try {
    // Never let text written by staff or players ping @everyone or a role.
    await discordApi(`/channels/${channelId}/messages`, { body: { ...message, allowed_mentions: { parse: [] } } });
    return true;
  } catch (error) {
    console.error("Discord post failed", error instanceof Error ? error.message : error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Connecting a Discord account to a site account
// ---------------------------------------------------------------------------
const LINK_TTL_MS = 15 * 60 * 1000;

function linkSecret(): Buffer {
  return Buffer.from(hkdfSync("sha256", serverEnv().SUPABASE_SECRET_KEY, "mav-collectibles", "discord-link-v1", 32));
}

/** A short-lived token that proves "the Discord user with this id asked to connect". */
export function createLinkToken(discordUserId: string, discordUsername: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ id: discordUserId, name: discordUsername.slice(0, 64), exp: now + LINK_TTL_MS })).toString("base64url");
  return `${payload}.${createHmac("sha256", linkSecret()).update(payload).digest("base64url")}`;
}

export function readLinkToken(token: string, now = Date.now()): { discordUserId: string; discordUsername: string } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", linkSecret()).update(payload).digest();
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { id?: unknown; name?: unknown; exp?: unknown };
    if (typeof data.id !== "string" || !/^[0-9]{15,22}$/.test(data.id) || typeof data.name !== "string" || typeof data.exp !== "number" || data.exp < now) return null;
    return { discordUserId: data.id, discordUsername: data.name };
  } catch {
    return null;
  }
}
