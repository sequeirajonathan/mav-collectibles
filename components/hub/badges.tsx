import { Trophy } from "lucide-react";
import type { Game, EventKind, EventStatus } from "@lib/contracts/hub";
import { EVENT_KIND_LABELS } from "@lib/contracts/hub";
import { Badge } from "@components/ui/badge";
import { cn } from "@utils";

/** Game pill tinted with the game's own brand colour. */
export function GameBadge({ game, className }: { game: Game; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={className}
      // The game's colour tints the pill and its dot; the label stays in the
      // theme's text colour so yellow or pale brands remain readable on white.
      style={{ borderColor: `${game.color}80`, backgroundColor: `${game.color}1f` }}
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: game.color }} />
      {game.shortName}
    </Badge>
  );
}

export function KindBadge({ kind }: { kind: EventKind }) {
  return <Badge>{EVENT_KIND_LABELS[kind]}</Badge>;
}

const STATUS_VARIANT = {
  draft: "outline",
  published: "success",
  cancelled: "danger",
  completed: "outline",
} as const satisfies Record<EventStatus, "outline" | "success" | "danger">;

export function StatusPill({ status }: { status: EventStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className="capitalize">
      {status}
    </Badge>
  );
}

const PODIUM = [
  "border-gold/60 bg-gold/15 text-gold",
  "border-silver/40 bg-silver/10 text-silver",
  "border-bronze/50 bg-bronze/15 text-bronze",
];

/** Leaderboard rank: gold/silver/bronze discs for the podium, a plain number after that. */
export function RankMark({ rank, className }: { rank: number; className?: string }) {
  const podium = PODIUM[rank - 1];
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold tabular-nums",
        podium ? cn("border", podium) : "text-muted-foreground",
        className
      )}
    >
      {rank === 1 ? <Trophy className="size-4" aria-label="1st" /> : rank}
    </span>
  );
}
