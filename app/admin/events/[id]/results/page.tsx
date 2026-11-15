import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@components/ui/page-header";
import { EventTabs } from "@components/admin/event-tabs";
import { ResultsEditor } from "@components/admin/results-editor";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES } from "@interfaces/roles";
import { getEventForEdit, listAttendees } from "@lib/data/hub";
import { prisma } from "@lib/prisma";
import { uuid } from "@lib/contracts/common";
import { Skeleton } from "@components/ui/skeleton";

type Params = Promise<{ id: string }>;

async function Results({ params }: { params: Params }) {
  const { id } = await params;
  await requirePageRole(CONTENT_ROLES, `/admin/events/${id}/results`);
  if (!uuid.safeParse(id).success) notFound();
  const [event, attendees, existing] = await Promise.all([
    getEventForEdit(id),
    listAttendees(id),
    prisma.tournamentResult.findMany({ where: { event_id: id }, orderBy: { placement: "asc" } }),
  ]);
  if (!event) notFound();
  return (
    <>
      <PageHeader title={event.title} description="Final standings. Saving marks the event completed and updates the leaderboard." />
      <EventTabs id={id} active="results" />
      <ResultsEditor
        eventId={id}
        checkedIn={attendees.filter((a) => a.status === "checked_in").map((a) => ({ userId: a.userId, displayName: a.displayName }))}
        existing={existing.map((r) => ({ placement: r.placement, playerName: r.player_name, userId: r.user_id, wins: r.wins, losses: r.losses, draws: r.draws, points: r.points, deck: r.deck }))}
      />
    </>
  );
}

export default function ResultsPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Results params={params} />
    </Suspense>
  );
}
