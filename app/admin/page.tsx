import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@components/hub/page-header";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES } from "@interfaces/roles";
import { prisma } from "@lib/prisma";
import { listAllEventsForStaff } from "@lib/data/hub";
import { capacityLabel, formatEventWhen } from "@lib/format";
import { requestTime, upcomingOnly } from "@lib/hub-rules";

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
  const stat = "rounded-xl border border-line bg-panel p-4";
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href="/admin/vendors" className={`${stat} hover:border-gold/50`}>
          <p className="text-3xl font-extrabold text-gold">{pendingVendors}</p>
          <p className="text-sm text-muted-foreground">Vendor applications waiting</p>
        </Link>
        <Link href="/admin/events" className={`${stat} hover:border-gold/50`}>
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
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
          {upcoming.map((e) => (
            <li key={e.id} className="flex flex-col gap-2 p-4 fold:flex-row fold:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{e.title}</p>
                <p className="text-sm text-muted-foreground">{formatEventWhen(e.startsAt)} · {capacityLabel(e.capacity, e.registeredCount, e.waitlistCount)}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/events/${e.id}/attendees`} className="inline-flex min-h-10 items-center rounded-md bg-gold px-3 text-sm font-bold text-ink">Check-in</Link>
                <Link href={`/admin/events/${e.id}`} className="inline-flex min-h-10 items-center rounded-md border border-line px-3 text-sm font-semibold">Edit</Link>
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
            <Link href="/admin/events/new" className="inline-flex min-h-10 items-center rounded-md bg-gold px-4 text-sm font-bold text-ink hover:bg-gold-light">New event</Link>
            <Link href="/admin/posts/new" className="inline-flex min-h-10 items-center rounded-md border border-line px-4 text-sm font-semibold hover:border-gold/60">New post</Link>
          </>
        }
      />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-panel" />}>
        <Overview />
      </Suspense>
    </>
  );
}
