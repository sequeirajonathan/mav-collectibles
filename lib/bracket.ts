import { z } from "zod";

/**
 * Elimination brackets for store tournaments.
 *
 * Card games usually play Swiss rounds and then a single-elimination "top cut"
 * seeded by standing (1 v 8, 4 v 5, 2 v 7, 3 v 6). Double elimination (a losers
 * bracket and a grand final that resets if the losers-bracket player wins) is
 * offered for casual events.
 *
 * Only the entrants, in seed order, and the reported winners are stored. The
 * shape of the bracket and everything shown on screen is worked out from those,
 * so a stored bracket can never contradict itself.
 */

export const BRACKET_FORMATS = ["single", "double"] as const;
export type BracketFormat = (typeof BRACKET_FORMATS)[number];

export const MAX_ENTRANTS = 64;

const entrantSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]{1,40}$/i),
  name: z.string().trim().min(1).max(80),
  /** The player's account, when they registered through the site. */
  userId: z.uuid().nullable().default(null),
});
export type Entrant = z.infer<typeof entrantSchema>;

export const bracketSchema = z
  .object({
    format: z.enum(BRACKET_FORMATS),
    /** Games per match, shown to players. The bracket only records who won. */
    bestOf: z.union([z.literal(1), z.literal(3)]).default(1),
    /** In seed order: first is the top seed. */
    entrants: z.array(entrantSchema).min(2, "Add at least two players").max(MAX_ENTRANTS),
    /** Match id → id of the entrant who won. */
    results: z.record(z.string().max(12), z.string().max(40)).default({}),
  })
  .refine((b) => new Set(b.entrants.map((e) => e.id)).size === b.entrants.length, "A player is listed twice")
  .refine((b) => b.format === "single" || b.entrants.length >= 3, "A losers bracket needs at least three players");
export type Bracket = z.infer<typeof bracketSchema>;

type Source = { from: "seed"; seed: number } | { from: "winner"; match: string } | { from: "loser"; match: string };

interface MatchShape {
  id: string;
  side: "winners" | "losers" | "final";
  round: number;
  a: Source;
  b: Source;
}

/** Who sits in a slot: a player, nobody (a bye), or not known yet. */
type Slot = { kind: "entrant"; id: string } | { kind: "bye" } | { kind: "pending" };

export interface MatchView {
  id: string;
  side: MatchShape["side"];
  round: number;
  a: Slot;
  b: Slot;
  /** Winner's entrant id once decided (reported, or automatic through a bye). */
  winner: string | null;
  /** Both players are known and nobody has been marked the winner yet. */
  playable: boolean;
  /** Decided without being played because one side was empty. */
  bye: boolean;
  /** Where the players came from, for "Loser of …" style hints. */
  sources: { a: Source; b: Source };
}

export interface RoundView {
  side: MatchShape["side"];
  round: number;
  title: string;
  matches: MatchView[];
}

interface BracketState {
  size: number;
  rounds: RoundView[];
  champion: string | null;
  /** Finishing places for everyone already out, plus the champion. Ties share a place. */
  placements: { entrantId: string; place: number }[];
  /** Matches decided by staff, as opposed to byes. */
  played: number;
  remaining: number;
}

/** Smallest power of two that fits everyone; the gap is filled with byes for the top seeds. */
export function bracketSize(entrants: number): number {
  let size = 2;
  while (size < entrants) size *= 2;
  return size;
}

/** Standard seed positions: 1 meets the lowest seed, and 1 and 2 can only meet in the final. */
export function seedPositions(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const next = order.length * 2 + 1;
    order = order.flatMap((seed) => [seed, next - seed]);
  }
  return order;
}

function shape(format: BracketFormat, size: number): MatchShape[] {
  const matches: MatchShape[] = [];
  const rounds = Math.log2(size);
  const order = seedPositions(size);

  for (let i = 0; i < size / 2; i++) {
    matches.push({ id: `W1-${i + 1}`, side: "winners", round: 1, a: { from: "seed", seed: order[2 * i] ?? 0 }, b: { from: "seed", seed: order[2 * i + 1] ?? 0 } });
  }
  for (let r = 2; r <= rounds; r++) {
    for (let i = 0; i < size / 2 ** r; i++) {
      matches.push({ id: `W${r}-${i + 1}`, side: "winners", round: r, a: { from: "winner", match: `W${r - 1}-${2 * i + 1}` }, b: { from: "winner", match: `W${r - 1}-${2 * i + 2}` } });
    }
  }
  if (format === "single") return matches;

  // Losers bracket. Odd rounds pair survivors with each other; even rounds
  // bring in the players who just lost in the winners bracket.
  let lastLosersRound = 0;
  if (rounds >= 2) {
    for (let i = 0; i < size / 4; i++) {
      matches.push({ id: `L1-${i + 1}`, side: "losers", round: 1, a: { from: "loser", match: `W1-${2 * i + 1}` }, b: { from: "loser", match: `W1-${2 * i + 2}` } });
    }
    lastLosersRound = 1;
    for (let j = 2; j <= rounds; j++) {
      const count = size / 2 ** j;
      const dropRound = 2 * (j - 1);
      for (let i = 0; i < count; i++) {
        // Alternate the order players drop in, so early rematches are less likely.
        const from = j % 2 === 0 ? count - i : i + 1;
        matches.push({ id: `L${dropRound}-${i + 1}`, side: "losers", round: dropRound, a: { from: "winner", match: `L${dropRound - 1}-${i + 1}` }, b: { from: "loser", match: `W${j}-${from}` } });
      }
      lastLosersRound = dropRound;
      if (j < rounds) {
        for (let i = 0; i < count / 2; i++) {
          matches.push({ id: `L${dropRound + 1}-${i + 1}`, side: "losers", round: dropRound + 1, a: { from: "winner", match: `L${dropRound}-${2 * i + 1}` }, b: { from: "winner", match: `L${dropRound}-${2 * i + 2}` } });
        }
        lastLosersRound = dropRound + 1;
      }
    }
  }
  const winnersChampion: Source = { from: "winner", match: `W${rounds}-1` };
  const losersChampion: Source = lastLosersRound ? { from: "winner", match: `L${lastLosersRound}-1` } : { from: "loser", match: `W${rounds}-1` };
  matches.push({ id: "GF1", side: "final", round: 1, a: winnersChampion, b: losersChampion });
  // Played only if the losers-bracket player wins the first final: then both have one loss.
  matches.push({ id: "GF2", side: "final", round: 2, a: { from: "winner", match: "GF1" }, b: { from: "loser", match: "GF1" } });
  return matches;
}

interface Outcome {
  a: Slot;
  b: Slot;
  winner: Slot;
  loser: Slot;
  reported: boolean;
}

const PENDING: Slot = { kind: "pending" };
const BYE: Slot = { kind: "bye" };

function resolve(bracket: Bracket, matches: MatchShape[]): Map<string, Outcome> {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const done = new Map<string, Outcome>();

  const slot = (source: Source): Slot => {
    if (source.from === "seed") {
      const entrant = bracket.entrants[source.seed - 1];
      return entrant ? { kind: "entrant", id: entrant.id } : BYE;
    }
    const outcome = outcomeOf(source.match);
    return source.from === "winner" ? outcome.winner : outcome.loser;
  };

  const outcomeOf = (id: string): Outcome => {
    const known = done.get(id);
    if (known) return known;
    const match = byId.get(id);
    if (!match) throw new Error(`Unknown match ${id}`);
    const a = slot(match.a);
    const b = slot(match.b);
    let outcome: Outcome;
    if (id === "GF2") {
      // The reset exists only when the first final was won from the losers side.
      const first = outcomeOf("GF1");
      const needed = first.reported && first.winner.kind === "entrant" && first.b.kind === "entrant" && first.winner.id === first.b.id;
      outcome = needed ? decide(bracket, id, a, b) : { a: BYE, b: BYE, winner: BYE, loser: BYE, reported: false };
    } else {
      outcome = decide(bracket, id, a, b);
    }
    done.set(id, outcome);
    return outcome;
  };

  for (const match of matches) outcomeOf(match.id);
  return done;
}

function decide(bracket: Bracket, id: string, a: Slot, b: Slot): Outcome {
  // An empty side: the other side goes through without playing.
  if (a.kind === "bye") return { a, b, winner: b, loser: BYE, reported: false };
  if (b.kind === "bye") return { a, b, winner: a, loser: BYE, reported: false };
  if (a.kind === "entrant" && b.kind === "entrant") {
    const reported = bracket.results[id];
    if (reported === a.id) return { a, b, winner: a, loser: b, reported: true };
    if (reported === b.id) return { a, b, winner: b, loser: a, reported: true };
  }
  return { a, b, winner: PENDING, loser: PENDING, reported: false };
}

function roundTitle(side: MatchShape["side"], round: number, format: BracketFormat, winnersRounds: number, losersRounds: number): string {
  if (side === "final") return round === 1 ? "Grand final" : "Grand final reset";
  if (side === "losers") return round === losersRounds ? "Losers final" : `Losers round ${round}`;
  const fromEnd = winnersRounds - round;
  const prefix = format === "double" ? "Winners " : "";
  if (fromEnd === 0) return format === "double" ? "Winners final" : "Final";
  if (fromEnd === 1) return `${prefix}semifinals`.replace(/^./, (c) => c.toUpperCase());
  if (fromEnd === 2) return `${prefix}quarterfinals`.replace(/^./, (c) => c.toUpperCase());
  return `${prefix}round ${round}`.replace(/^./, (c) => c.toUpperCase());
}

/** Everything needed to draw the bracket and know who has finished where. */
export function viewBracket(bracket: Bracket): BracketState {
  const size = bracketSize(bracket.entrants.length);
  const matches = shape(bracket.format, size);
  const outcomes = resolve(bracket, matches);
  const winnersRounds = Math.log2(size);
  const losersRounds = Math.max(0, ...matches.filter((m) => m.side === "losers").map((m) => m.round));

  const rounds: RoundView[] = [];
  for (const match of matches) {
    const outcome = outcomes.get(match.id);
    if (!outcome) continue;
    // Nothing to show where nobody can ever play (an unused reset, or two byes meeting).
    if (outcome.a.kind === "bye" && outcome.b.kind === "bye") continue;
    let round = rounds.find((r) => r.side === match.side && r.round === match.round);
    if (!round) {
      round = { side: match.side, round: match.round, title: roundTitle(match.side, match.round, bracket.format, winnersRounds, losersRounds), matches: [] };
      rounds.push(round);
    }
    const bye = outcome.a.kind === "bye" || outcome.b.kind === "bye";
    round.matches.push({
      id: match.id,
      side: match.side,
      round: match.round,
      a: outcome.a,
      b: outcome.b,
      winner: outcome.winner.kind === "entrant" && (outcome.reported || bye) ? outcome.winner.id : null,
      playable: outcome.a.kind === "entrant" && outcome.b.kind === "entrant" && !outcome.reported,
      bye,
      sources: { a: match.a, b: match.b },
    });
  }

  // Finishing places.
  const placements: { entrantId: string; place: number }[] = [];
  const lostIn = (id: string) => {
    const outcome = outcomes.get(id);
    return outcome?.reported && outcome.loser.kind === "entrant" ? outcome.loser.id : null;
  };
  let champion: string | null = null;
  if (bracket.format === "single") {
    const final = outcomes.get(`W${winnersRounds}-1`);
    if (final?.winner.kind === "entrant" && (final.reported || final.a.kind === "bye" || final.b.kind === "bye")) champion = final.winner.id;
    for (const match of matches) {
      const loser = lostIn(match.id);
      if (loser) placements.push({ entrantId: loser, place: size / 2 ** match.round + 1 });
    }
  } else {
    const first = outcomes.get("GF1");
    const reset = outcomes.get("GF2");
    const decider = reset?.reported ? reset : first?.reported && first.winner.kind === "entrant" && first.a.kind === "entrant" && first.winner.id === first.a.id ? first : null;
    if (decider?.winner.kind === "entrant") {
      champion = decider.winner.id;
      if (decider.loser.kind === "entrant") placements.push({ entrantId: decider.loser.id, place: 2 });
    }
    // A player's second loss, in the losers bracket, is where they finish.
    const losers = matches.filter((m) => m.side === "losers");
    for (const match of losers) {
      const loser = lostIn(match.id);
      if (!loser) continue;
      const laterMatches = losers.filter((m) => m.round > match.round).length;
      placements.push({ entrantId: loser, place: 3 + laterMatches });
    }
  }
  if (champion) placements.push({ entrantId: champion, place: 1 });
  placements.sort((x, y) => x.place - y.place);

  const all = rounds.flatMap((r) => r.matches);
  return {
    size,
    rounds,
    champion,
    placements,
    played: all.filter((m) => m.winner !== null && !m.bye).length,
    remaining: all.filter((m) => !m.bye && m.winner === null).length,
  };
}

/** Marks a winner. Refuses a match that isn't ready or a player who isn't in it. */
export function reportResult(bracket: Bracket, matchId: string, winnerId: string): Bracket {
  const match = viewBracket(bracket).rounds.flatMap((r) => r.matches).find((m) => m.id === matchId);
  if (!match) throw new Error("That match isn't part of this bracket.");
  const inMatch = [match.a, match.b].some((s) => s.kind === "entrant" && s.id === winnerId);
  if (match.a.kind !== "entrant" || match.b.kind !== "entrant" || !inMatch) throw new Error("That match isn't ready to be decided.");
  return prune({ ...bracket, results: { ...bracket.results, [matchId]: winnerId } });
}

/** Clears a result. Later matches that depended on it are cleared too. */
export function clearResult(bracket: Bracket, matchId: string): Bracket {
  const results = { ...bracket.results };
  delete results[matchId];
  return prune({ ...bracket, results });
}

/** Drops stored results that no longer apply (their match changed players or isn't reached). */
function prune(bracket: Bracket): Bracket {
  const outcomes = resolve(bracket, shape(bracket.format, bracketSize(bracket.entrants.length)));
  const results: Record<string, string> = {};
  for (const [id, outcome] of outcomes) {
    if (outcome.reported && outcome.winner.kind === "entrant") results[id] = outcome.winner.id;
  }
  return { ...bracket, results };
}

/**
 * How many players a store event usually cuts to after Swiss rounds. Common
 * practice across Pokémon, One Piece and Lorcana store events; organizers can
 * choose differently.
 */
export function suggestedTopCut(players: number): number | null {
  if (players <= 8) return null;
  if (players <= 16) return 4;
  if (players <= 32) return 8;
  return 16;
}
