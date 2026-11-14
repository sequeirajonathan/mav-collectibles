import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@components/ui/page-header";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES } from "@interfaces/roles";
import { prisma } from "@lib/prisma";
import { listAllEventsForStaff } from "@lib/data/hub";
import { capacityLabel, formatEventWhen } from "@lib/format";
import { requestTime, upcomingOnly } from "@lib/hub-rules";
import { cardVariants } from "@components/ui/card";
import { Skeleton } from "@components/ui/skeleton";
import { LinkButton } from "@components/ui/link-button";

async function Overview() {
  await requirePageRole(CONTENT_ROLES, "/admin");
  const [events, pendingVendors, comments24h, members] = await Promise.all([
    listAllEventsForStaff(),
    prisma.vendor.count({ where: { status: "pending" } }),
    prisma.postComment.count({ where: { created_at: { gte: new Date(requestTime() - 86_400_000) }, deleted_at: null } }),
    prisma.profile.count(),
  ]);
  const upcoming = upcomingOnly(events, requestTime()).reverse().slice(0, 5);
  const drafts = events.filter((e) => e.status === "draft").length;
  const stat = cardVariants({ padding: "md" });
  const linkStat = cardVariants({ variant: "interactive", padding: "md" });
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href="/admin/vendors" className={linkStat}>
          <p className="text-3xl font-extrabold text-gold">{pendingVendors}</p>
          <p className="text-sm text-muted-foreground">Vendor applications waiting</p>
        </Link>
        <Link href="/admin/events" className={linkStat}>
          <p className="text-3xl font-extrabold">{drafts}</p>
          <p className="text-sm text-muted-foreground">Draft events</p>
        </Link>
        <div className={stat}>
          <p className="text-3xl font-extrabold">{comments24h}</p>
          <p className="text-sm text-muted-foreground">Comments in the last day</p>
        </div>
        <div className={stat}>
          <p className="text-3xl font-extrabold">{members}</p>
          <p className="text-sm text-muted-foreground">Members</p>
        </div>
      </div>
      <h2 className="mb-3 mt-8 text-lg font-bold">Next events</h2>
      {upcoming.length === 0 ? (
        <p className="text-muted-foreground">Nothing published coming up.</p>
      ) : (
        <ul className={cardVariants({ variant: "list" })}>
          {upcoming.map((e) => (
            <li key={e.id} className="flex flex-col gap-2 p-4 fold:flex-row fold:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{e.title}</p>
                <p className="text-sm text-muted-foreground">{formatEventWhen(e.startsAt)} · {capacityLabel(e.capacity, e.registeredCount, e.waitlistCount)}</p>
              </div>
              <div className="flex gap-2">
                <LinkButton href={`/admin/events/${e.id}/attendees`} size="sm">Check-in</LinkButton>
                <LinkButton href={`/admin/events/${e.id}`} variant="outline" size="sm">Edit</LinkButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function AdminHome() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        actions={
          <>
            <LinkButton href="/admin/events/new" size="sm">New event</LinkButton>
            <LinkButton href="/admin/posts/new" variant="outline" size="sm">New post</LinkButton>
          </>
        }
      />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Overview />
      </Suspense>
    </>
  );
}
