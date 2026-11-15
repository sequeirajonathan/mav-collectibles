import { Suspense } from "react";
import { PageHeader } from "@components/ui/page-header";
import { EventForm } from "@components/admin/event-form";
import { eventFormDefaults } from "@components/admin/event-form-values";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES } from "@interfaces/roles";
import { listGames } from "@lib/data/hub";
import { Skeleton } from "@components/ui/skeleton";

async function Form() {
  await requirePageRole(CONTENT_ROLES, "/admin/events/new");
  return <EventForm games={await listGames()} initial={eventFormDefaults()} />;
}

export default function NewEventPage() {
  return (
    <>
      <PageHeader title="New event" />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Form />
      </Suspense>
    </>
  );
}
