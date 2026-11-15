import { Suspense } from "react";
import type { Route } from "next";
import { PageHeader, EmptyState } from "@components/ui/page-header";
import { ChipLink } from "@components/ui/chip";
import { LinkButton } from "@components/ui/link-button";
import { Skeleton } from "@components/ui/skeleton";
import { ApplicationCard } from "@components/admin/job-applications";
import { requirePageRole } from "@lib/auth/guard";
import { HIRING_ROLES, UserRole } from "@interfaces/roles";
import { listJobApplications } from "@lib/data/jobs";
import { APPLICATION_STATUS_LABEL, applicationStatusSchema } from "@lib/contracts/jobs";

type SearchParams = Promise<{ status?: string }>;

async function Applications({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePageRole(HIRING_ROLES, "/admin/applications");
  const status = applicationStatusSchema.catch("new").parse((await searchParams).status);
  const { rows, counts } = await listJobApplications(status);
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {applicationStatusSchema.options.map((s) => (
          <ChipLink key={s} href={`/admin/applications?status=${s}` as Route} active={s === status}>
            {APPLICATION_STATUS_LABEL[s]} ({counts[s]})
          </ChipLink>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState
          title={status === "new" ? "No new applications" : `Nothing under "${APPLICATION_STATUS_LABEL[status]}"`}
          description="Applications sent from the We're hiring page show up here."
          action={<LinkButton href="/jobs" variant="outline">View the hiring page</LinkButton>}
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((a) => (
            <ApplicationCard key={`${a.id}-${a.status}-${a.notes.length}`} application={a} isAdmin={user.role === UserRole.ADMIN} />
          ))}
        </div>
      )}
    </>
  );
}

export default function AdminApplicationsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Job applications" description="People who applied through the We're hiring page. Résumés open through a private link that only staff can use." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Applications searchParams={searchParams} />
      </Suspense>
    </>
  );
}
