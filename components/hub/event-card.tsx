import Link from "next/link";
import Image from "next/image";
import type { EventSummary } from "@lib/contracts/hub";
import { capacityLabel, dateBlock, formatEntryFee, formatEventWhen } from "@lib/format";
import { Card, cardVariants } from "@components/ui/card";
import { Skeleton } from "@components/ui/skeleton";
import { GameBadge, KindBadge } from "./badges";
import { cn } from "@utils";

function DateBlock({ iso, className }: { iso: string; className?: string }) {
  const d = dateBlock(iso);
  return (
    <div
      className={cn(
        "flex w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-gold/40 bg-gradient-to-b from-panel-2 to-ink py-1.5 text-center shadow-inner",
        className
      )}
    >
      <span className="text-[0.65rem] font-bold tracking-wider text-gold">{d.month}</span>
      <span className="font-display text-2xl leading-none text-foreground">{d.day}</span>
      <span className="text-[0.65rem] text-muted-foreground">{d.weekday}</span>
    </div>
  );
}

/** Event in a list: date block, title, game/kind, time and spots left. */
export function EventCard({ event, priority = false }: { event: EventSummary; priority?: boolean }) {
  const cancelled = event.status === "cancelled";
  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(cardVariants({ variant: "interactive" }), "group relative flex gap-3 overflow-hidden p-3 pl-4 fold:gap-4 fold:p-4 fold:pl-5")}
    >
      {/* Game-colour accent along the leading edge. */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-gold/60"
        style={event.game ? { backgroundColor: event.game.color } : undefined}
      />
      {event.coverImageUrl ? (
        <div className="relative hidden aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg fold:block">
          <Image src={event.coverImageUrl} alt="" fill sizes="112px" className="object-cover" priority={priority} />
          <DateBlock iso={event.startsAt} className="absolute left-1.5 top-1.5 w-11 scale-90 py-1" />
        </div>
      ) : null}
      <DateBlock iso={event.startsAt} className={event.coverImageUrl ? "fold:hidden" : undefined} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {event.game && <GameBadge game={event.game} />}
          <KindBadge kind={event.kind} />
          {cancelled && <span className="text-xs font-bold uppercase text-danger">Cancelled</span>}
        </div>
        <h3 className={cn("mt-1.5 font-semibold leading-snug text-foreground can-hover:group-hover:text-gold-light", cancelled && "line-through opacity-70")}>
          {event.title}
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{formatEventWhen(event.startsAt, event.endsAt)}</p>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>{capacityLabel(event.capacity, event.registeredCount, event.waitlistCount)}</span>
          <span>{formatEntryFee(event.entryFeeCents)}</span>
          {event.format && <span>{event.format}</span>}
        </p>
      </div>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <Card className="flex gap-3 p-3 fold:p-4">
      <Skeleton className="h-16 w-14 rounded-lg bg-panel-2" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-3 w-24 rounded bg-panel-2" />
        <Skeleton className="h-4 w-3/4 rounded bg-panel-2" />
        <Skeleton className="h-3 w-1/2 rounded bg-panel-2" />
      </div>
    </Card>
  );
}

export function EventListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }, (_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
