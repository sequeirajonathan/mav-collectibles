import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { serverEnv } from "@lib/env.server";
import { refreshSearchIndex } from "@lib/data/catalog";
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
  try {
    const result = await refreshSearchIndex();
    revalidateTag(tags.catalog, "max");
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Search index refresh failed", error);
    return NextResponse.json({ error: { code: "INTERNAL", message: "Refresh failed" } }, { status: 500 });
  }
}
