import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarDays } from "lucide-react";
import { PageHeader, EmptyState } from "@components/hub/page-header";
import { EventCard, EventListSkeleton } from "@components/hub/event-card";
import { listEvents, listGames } from "@lib/data/hub";
import { EVENT_KINDS, EVENT_KIND_LABELS, eventKindSchema } from "@lib/contracts/hub";
import { groupByDay } from "@lib/format";
import { cn } from "@utils";

export const metadata: Metadata = {
  title: "Events & tournaments",
  description: "Pokémon league nights, tournaments, prereleases, trade nights and vendor days at MAV Collectibles.",
};

type SearchParams = Promise<{ game?: string; kind?: string }>;

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 text-sm font-medium transition-colors",
        active ? "border-gold bg-gold text-ink" : "border-line bg-panel text-muted-foreground hover:border-gold/50 hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

async function Filters({ searchParams }: { searchParams: SearchParams }) {
  const [{ game, kind }, games] = await Promise.all([searchParams, listGames()]);
  const href = (next: { game?: string; kind?: string }) => {
    const params = new URLSearchParams();
    const g = "game" in next ? next.game : game;
    const k = "kind" in next ? next.kind : kind;
    if (g) params.set("game", g);
    if (k) params.set("kind", k);
    const qs = params.toString();
    return qs ? `/events?${qs}` : "/events";
  };
  return (
    <div className="mb-6 space-y-2">
      <nav aria-label="Filter by game" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none scroll-fade fold:mx-0 fold:flex-wrap fold:px-0">
        <Chip href={href({ game: undefined })} active={!game}>All games</Chip>
        {games.map((g) => (
          <Chip key={g.id} href={href({ game: g.id })} active={game === g.id}>
            {g.shortName}
          </Chip>
        ))}
      </nav>
      <nav aria-label="Filter by event type" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none scroll-fade fold:mx-0 fold:flex-wrap fold:px-0">
        <Chip href={href({ kind: undefined })} active={!kind}>Everything</Chip>
        {EVENT_KINDS.map((k) => (
          <Chip key={k} href={href({ kind: k })} active={kind === k}>
            {EVENT_KIND_LABELS[k]}
          </Chip>
        ))}
      </nav>
    </div>
  );
}

async function EventList({ searchParams }: { searchParams: SearchParams }) {
  const { game, kind } = await searchParams;
  const parsedKind = eventKindSchema.safeParse(kind);
  const events = await listEvents({ gameId: game || undefined, kind: parsedKind.success ? parsedKind.data : undefined, limit: 60 });
  if (events.length === 0) {
    return (
      <EmptyState
        title="Nothing scheduled here yet"
        description="Check back soon, or follow the feed for announcements."
        action={<Link href="/feed" className="font-semibold text-gold">Go to the feed →</Link>}
      />
    );
  }
  return (
    <div className="space-y-8">
      {groupByDay(events, (e) => e.startsAt).map((day, i) => (
        <section key={day.key} aria-label={day.label}>
          <h2 className="sticky top-[var(--header-h,4rem)] z-10 -mx-4 mb-3 bg-background/90 px-4 py-2 text-sm font-semibold text-gold backdrop-blur fold:mx-0 fold:px-0">
            {day.label}
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {day.items.map((e) => (
              <EventCard key={e.id} event={e} priority={i === 0} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        eyebrow="Play at MAV"
        title="Events & tournaments"
        description="League nights, tournaments, prereleases, trade nights and vendor days. RSVP to save your seat."
        actions={
          <a
            href="/events/calendar.ics"
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-foreground hover:border-gold/60"
          >
            <CalendarDays className="size-4 text-gold" />
            Subscribe to calendar
          </a>
        }
      />
      <Suspense fallback={<div className="mb-6 h-20" />}>
        <Filters searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<EventListSkeleton count={4} />}>
        <EventList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
