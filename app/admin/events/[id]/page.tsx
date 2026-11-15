import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@components/ui/page-header";
import { EventForm } from "@components/admin/event-form";
import { eventFormDefaults } from "@components/admin/event-form-values";
import { EventTabs } from "@components/admin/event-tabs";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES } from "@interfaces/roles";
import { SignupLink } from "@components/admin/signup-link";
import { getEventForEdit, listGames } from "@lib/data/hub";
import { uuid } from "@lib/contracts/common";
import { Skeleton } from "@components/ui/skeleton";

type Params = Promise<{ id: string }>;

async function Edit({ params }: { params: Params }) {
  const { id } = await params;
  await requirePageRole(CONTENT_ROLES, `/admin/events/${id}`);
  if (!uuid.safeParse(id).success) notFound();
  const [event, games] = await Promise.all([getEventForEdit(id), listGames()]);
  if (!event) notFound();
  return (
    <>
      <PageHeader title={event.title} actions={
          event.status !== "draft" && (
            <>
              <SignupLink slug={event.slug} />
              <Link href={`/events/${event.slug}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-gold can-hover:min-h-9">View public page →</Link>
            </>
          )
        } />
      <EventTabs id={id} active="details" />
      <EventForm games={games} eventId={id} initial={eventFormDefaults(event)} />
    </>
  );
}

export default function EditEventPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Edit params={params} />
    </Suspense>
  );
}
