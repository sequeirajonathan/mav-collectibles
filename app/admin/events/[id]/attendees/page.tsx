import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@components/ui/page-header";
import { EventTabs } from "@components/admin/event-tabs";
import { AttendeeList } from "@components/admin/attendee-list";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES } from "@interfaces/roles";
import { getEventForEdit, listAttendees } from "@lib/data/hub";
import { uuid } from "@lib/contracts/common";
import { formatEventWhen } from "@lib/format";
import { Skeleton } from "@components/ui/skeleton";

type Params = Promise<{ id: string }>;

async function Attendees({ params }: { params: Params }) {
  const { id } = await params;
  await requirePageRole(CONTENT_ROLES, `/admin/events/${id}/attendees`);
  if (!uuid.safeParse(id).success) notFound();
  const [event, attendees] = await Promise.all([getEventForEdit(id), listAttendees(id)]);
  if (!event) notFound();
  return (
    <>
      <PageHeader title={event.title} description={formatEventWhen(event.starts_at.toISOString())} />
      <EventTabs id={id} active="attendees" />
      <AttendeeList eventId={id} attendees={attendees} />
    </>
  );
}

export default function AttendeesPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Attendees params={params} />
    </Suspense>
  );
}
