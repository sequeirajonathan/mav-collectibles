import Link from "next/link";
import { Suspense } from "react";
import { PageHeader, EmptyState } from "@components/ui/page-header";
import { StatusPill } from "@components/hub/badges";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES } from "@interfaces/roles";
import { listAllEventsForStaff } from "@lib/data/hub";
import { capacityLabel, formatEventWhen } from "@lib/format";
import { cardVariants } from "@components/ui/card";
import { Skeleton } from "@components/ui/skeleton";
import { LinkButton } from "@components/ui/link-button";

async function List() {
  await requirePageRole(CONTENT_ROLES, "/admin/events");
  const events = await listAllEventsForStaff();
  if (events.length === 0) return <EmptyState mascot="rayquaza" title="No events yet" action={<Link href="/admin/events/new" className="font-semibold text-gold">Create the first one →</Link>} />;
  return (
    <ul className={cardVariants({ variant: "list" })}>
      {events.map((e) => (
        <li key={e.id}>
          <Link href={`/admin/events/${e.id}`} className="flex flex-col gap-1 p-4 hover:bg-panel-2 fold:flex-row fold:items-center fold:gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{e.title}</p>
              <p className="text-sm text-muted-foreground">{formatEventWhen(e.startsAt)} · {capacityLabel(e.capacity, e.registeredCount, e.waitlistCount)}</p>
            </div>
            <StatusPill status={e.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function AdminEventsPage() {
  return (
    <>
      <PageHeader title="Events" actions={<LinkButton href="/admin/events/new" size="sm">New event</LinkButton>} />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <List />
      </Suspense>
    </>
  );
}
