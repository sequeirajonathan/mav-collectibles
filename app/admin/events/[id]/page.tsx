import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@components/hub/page-header";
import { EventForm } from "@components/admin/event-form";
import { eventFormDefaults } from "@components/admin/event-form-values";
import { EventTabs } from "@components/admin/event-tabs";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES } from "@interfaces/roles";
import { getEventForEdit, listGames } from "@lib/data/hub";
import { uuid } from "@lib/contracts/common";

type Params = Promise<{ id: string }>;

async function Edit({ params }: { params: Params }) {
  const { id } = await params;
  await requirePageRole(CONTENT_ROLES, `/admin/events/${id}`);
  if (!uuid.safeParse(id).success) notFound();
  const [event, games] = await Promise.all([getEventForEdit(id), listGames()]);
  if (!event) notFound();
  return (
    <>
      <PageHeader title={event.title} actions={event.status !== "draft" && <Link href={`/events/${event.slug}`} className="text-sm font-semibold text-gold">View public page →</Link>} />
      <EventTabs id={id} active="details" />
      <EventForm games={games} eventId={id} initial={eventFormDefaults(event)} />
    </>
  );
}

export default function EditEventPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-panel" />}>
      <Edit params={params} />
    </Suspense>
  );
}
