import "server-only";
import { prisma } from "@lib/prisma";
import { applicationStatusSchema, jobApplicationSchema, type ApplicationStatus, type JobApplication } from "@lib/contracts/jobs";

/** Applications for Admin → Applications (not cached: reviewers need the live list). */
export async function listJobApplications(status: ApplicationStatus): Promise<{ rows: JobApplication[]; counts: Record<ApplicationStatus, number> }> {
  const [rows, grouped] = await Promise.all([
    prisma.jobApplication.findMany({ where: { status }, orderBy: { created_at: "desc" }, take: 200 }),
    prisma.jobApplication.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(applicationStatusSchema.options.map((s) => [s, 0])) as Record<ApplicationStatus, number>;
  for (const g of grouped) if (g.status in counts) counts[g.status as ApplicationStatus] = g._count._all;
  return {
    counts,
    rows: rows.map((r) =>
      jobApplicationSchema.parse({
        id: r.id,
        position: r.position,
        name: r.name,
        email: r.email,
        phone: r.phone,
        availability: r.availability,
        message: r.message,
        resumeName: r.resume_path ? (r.resume_name ?? "résumé") : null,
        status: r.status,
        notes: r.notes,
        createdAt: r.created_at.toISOString(),
      })
    ),
  };
}

export async function countNewJobApplications(): Promise<number> {
  return prisma.jobApplication.count({ where: { status: "new" } });
}
