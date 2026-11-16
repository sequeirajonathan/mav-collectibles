"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { saveResults } from "@lib/actions/hub";

interface Row {
  key: string;
  placement: string;
  playerName: string;
  userId: string;
  wins: string;
  losses: string;
  draws: string;
  points: string;
  deck: string;
}

const blank = (placement: number, name = "", userId = ""): Row => ({
  key: crypto.randomUUID(),
  placement: String(placement),
  playerName: name,
  userId,
  wins: "0",
  losses: "0",
  draws: "0",
  points: "0",
  deck: "",
});

/** Default season points by placement (editable per row). */
const POINTS_BY_PLACE = [10, 8, 6, 6, 4, 4, 4, 4];

export function ResultsEditor({
  eventId,
  existing,
  checkedIn,
  bracketStandings = [],
}: {
  eventId: string;
  existing: { placement: number; playerName: string; userId: string | null; wins: number; losses: number; draws: number; points: number; deck: string | null }[];
  checkedIn: { userId: string; displayName: string }[];
  /** Finishing order from the event's bracket, once it has a champion. */
  bracketStandings?: { place: number; name: string; userId: string | null }[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() =>
    existing.length
      ? existing.map((r) => ({ key: crypto.randomUUID(), placement: String(r.placement), playerName: r.playerName, userId: r.userId ?? "", wins: String(r.wins), losses: String(r.losses), draws: String(r.draws), points: String(r.points), deck: r.deck ?? "" }))
      : [blank(1)]
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const update = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const prefill = () =>
    setRows(checkedIn.map((p, i) => ({ ...blank(i + 1, p.displayName, p.userId), points: String(POINTS_BY_PLACE[i] ?? 2) })));

  const prefillFromBracket = () =>
    setRows(bracketStandings.map((p) => ({ ...blank(p.place, p.name, p.userId ?? ""), points: String(POINTS_BY_PLACE[p.place - 1] ?? 2) })));

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveResults({
        eventId,
        rows: rows.filter((r) => r.playerName.trim()).map((r) => ({ ...r, userId: r.userId || null, deck: r.deck || null })),
      });
      if (!result.ok) {
        setError(Object.values(result.fieldErrors ?? {})[0] ?? result.error);
        return;
      }
      toast.success(`Saved ${result.data.saved} results. Event marked completed.`);
      router.refresh();
    });
  };

  const cell = "w-full min-w-0 rounded-md border border-line bg-panel-2 px-2 py-2 text-base tabular-nums focus:border-gold";
  return (
    <div className="space-y-4">
      {bracketStandings.length > 0 && (
        <Button type="button" variant="outline" size="sm" className="mr-2" onClick={prefillFromBracket}>
          Fill from the bracket
        </Button>
      )}
      {checkedIn.length > 0 && (
        <Button type="button" variant="outline" size="sm" onClick={prefill}>
          Fill from {checkedIn.length} checked-in players
        </Button>
      )}
      <div className="space-y-2">
        <div className="hidden grid-cols-[3.5rem_1fr_3.5rem_3.5rem_3.5rem_4rem_1fr_2.75rem] gap-2 px-1 text-xs font-semibold uppercase text-muted-foreground lg:grid">
          <span>Place</span><span>Player</span><span>W</span><span>L</span><span>D</span><span>Pts</span><span>Deck</span><span />
        </div>
        {rows.map((r) => (
          <div key={r.key} className="grid grid-cols-[3.5rem_1fr_2.75rem] gap-2 rounded-lg border border-line p-2 lg:grid-cols-[3.5rem_1fr_3.5rem_3.5rem_3.5rem_4rem_1fr_2.75rem] lg:border-0 lg:p-0">
            <input aria-label="Placement" className={cell} inputMode="numeric" value={r.placement} onChange={(e) => update(r.key, { placement: e.target.value })} />
            <input aria-label="Player name" className={cell} value={r.playerName} onChange={(e) => update(r.key, { playerName: e.target.value, userId: "" })} placeholder="Player" />
            <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:text-danger lg:order-last" aria-label="Remove row">
              <Trash2 className="size-4" />
            </button>
            <div className="col-span-3 grid grid-cols-4 gap-2 lg:contents">
              <input aria-label="Wins" className={cell} inputMode="numeric" value={r.wins} onChange={(e) => update(r.key, { wins: e.target.value })} />
              <input aria-label="Losses" className={cell} inputMode="numeric" value={r.losses} onChange={(e) => update(r.key, { losses: e.target.value })} />
              <input aria-label="Draws" className={cell} inputMode="numeric" value={r.draws} onChange={(e) => update(r.key, { draws: e.target.value })} />
              <input aria-label="Season points" className={cell} inputMode="numeric" value={r.points} onChange={(e) => update(r.key, { points: e.target.value })} />
            </div>
            <input aria-label="Deck" className={`${cell} col-span-3 lg:col-span-1`} value={r.deck} onChange={(e) => update(r.key, { deck: e.target.value })} placeholder="Deck (optional)" />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => setRows((rs) => [...rs, blank(rs.length + 1)])}>
          <Plus /> Add player
        </Button>
        <Button type="button" variant="gold" onClick={save} disabled={pending}>Save results</Button>
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
