import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { prisma } from "@lib/prisma";
import { serverEnv } from "@lib/env.server";

/**
 * Keys for outside services that an admin can enter in Admin → Site.
 *
 * Only the services listed here can be set this way. Keys the site can't run
 * without (database, sign-in, Square) stay in the hosting settings. A key set
 * in the hosting settings always wins over one saved here.
 */
export const SERVICE_KEYS = {
  GOOGLE_PLACES_API_KEY: {
    label: "Google reviews",
    purpose: "Shows the shop's star rating and recent Google reviews.",
    where: "Google Cloud Console → APIs & Services → Credentials. The project needs billing turned on and “Places API” enabled.",
    pattern: /^AIza[0-9A-Za-z_-]{20,60}$/,
    hint: "Starts with AIza",
  },
  RESEND_API_KEY: {
    label: "Email (Resend)",
    purpose: "Sends job applications to the shop and tells staff when their request is finished.",
    where: "resend.com → API Keys. A “sending access” key is enough.",
    pattern: /^re_[0-9A-Za-z_-]{10,100}$/,
    hint: "Starts with re_",
  },
  SHIPPO_API_KEY: {
    label: "Address checking (Shippo)",
    purpose: "Checks and corrects shipping addresses customers enter.",
    where: "goshippo.com → Settings → API.",
    pattern: /^shippo_(live|test)_[0-9A-Za-z]{10,100}$/,
    hint: "Starts with shippo_live_",
  },
  DISCORD_BOT_TOKEN: {
    label: "Discord bot",
    purpose: "Lets the shop's bot post announcements and answer slash commands in your Discord server.",
    where: "Discord Developer Portal → your application → Bot → Reset Token.",
    pattern: /^[A-Za-z0-9_-]{20,40}\.[A-Za-z0-9_-]{4,10}\.[A-Za-z0-9_-]{20,60}$/,
    hint: "Three parts separated by dots",
  },
} as const;

type ServiceKeyName = keyof typeof SERVICE_KEYS;
export const SERVICE_KEY_NAMES = Object.keys(SERVICE_KEYS) as [ServiceKeyName, ...ServiceKeyName[]];

/** Encryption key derived from the server's Supabase secret, so stored values are useless without it. */
function cipherKey(): Buffer {
  return Buffer.from(hkdfSync("sha256", serverEnv().SUPABASE_SECRET_KEY, "mav-collectibles", "service-keys-v1", 32));
}

export function encryptServiceKey(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", cipherKey(), iv);
  const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), body.toString("base64url")].join(".");
}

/** Null when the value was stored under a different secret or has been altered. */
export function decryptServiceKey(stored: string): string | null {
  const [version, iv, tag, body] = stored.split(".");
  if (version !== "v1" || !iv || !tag || !body) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", cipherKey(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

function fromEnvironment(name: ServiceKeyName): string | undefined {
  // The bot token isn't part of the validated server environment; read it directly.
  if (name === "DISCORD_BOT_TOKEN") return process.env.DISCORD_BOT_TOKEN || undefined;
  return serverEnv()[name];
}

/** The key to use for a service: the hosting setting if there is one, otherwise what an admin saved. */
export async function getServiceKey(name: ServiceKeyName): Promise<string | undefined> {
  const fromHost = fromEnvironment(name);
  if (fromHost) return fromHost;
  const row = await prisma.serviceKey.findUnique({ where: { name }, select: { ciphertext: true } }).catch(() => null);
  return (row && decryptServiceKey(row.ciphertext)) ?? undefined;
}

export interface ServiceKeyStatus {
  name: ServiceKeyName;
  label: string;
  purpose: string;
  where: string;
  hint: string;
  /** "host": set in the hosting settings (wins). "saved": entered here. "unreadable": saved but can't be decrypted any more. */
  source: "host" | "saved" | "unreadable" | "none";
  updatedAt: string | null;
}

/** What is set and where it came from. Never includes a key's value. */
export async function listServiceKeyStatus(): Promise<ServiceKeyStatus[]> {
  const rows = await prisma.serviceKey.findMany();
  return SERVICE_KEY_NAMES.map((name) => {
    const { label, purpose, where, hint } = SERVICE_KEYS[name];
    const row = rows.find((r) => r.name === name);
    const source = fromEnvironment(name) ? "host" : row ? (decryptServiceKey(row.ciphertext) ? "saved" : "unreadable") : "none";
    return { name, label, purpose, where, hint, source, updatedAt: row?.updated_at.toISOString() ?? null };
  });
}

/** Asks Google for the shop's rating with this key, and says in plain words whether it worked. */
export async function checkGoogleKey(key: string, placeId: string | undefined): Promise<{ ok: boolean; message: string }> {
  if (!placeId) return { ok: false, message: "The shop's Google listing ID isn't set, so the key can't be tried." };
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "rating,user_ratings_total");
  url.searchParams.set("key", key);
  try {
    const data = (await (await fetch(url, { signal: AbortSignal.timeout(8000) })).json()) as { status?: string; error_message?: string; result?: { rating?: number; user_ratings_total?: number } };
    if (data.status === "OK") {
      const { rating, user_ratings_total: total } = data.result ?? {};
      return { ok: true, message: rating ? `Working: ${rating.toFixed(1)} stars from ${total ?? 0} reviews.` : "Working, but Google has no rating for the shop yet." };
    }
    // Google's own explanation is the most useful thing to show (billing off, API not enabled, key restricted…).
    return { ok: false, message: `Google refused the key: ${data.error_message ?? data.status ?? "no reason given"}` };
  } catch {
    return { ok: false, message: "Couldn't reach Google to try the key. It was saved; try again in a minute." };
  }
}
