import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { prisma } from "@lib/prisma";

/**
 * What each role can do straight through Supabase's Data API with only the
 * public key and their own access token, i.e. without going through the app.
 * Everything here must be blocked by grants and RLS
 * (supabase/migrations/*), not by app code.
 */
const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

const tokenSchema = z.object({ access_token: z.string(), user: z.object({ id: z.string() }) });
type Session = z.infer<typeof tokenSchema>;

async function signIn(email: string): Promise<Session> {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: KEY, "content-type": "application/json" },
    body: JSON.stringify({ email, password: "password123" }),
  });
  return tokenSchema.parse(await res.json());
}

async function rest(path: string, init: { method?: string; token?: string; body?: unknown } = {}) {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    method: init.method ?? "GET",
    headers: {
      apikey: KEY,
      "content-type": "application/json",
      prefer: "return=representation",
      ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  const json: unknown = text ? JSON.parse(text) : null;
  return { status: res.status, rows: Array.isArray(json) ? json : null };
}

const HUB_TABLES = [
  "events", "event_registrations", "posts", "post_likes", "post_saves", "post_comments",
  "vendors", "event_vendors", "seasons", "tournament_results", "games",
  "feature_flags", "staff_requests", "job_applications", "alert_banners", "youtube_settings", "VideoSettings", "installers",
];

let customer: Session;
let printer: Session;
let staff: Session;
let admin: Session;
let jobId: string;

beforeAll(async () => {
  [customer, printer, staff, admin] = await Promise.all(
    ["customer@mav.local", "printer@mav.local", "staff@mav.local", "admin@mav.local"].map(signIn)
  );
  const job = await prisma.printJob.create({
    data: { order_id: `rls-${Date.now()}`, label_url: "https://example.com/label.pdf", status: "pending" },
  });
  jobId = job.id;
});

afterAll(async () => {
  await prisma.printJob.deleteMany({ where: { id: jobId } });
  await prisma.$disconnect();
});

describe("hub tables are server-only", () => {
  it.each(HUB_TABLES)("%s can't be read or written by anon or a signed-in user", async (table) => {
    expect((await rest(`${table}?select=*`)).rows).toBeNull();
    for (const s of [customer, admin]) {
      expect((await rest(`${table}?select=*`, { token: s.access_token })).rows).toBeNull();
      const insert = await rest(table, { method: "POST", token: s.access_token, body: {} });
      expect(insert.status).toBeGreaterThanOrEqual(400);
    }
  });

  it("registration functions can't be called directly", async () => {
    const res = await rest("rpc/register_for_event", {
      method: "POST",
      token: customer.access_token,
      body: { p_event_id: crypto.randomUUID(), p_user_id: admin.user.id },
    });
    expect(res.status).toBe(403);
  });
});

describe("profiles", () => {
  it("anon sees none; a user sees only their own", async () => {
    expect((await rest("profiles?select=id")).rows ?? []).toHaveLength(0);
    const own = await rest("profiles?select=id", { token: customer.access_token });
    expect(own.rows).toEqual([{ id: customer.user.id }]);
  });

  it("staff can read all profiles", async () => {
    const all = await rest("profiles?select=id", { token: staff.access_token });
    expect(all.rows?.length).toBeGreaterThan(1);
  });

  it("a user can't edit someone else's profile", async () => {
    const res = await rest(`profiles?id=eq.${admin.user.id}`, {
      method: "PATCH",
      token: customer.access_token,
      body: { first_name: "Hacked" },
    });
    expect(res.rows ?? []).toHaveLength(0);
  });

  it("a user can't set server-managed columns or oversized values on their own profile", async () => {
    const patch = (body: unknown) =>
      rest(`profiles?id=eq.${customer.user.id}`, { method: "PATCH", token: customer.access_token, body });
    expect((await patch({ avatar_url: "https://evil.example.com/x.png" })).status).toBe(403);
    expect((await patch({ id: crypto.randomUUID() })).status).toBe(403);
    expect((await patch({ first_name: "x".repeat(500) })).status).toBe(400);
    expect((await patch({ phone: "<script>" })).status).toBe(400);
    expect((await patch({ username: "has spaces" })).status).toBe(400);
    expect((await patch({ first_name: "Ash" })).status).toBe(200);
  });
});

describe("print jobs", () => {
  it("customers can't see or change them", async () => {
    expect((await rest("print_jobs?select=id", { token: customer.access_token })).rows).toEqual([]);
    const res = await rest(`print_jobs?id=eq.${jobId}`, {
      method: "PATCH",
      token: customer.access_token,
      body: { status: "printed" },
    });
    expect(res.rows ?? []).toHaveLength(0);
  });

  it("nobody can create a job through the Data API", async () => {
    const res = await rest("print_jobs", {
      method: "POST",
      token: admin.access_token,
      body: { order_id: "x", label_url: "https://example.com/x.pdf" },
    });
    expect(res.status).toBe(403);
  });

  it("a print agent can update progress but not what gets printed", async () => {
    const progress = await rest(`print_jobs?id=eq.${jobId}`, {
      method: "PATCH",
      token: printer.access_token,
      body: { status: "printing", claimed_by: "agent-1", claimed_at: new Date().toISOString() },
    });
    expect(progress.rows).toHaveLength(1);

    for (const body of [{ label_url: "https://evil.example.com/x.pdf" }, { copies: 99 }, { order_id: "other" }]) {
      const res = await rest(`print_jobs?id=eq.${jobId}`, { method: "PATCH", token: printer.access_token, body });
      expect(res.status).toBe(403);
    }
  });

  it("the database rejects non-https label URLs", async () => {
    await expect(
      prisma.printJob.create({ data: { order_id: "bad", label_url: "file:///etc/passwd", status: "pending" } })
    ).rejects.toThrow();
  });
});
