"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, Plus, Shuffle, X } from "lucide-react";
import { Button } from "@components/ui/button";
import { cardVariants } from "@components/ui/card";
import { ConfirmButton } from "@components/admin/confirm-button";
import { inputClass } from "@components/ui/field";
import { BracketView } from "@components/hub/bracket-view";
import { clearBracketResult, deleteBracket, reportBracketResult, saveBracket } from "@lib/actions/hub";
import { MAX_ENTRANTS, bracketSize, suggestedTopCut, type Bracket, type BracketFormat, type Entrant } from "@lib/bracket";
import { cn } from "@utils";

interface Candidate {
  userId: string;
  name: string;
  checkedIn: boolean;
}

const fromCandidate = (c: Candidate): Entrant => ({ id: `u-${c.userId}`, name: c.name, userId: c.userId });

function SeedRow({ entrant, index, count, cut, onMove, onRemove }: { entrant: Entrant; index: number; count: number; cut: number; onMove: (by: -1 | 1) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entrant.id });
  const out = index >= cut;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-1 rounded-lg border bg-panel p-1", isDragging ? "relative z-10 border-gold shadow-lg" : "border-line", out && "opacity-50")}
    >
      {/* The handle is the only part that drags, so the page still scrolls under a finger. */}
      <button type="button" className="inline-flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-panel-2 active:cursor-grabbing" aria-label={`Drag ${entrant.name} to reorder`} {...attributes} {...listeners}>
        <GripVertical className="size-5" />
      </button>
      <span className="w-7 shrink-0 text-center text-sm font-bold tabular-nums text-muted-foreground">{index + 1}</span>
      <span className="min-w-0 flex-1 truncate font-semibold">{entrant.name}</span>
      {out && <span className="shrink-0 text-xs text-muted-foreground">Misses the cut</span>}
      <Button type="button" variant="ghost" size="icon" aria-label={`Move ${entrant.name} up`} disabled={index === 0} onClick={() => onMove(-1)}>
        <ArrowUp />
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label={`Move ${entrant.name} down`} disabled={index === count - 1} onClick={() => onMove(1)}>
        <ArrowDown />
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${entrant.name}`} onClick={onRemove}>
        <X />
      </Button>
    </li>
  );
}

function Setup({ eventId, candidates, initial, onCancel }: { eventId: string; candidates: Candidate[]; initial: Bracket | null; onCancel?: () => void }) {
  const router = useRouter();
  const checkedIn = candidates.filter((c) => c.checkedIn);
  const [entrants, setEntrants] = useState<Entrant[]>(() => initial?.entrants ?? (checkedIn.length >= 2 ? checkedIn : candidates).map(fromCandidate));
  const [format, setFormat] = useState<BracketFormat>(initial?.format ?? "single");
  const [bestOf, setBestOf] = useState<1 | 3>(initial?.bestOf ?? 1);
  const [cut, setCut] = useState(0);
  const [walkIn, setWalkIn] = useState("");
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const playing = cut > 0 ? entrants.slice(0, cut) : entrants;
  const suggestion = suggestedTopCut(entrants.length);
  const cutChoices = [4, 8, 16, 32].filter((n) => n < entrants.length);
  const byes = bracketSize(playing.length) - playing.length;
  const missing = candidates.filter((c) => !entrants.some((e) => e.userId === c.userId));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setEntrants((list) => arrayMove(list, list.findIndex((e) => e.id === active.id), list.findIndex((e) => e.id === over.id)));
  };
  const move = (index: number, by: -1 | 1) => setEntrants((list) => arrayMove(list, index, index + by));
  const shuffle = () =>
    setEntrants((list) => {
      const next = [...list];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const a = next[i];
        const b = next[j];
        if (a && b) [next[i], next[j]] = [b, a];
      }
      return next;
    });
  const addWalkIn = () => {
    const name = walkIn.trim();
    if (!name) return;
    setEntrants((list) => [...list, { id: `w-${Math.random().toString(36).slice(2, 10)}`, name, userId: null }]);
    setWalkIn("");
  };

  const create = () =>
    startTransition(async () => {
      const result = await saveBracket({ eventId, format, bestOf, entrants: playing });
      if (!result.ok) return void toast.error(result.error);
      toast.success("Bracket created");
      onCancel?.();
      router.refresh();
    });

  const tooFew = playing.length < (format === "double" ? 3 : 2);
  const option = "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-line p-3 has-[:checked]:border-gold";
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-start">
      <section aria-labelledby="seeds-heading">
        <h2 id="seeds-heading" className="text-base font-bold">
          Players in seed order ({entrants.length})
        </h2>
        <p className="text-xs text-muted-foreground">
          Drag by the handle, or use the arrows. Seed 1 plays the lowest seed. After Swiss rounds, put players in standings order so 1st plays 8th, 2nd plays 7th, and so on.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={shuffle} disabled={entrants.length < 2}>
            <Shuffle aria-hidden /> Shuffle
          </Button>
          {missing.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={() => setEntrants((list) => [...list, ...missing.map(fromCandidate)].slice(0, MAX_ENTRANTS))}>
              <Plus aria-hidden /> Add {missing.length} more registered
            </Button>
          )}
        </div>
        {entrants.length === 0 ? (
          <p className={cn(cardVariants({ variant: "dashed", radius: "lg" }), "mt-3 px-4 py-8 text-center text-sm text-muted-foreground")}>
            Nobody yet. Check players in on the Check-in tab, or add names below.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={entrants.map((e) => e.id)} strategy={verticalListSortingStrategy}>
              <ol aria-label="Seed order" className="mt-3 space-y-1.5">
                {entrants.map((e, i) => (
                  <SeedRow key={e.id} entrant={e} index={i} count={entrants.length} cut={cut > 0 ? cut : entrants.length} onMove={(by) => move(i, by)} onRemove={() => setEntrants((list) => list.filter((x) => x.id !== e.id))} />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addWalkIn();
          }}
        >
          <label htmlFor="walk-in" className="sr-only">
            Add a player by name
          </label>
          <input id="walk-in" className={inputClass} maxLength={80} placeholder="Add a player by name" value={walkIn} onChange={(e) => setWalkIn(e.target.value)} />
          <Button type="submit" variant="outline" disabled={!walkIn.trim() || entrants.length >= MAX_ENTRANTS}>
            Add
          </Button>
        </form>
      </section>

      <section className={cn(cardVariants({ padding: "md" }), "space-y-5")} aria-label="Bracket options">
        <fieldset>
          <legend className="text-sm font-semibold">Format</legend>
          <div className="mt-2 space-y-2">
            <label className={option}>
              <input type="radio" name="format" className="mt-1 accent-[var(--gold)]" checked={format === "single"} onChange={() => setFormat("single")} />
              <span>
                <span className="block font-semibold">Single elimination</span>
                <span className="text-sm text-muted-foreground">Lose once and you&apos;re out. The standard top cut for Pokémon, One Piece and Lorcana.</span>
              </span>
            </label>
            <label className={option}>
              <input type="radio" name="format" className="mt-1 accent-[var(--gold)]" checked={format === "double"} onChange={() => setFormat("double")} />
              <span>
                <span className="block font-semibold">Double elimination</span>
                <span className="text-sm text-muted-foreground">Adds a losers bracket: you&apos;re out after two losses. Good for casual nights; takes about twice as many matches.</span>
              </span>
            </label>
          </div>
        </fieldset>

        {cutChoices.length > 0 && (
          <div>
            <label htmlFor="cut" className="text-sm font-semibold">
              Who plays
            </label>
            <p className="text-xs text-muted-foreground">
              {suggestion ? `With ${entrants.length} players, stores usually cut to the top ${suggestion} after Swiss rounds.` : "With 8 or fewer players, stores usually skip the cut."}
            </p>
            <select id="cut" className={cn(inputClass, "mt-1.5")} value={cut} onChange={(e) => setCut(Number(e.target.value))}>
              <option value={0}>Everyone ({entrants.length})</option>
              {cutChoices.map((n) => (
                <option key={n} value={n}>
                  Top {n} only
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="best-of" className="text-sm font-semibold">
            Each match is
          </label>
          <select id="best-of" className={cn(inputClass, "mt-1.5")} value={bestOf} onChange={(e) => setBestOf(e.target.value === "3" ? 3 : 1)}>
            <option value={1}>Best of 1</option>
            <option value={3}>Best of 3</option>
          </select>
        </div>

        <p className="text-sm text-muted-foreground">
          {tooFew
            ? format === "double"
              ? "Double elimination needs at least 3 players."
              : "Add at least 2 players."
            : `${playing.length} players${byes > 0 ? `; the top ${byes === 1 ? "seed gets" : `${byes} seeds get`} a bye in round one` : ""}.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="gold" disabled={pending || tooFew} onClick={create}>
            {initial ? "Start over with these players" : "Create bracket"}
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
              Keep the current bracket
            </Button>
          )}
        </div>
        {initial && <p className="text-xs text-muted-foreground">Starting over clears every recorded winner.</p>}
      </section>
    </div>
  );
}

/** Staff set up an event's bracket, then record winners match by match. */
export function BracketManager({ eventId, candidates, bracket }: { eventId: string; candidates: Candidate[]; bracket: Bracket | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, startTransition] = useTransition();

  if (!bracket || editing) {
    return <Setup eventId={eventId} candidates={candidates} initial={bracket} onCancel={bracket ? () => setEditing(false) : undefined} />;
  }

  const act = (run: () => Promise<{ ok: true } | { ok: false; error: string }>) =>
    startTransition(async () => {
      const result = await run();
      if (!result.ok) toast.error(result.error);
      router.refresh();
    });

  return (
    <div className="space-y-6">
      <BracketView
        bracket={bracket}
        controls={{
          busy,
          onReport: (matchId, winnerId) => act(() => reportBracketResult({ eventId, matchId, winnerId })),
          onClear: (matchId) => act(() => clearBracketResult({ eventId, matchId })),
        }}
      />
      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
          Change players or format
        </Button>
        <ConfirmButton
          label="Delete bracket"
          confirmLabel="Delete it"
          disabled={busy}
          onConfirm={() =>
            act(async () => {
              const result = await deleteBracket({ eventId });
              if (result.ok) toast.success("Bracket deleted");
              return result;
            })
          }
        />
      </div>
      <p className="text-xs text-muted-foreground">Players see this bracket on the event page. When it&apos;s finished, use the Results tab to fill in the standings from it.</p>
    </div>
  );
}
