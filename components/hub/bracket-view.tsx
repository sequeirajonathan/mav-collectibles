"use client";

import { Trophy, Undo2 } from "lucide-react";
import { viewBracket, type Bracket, type MatchView, type RoundView } from "@lib/bracket";
import { cn } from "@utils";

interface Controls {
  /** Staff tap a player to mark them the winner. */
  onReport: (matchId: string, winnerId: string) => void;
  onClear: (matchId: string) => void;
  busy: boolean;
}

function ordinal(place: number): string {
  const tens = place % 100;
  if (tens >= 11 && tens <= 13) return `${place}th`;
  return `${place}${["th", "st", "nd", "rd"][place % 10] ?? "th"}`;
}

function PlayerRow({ match, side, bracket, controls }: { match: MatchView; side: "a" | "b"; bracket: Bracket; controls?: Controls }) {
  const slot = match[side];
  const index = slot.kind === "entrant" ? bracket.entrants.findIndex((e) => e.id === slot.id) : -1;
  const entrant = index >= 0 ? bracket.entrants[index] : undefined;
  const won = entrant !== undefined && match.winner === entrant.id;
  const lost = entrant !== undefined && match.winner !== null && !won;
  const source = match.sources[side];
  const waiting = slot.kind === "bye" ? "Bye" : source.from === "loser" ? `Loser of ${source.match}` : source.from === "winner" ? `Winner of ${source.match}` : "To be decided";

  const content = (
    <>
      <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{entrant ? index + 1 : ""}</span>
      <span className={cn("min-w-0 flex-1 truncate text-left", entrant ? "font-semibold" : "text-sm italic text-muted-foreground", lost && "font-normal text-muted-foreground line-through")}>
        {entrant ? entrant.name : waiting}
      </span>
      {won && <Trophy aria-label="Winner" className="size-4 shrink-0 text-gold" />}
    </>
  );
  const rowClass = cn("flex min-h-11 w-full items-center gap-2 px-2.5", won && "bg-gold/10");

  if (controls && entrant && match.playable) {
    return (
      <button type="button" disabled={controls.busy} onClick={() => controls.onReport(match.id, entrant.id)} className={cn(rowClass, "hover:bg-panel-2 disabled:opacity-60")} aria-label={`${entrant.name} won match ${match.id}`}>
        {content}
      </button>
    );
  }
  return <div className={rowClass}>{content}</div>;
}

function MatchCard({ match, bracket, controls }: { match: MatchView; bracket: Bracket; controls?: Controls }) {
  const decided = match.winner !== null && !match.bye;
  return (
    <li className={cn("ui-card-flat overflow-hidden rounded-lg border bg-panel", match.playable ? "border-gold" : "border-line", match.bye && "opacity-70")} aria-label={`Match ${match.id}`}>
      <div className="flex items-center justify-between gap-2 border-b border-line bg-panel-2/60 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>{match.id}</span>
        {match.playable && <span className="text-gold">{controls ? "Tap the winner" : "Up next"}</span>}
        {controls && decided && (
          <button type="button" disabled={controls.busy} onClick={() => controls.onClear(match.id)} className="-my-1 inline-flex min-h-9 items-center gap-1 normal-case tracking-normal hover:text-foreground" aria-label={`Undo result of match ${match.id}`}>
            <Undo2 className="size-3.5" /> Undo
          </button>
        )}
      </div>
      <PlayerRow match={match} side="a" bracket={bracket} controls={controls} />
      <div className="border-t border-line" />
      <PlayerRow match={match} side="b" bracket={bracket} controls={controls} />
    </li>
  );
}

function Rounds({ title, rounds, bracket, controls }: { title?: string; rounds: RoundView[]; bracket: Bracket; controls?: Controls }) {
  if (rounds.length === 0) return null;
  return (
    <section aria-label={title ?? "Bracket"}>
      {title && <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>}
      {/* Rounds sit side by side and scroll sideways on a phone. */}
      <div className="-mx-4 overflow-x-auto px-4 pb-2 fold:mx-0 fold:px-0">
        <ol className="flex gap-4">
          {rounds.map((round) => (
            <li key={`${round.side}-${round.round}`} className="flex w-60 shrink-0 flex-col">
              <h4 className="mb-2 text-sm font-semibold">{round.title}</h4>
              <ul className="flex flex-1 flex-col justify-around gap-3">
                {round.matches.map((match) => (
                  <MatchCard key={match.id} match={match} bracket={bracket} controls={controls} />
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** The bracket as rounds of matches. With `controls`, staff can record winners. */
export function BracketView({ bracket, controls }: { bracket: Bracket; controls?: Controls }) {
  const view = viewBracket(bracket);
  const champion = bracket.entrants.find((e) => e.id === view.champion);
  const winners = view.rounds.filter((r) => r.side === "winners");
  const losers = view.rounds.filter((r) => r.side === "losers");
  const finals = view.rounds.filter((r) => r.side === "final");
  const double = bracket.format === "double";
  const names = new Map(bracket.entrants.map((e) => [e.id, e.name]));

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {double ? "Double elimination" : "Single elimination"} · {bracket.entrants.length} players · best of {bracket.bestOf}
        {view.remaining > 0 ? ` · ${view.remaining} ${view.remaining === 1 ? "match" : "matches"} to play` : ""}
      </p>
      {champion && (
        <p role="status" className="ui-card flex items-center gap-3 rounded-xl border border-gold bg-gold/10 p-4">
          <Trophy aria-hidden className="size-7 shrink-0 text-gold" />
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Champion</span>
            <span className="text-xl font-extrabold">{champion.name}</span>
          </span>
        </p>
      )}
      <Rounds title={double ? "Winners bracket" : undefined} rounds={winners} bracket={bracket} controls={controls} />
      <Rounds title="Losers bracket" rounds={losers} bracket={bracket} controls={controls} />
      <Rounds title="Finals" rounds={finals} bracket={bracket} controls={controls} />
      {view.placements.length > 1 && (
        <section aria-label="Standings">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Standings so far</h3>
          <ol className="grid gap-x-6 gap-y-1 text-sm fold:grid-cols-2">
            {view.placements.map((p) => (
              <li key={p.entrantId} className="flex gap-2">
                <span className="w-10 shrink-0 font-semibold tabular-nums text-muted-foreground">{ordinal(p.place)}</span>
                <span className="min-w-0 truncate">{names.get(p.entrantId)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
