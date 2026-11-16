import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { serverEnv } from "@lib/env.server";
import { refreshSearchIndex } from "@lib/data/catalog";
import { remindUpcomingEvents } from "@lib/discord/announce";
import { sendRequestAlerts } from "@lib/request-alerts";
import { tags } from "@lib/data/tags";

export const maxDuration = 300;

function authorized(request: NextRequest): boolean {
  const secret = serverEnv().CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Daily job (vercel.json): rebuild the shop's search index from the catalog. */
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not allowed" } }, { status: 401 });
  // Backstop for finished staff requests that haven't been announced yet.
  await sendRequestAlerts().catch((error) => console.error("Request alerts failed", error));
  // Discord: remind the server about events starting in the next day.
  await remindUpcomingEvents().catch((error) => console.error("Discord reminders failed", error));
  try {
    const result = await refreshSearchIndex();
    revalidateTag(tags.catalog, "max");
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Search index refresh failed", error);
    return NextResponse.json({ error: { code: "INTERNAL", message: "Refresh failed" } }, { status: 500 });
  }
}
