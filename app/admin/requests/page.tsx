import { Suspense } from "react";
import type { Route } from "next";
import { z } from "zod";
import { PageHeader, EmptyState } from "@components/ui/page-header";
import { ChipLink } from "@components/ui/chip";
import { Skeleton } from "@components/ui/skeleton";
import { RequestCard, RequestForm } from "@components/admin/staff-requests";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES, UserRole } from "@interfaces/roles";
import { listStaffRequests } from "@lib/data/requests";

type SearchParams = Promise<{ view?: string }>;

const viewSchema = z.enum(["open", "done", "declined"]);
const LABELS = { open: "To do", done: "Done", declined: "Not doing" } as const;
const EMPTY = {
  open: { title: "Nothing waiting", description: "Requests you send show up here until they're finished." },
  done: { title: "Nothing finished yet", description: "Completed requests are kept here as a record." },
  declined: { title: "Nothing declined", description: "Requests that won't be done are listed here with the reason." },
} as const;

async function Requests({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePageRole(CONTENT_ROLES, "/admin/requests");
  const view = viewSchema.catch("open").parse((await searchParams).view);
  const { rows, counts } = await listStaffRequests(view);
  const isAdmin = user.role === UserRole.ADMIN;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
      <RequestForm />
      <section aria-label="Requests">
        <div className="mb-4 flex flex-wrap gap-2">
          {viewSchema.options.map((v) => (
            <ChipLink key={v} href={`/admin/requests?view=${v}` as Route} active={v === view}>
              {LABELS[v]} ({counts[v]})
            </ChipLink>
          ))}
        </div>
        {rows.length === 0 ? (
          <EmptyState {...EMPTY[view]} />
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {rows.map((r) => (
              <RequestCard key={`${r.id}-${r.updatedAt}`} request={r} isAdmin={isAdmin} isMine={r.createdBy === user.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Requests" description="Ask for a new feature or report something broken. Each request is tracked here until it's finished." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Requests searchParams={searchParams} />
      </Suspense>
    </>
  );
}
