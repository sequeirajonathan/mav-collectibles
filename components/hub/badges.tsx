import type { Game, EventKind, EventStatus } from "@lib/contracts/hub";
import { EVENT_KIND_LABELS } from "@lib/contracts/hub";
import { cn } from "@utils";

export function GameBadge({ game, className }: { game: Game; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold", className)}
      style={{ borderColor: `${game.color}66`, color: game.color, backgroundColor: `${game.color}14` }}
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: game.color }} />
      {game.shortName}
    </span>
  );
}

export function KindBadge({ kind }: { kind: EventKind }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-panel-2 px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {EVENT_KIND_LABELS[kind]}
    </span>
  );
}

const STATUS_STYLES: Record<EventStatus, string> = {
  draft: "border-line text-muted-foreground",
  published: "border-success/40 text-success",
  cancelled: "border-danger/50 text-danger",
  completed: "border-line text-muted-foreground",
};

export function StatusPill({ status }: { status: EventStatus }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold capitalize", STATUS_STYLES[status])}>
      {status}
    </span>
  );
}
