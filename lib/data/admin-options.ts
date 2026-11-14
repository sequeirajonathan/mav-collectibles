import "server-only";
import { prisma } from "@lib/prisma";

/** Events a post can link to: anything not deleted, newest first. */
export async function eventOptions() {
  const rows = await prisma.event.findMany({ select: { id: true, title: true, starts_at: true }, orderBy: { starts_at: "desc" }, take: 100 });
  return rows.map((r) => ({ id: r.id, title: `${r.title} (${r.starts_at.toISOString().slice(0, 10)})` }));
}
