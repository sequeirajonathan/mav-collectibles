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
      style={{ borderColor: `${game.color}66`, color: game.color, backgroundColor: `${game.color}14` }}
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
  "border-zinc-300/40 bg-zinc-300/10 text-zinc-200",
  "border-amber-700/50 bg-amber-700/15 text-amber-500",
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
