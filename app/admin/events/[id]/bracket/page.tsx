import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@components/ui/page-header";
import { EventTabs } from "@components/admin/event-tabs";
import { BracketManager } from "@components/admin/bracket-manager";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES } from "@interfaces/roles";
import { getBracketForStaff, getEventForEdit, listAttendees } from "@lib/data/hub";
import { uuid } from "@lib/contracts/common";
import { Skeleton } from "@components/ui/skeleton";

type Params = Promise<{ id: string }>;

async function Bracket({ params }: { params: Params }) {
  const { id } = await params;
  await requirePageRole(CONTENT_ROLES, `/admin/events/${id}/bracket`);
  if (!uuid.safeParse(id).success) notFound();
  const [event, attendees, bracket] = await Promise.all([getEventForEdit(id), listAttendees(id), getBracketForStaff(id)]);
  if (!event) notFound();
  return (
    <>
      <PageHeader title={event.title} description="An elimination bracket for this event: the whole tournament, or the top cut after Swiss rounds." />
      <EventTabs id={id} active="bracket" />
      <BracketManager
        eventId={id}
        bracket={bracket}
        candidates={attendees.filter((a) => a.status !== "waitlisted").map((a) => ({ userId: a.userId, name: a.displayName, checkedIn: a.status === "checked_in" }))}
      />
    </>
  );
}

export default function BracketPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Bracket params={params} />
    </Suspense>
  );
}
