import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { MapPin, Ticket, Users } from "lucide-react";
import { getEvent, getMyRegistration } from "@lib/data/hub";
import { getCurrentUser } from "@lib/auth/server";
import { googleCalendarUrl, outlookCalendarUrl, type CalendarEvent } from "@lib/calendar";
import { capacityLabel, formatEntryFee, formatEventWhen } from "@lib/format";
import { isFull, registrationClosedReason, requestTime } from "@lib/hub-rules";
import { GameBadge, KindBadge } from "@components/hub/badges";
import { RsvpButton } from "@components/hub/rsvp-button";
import { AddToCalendar } from "@components/hub/add-to-calendar";
import { ShareButton } from "@components/hub/share-button";
import { DiscordLink } from "@components/hub/discord";
import { publicEnv } from "@lib/env";
import { cardVariants } from "@components/ui/card";
import { cn } from "@utils";
import { Skeleton } from "@components/ui/skeleton";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const event = await getEvent((await params).slug);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.summary || `${event.title} at MAV Collectibles, ${formatEventWhen(event.startsAt)}`,
    openGraph: event.coverImageUrl ? { images: [event.coverImageUrl] } : undefined,
  };
}

type Event = NonNullable<Awaited<ReturnType<typeof getEvent>>>;

async function Rsvp({ event }: { event: Event }) {
  const user = await getCurrentUser();
  await connection();
  const closedReason = registrationClosedReason(event, requestTime());
  const status = user ? await getMyRegistration(event.id, user.id) : null;
  return (
    <RsvpButton
      eventId={event.id}
      slug={event.slug}
      status={status}
      signedIn={user !== null}
      closedReason={closedReason}
      full={isFull(event)}
    />
  );
}

async function EventContent({ params }: { params: Params }) {
  const event = await getEvent((await params).slug);
  if (!event) notFound();

  const site = publicEnv().NEXT_PUBLIC_SITE_URL ?? "https://mavcollectibles.com";
  const calendarEvent: CalendarEvent = {
    uid: event.id,
    title: event.title,
    description: event.summary,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    location: event.location === "MAV Collectibles" ? undefined : event.location,
    url: `${site}/events/${event.slug}`,
  };

  return (
    <article className="mx-auto max-w-3xl">
      {event.coverImageUrl && (
        <div className="relative -mx-4 mb-5 aspect-[16/9] overflow-hidden fold:mx-0 fold:rounded-xl">
          <Image src={event.coverImageUrl} alt="" fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {event.game && <GameBadge game={event.game} />}
        <KindBadge kind={event.kind} />
        {event.format && <span className="text-xs text-muted-foreground">{event.format}</span>}
      </div>
      <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight fold:text-4xl">{event.title}</h1>
      {event.status === "cancelled" && (
        <p role="status" className="mt-3 rounded-lg border border-danger/50 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          This event has been cancelled.
        </p>
      )}

      <dl className={cn(cardVariants({ padding: "md" }), "mt-4 grid gap-3 text-sm fold:grid-cols-2")}>
        <div className="fold:col-span-2">
          <dt className="sr-only">When</dt>
          <dd className="font-semibold text-foreground">{formatEventWhen(event.startsAt, event.endsAt)}</dd>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
          <dt className="sr-only">Where</dt>
          <dd>{event.location}</dd>
        </div>
        <div className="flex items-start gap-2">
          <Ticket className="mt-0.5 size-4 shrink-0 text-gold" />
          <dt className="sr-only">Entry</dt>
          <dd>{formatEntryFee(event.entryFeeCents)}</dd>
        </div>
        <div className="flex items-start gap-2 fold:col-span-2">
          <Users className="mt-0.5 size-4 shrink-0 text-gold" />
          <dt className="sr-only">Spots</dt>
          <dd>{capacityLabel(event.capacity, event.registeredCount, event.waitlistCount)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-col gap-2 fold:flex-row fold:flex-wrap fold:items-center">
        <Suspense fallback={<Skeleton className="h-11 w-full rounded-md bg-panel-2 fold:w-28" />}>
          <Rsvp event={event} />
        </Suspense>
        <AddToCalendar
          googleUrl={googleCalendarUrl(calendarEvent)}
          outlookUrl={outlookCalendarUrl(calendarEvent)}
          icsUrl={`/events/${event.slug}/calendar.ics`}
        />
        <ShareButton title={event.title} path={`/events/${event.slug}`} className="self-start fold:self-auto" />
        <Suspense fallback={null}>
          <DiscordLink className="self-start fold:self-auto" />
        </Suspense>
      </div>

      {(event.summary || event.description) && (
        <div className="mt-8 space-y-3 text-foreground/90">
          {event.summary && <p className="text-lg text-foreground">{event.summary}</p>}
          {event.description && <p className="whitespace-pre-line leading-relaxed">{event.description}</p>}
        </div>
      )}

      {event.vendors.length > 0 && (
        <section className="mt-10" aria-labelledby="vendors-heading">
          <h2 id="vendors-heading" className="text-lg font-bold">Vendors at this event</h2>
          <ul className="mt-3 grid gap-2 fold:grid-cols-2">
            {event.vendors.map((v) => (
              <li key={v.slug}>
                <Link href={`/vendors/${v.slug}`} className={cn(cardVariants({ variant: "interactive", padding: "sm", radius: "lg" }), "flex items-center gap-3")}>
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-panel-2">
                    {v.logoUrl && <Image src={v.logoUrl} alt="" fill sizes="40px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{v.name}</span>
                  {v.tableLabel && <span className="text-xs text-muted-foreground">Table {v.tableLabel}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {event.results.length > 0 && (
        <section className="mt-10" aria-labelledby="results-heading">
          <h2 id="results-heading" className="text-lg font-bold">Results</h2>
          <ol className={cn(cardVariants({ variant: "list" }), "mt-3")}>
            {event.results.map((r) => (
              <li key={r.placement + r.playerName} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="w-8 shrink-0 text-center text-base font-extrabold text-gold">{r.placement}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.playerName}</span>
                  {r.deck && <span className="block truncate text-xs text-muted-foreground">{r.deck}</span>}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {r.wins}-{r.losses}
                  {r.draws ? `-${r.draws}` : ""}
                </span>
                <span className="w-12 shrink-0 text-right font-semibold tabular-nums">{r.points} pts</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}

function EventSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Skeleton className="aspect-[16/9]" />
      <Skeleton className="h-4 w-40 rounded bg-panel-2" />
      <Skeleton className="h-8 w-3/4 rounded bg-panel-2" />
      <Skeleton className="h-28" />
    </div>
  );
}

export default function EventPage({ params }: { params: Params }) {
  return (
    <>
      <nav className="mb-4 text-sm">
        <Link href="/events" className="text-muted-foreground hover:text-gold">← All events</Link>
      </nav>
      <Suspense fallback={<EventSkeleton />}>
        <EventContent params={params} />
      </Suspense>
    </>
  );
}
