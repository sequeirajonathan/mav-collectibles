import "server-only";
import { prisma } from "@lib/prisma";
import { OPEN_STATUSES, staffRequestSchema, type RequestStatus, type StaffRequest } from "@lib/contracts/requests";

const PRIORITY_ORDER = { high: 0, normal: 1, low: 2 } as const;

/** Requests for Admin → Requests (not cached: staff need the live list). */
export async function listStaffRequests(view: "open" | "done" | "declined"): Promise<{ rows: StaffRequest[]; counts: Record<"open" | "done" | "declined", number> }> {
  const statuses: RequestStatus[] = view === "open" ? [...OPEN_STATUSES] : [view];
  const [rows, grouped] = await Promise.all([
    prisma.staffRequest.findMany({
      where: { status: { in: statuses } },
      orderBy: view === "open" ? { created_at: "asc" } : { updated_at: "desc" },
      take: 200,
    }),
    prisma.staffRequest.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const counts = { open: 0, done: 0, declined: 0 };
  for (const g of grouped) {
    if (g.status === "done") counts.done += g._count._all;
    else if (g.status === "declined") counts.declined += g._count._all;
    else counts.open += g._count._all;
  }
  const parsed = rows.map((r) =>
    staffRequestSchema.parse({
      id: r.id,
      kind: r.kind,
      title: r.title,
      details: r.details,
      page: r.page,
      priority: r.priority,
      status: r.status,
      createdBy: r.created_by,
      createdByName: r.created_by_name,
      response: r.response,
      completedAt: r.completed_at?.toISOString() ?? null,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    })
  );
  // Open work: urgent first, then oldest first.
  if (view === "open") parsed.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  return { rows: parsed, counts };
}

export async function countOpenStaffRequests(): Promise<number> {
  return prisma.staffRequest.count({ where: { status: { in: [...OPEN_STATUSES] } } });
}
