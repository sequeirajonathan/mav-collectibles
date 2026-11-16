import { describe, expect, it } from "vitest";
import { bracketSchema, bracketSize, clearResult, reportResult, seedPositions, suggestedTopCut, viewBracket, type Bracket, type MatchView } from "@lib/bracket";

const players = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}`, userId: null }));
const make = (n: number, format: Bracket["format"] = "single"): Bracket => bracketSchema.parse({ format, entrants: players(n) });
const all = (b: Bracket) => viewBracket(b).rounds.flatMap((r) => r.matches);
const id = (slot: MatchView["a"]) => (slot.kind === "entrant" ? slot.id : slot.kind);
const pairing = (m: MatchView) => `${id(m.a)} v ${id(m.b)}`;

/** Plays every ready match, choosing the winner with `pick`, until none are left. */
function playOut(bracket: Bracket, pick: (m: MatchView) => string, leave?: string): Bracket {
  let current = bracket;
  for (let guard = 0; guard < 500; guard++) {
    const next = all(current).find((m) => m.playable && m.id !== leave);
    if (!next) return current;
    current = reportResult(current, next.id, pick(next));
  }
  throw new Error("bracket never finished");
}
const seedOf = (entrantId: string) => Number(entrantId.slice(1));
const betterSeed = (m: MatchView) => (seedOf(id(m.a)) < seedOf(id(m.b)) ? id(m.a) : id(m.b));
const worseSeed = (m: MatchView) => (seedOf(id(m.a)) > seedOf(id(m.b)) ? id(m.a) : id(m.b));

describe("seeding", () => {
  it("pairs the top seed with the lowest and keeps 1 and 2 apart until the final", () => {
    expect(seedPositions(4)).toEqual([1, 4, 2, 3]);
    expect(seedPositions(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
    const first = viewBracket(make(8)).rounds[0]?.matches.map(pairing);
    expect(first).toEqual(["p1 v p8", "p4 v p5", "p2 v p7", "p3 v p6"]);
  });

  it("gives byes to the top seeds when the field isn't a power of two", () => {
    expect(bracketSize(5)).toBe(8);
    const view = viewBracket(make(5));
    const first = view.rounds[0]?.matches ?? [];
    expect(first.filter((m) => m.bye).map((m) => m.winner)).toEqual(["p1", "p2", "p3"]);
    expect(first.filter((m) => m.playable).map(pairing)).toEqual(["p4 v p5"]);
    // Only real matches count towards what's left to play: 5 players need 4 matches.
    expect(view.remaining).toBe(4);
  });
});

describe("single elimination", () => {
  it("advances winners and places everyone when favourites win", () => {
    const done = playOut(make(8), betterSeed);
    const view = viewBracket(done);
    expect(view.champion).toBe("p1");
    expect(view.remaining).toBe(0);
    expect(view.played).toBe(7);
    const place = Object.fromEntries(view.placements.map((p) => [p.entrantId, p.place]));
    expect(place).toEqual({ p1: 1, p2: 2, p3: 3, p4: 3, p5: 5, p6: 5, p7: 5, p8: 5 });
    expect(view.rounds.map((r) => r.title)).toEqual(["Quarterfinals", "Semifinals", "Final"]);
  });

  it("only accepts a winner who is actually in a ready match", () => {
    const b = make(4);
    expect(() => reportResult(b, "W1-1", "p2")).toThrow();
    expect(() => reportResult(b, "W2-1", "p1")).toThrow();
    expect(() => reportResult(b, "nope", "p1")).toThrow();
  });

  it("undoing a result also clears what was played after it", () => {
    let b = make(4);
    b = reportResult(b, "W1-1", "p1");
    b = reportResult(b, "W1-2", "p2");
    b = reportResult(b, "W2-1", "p1");
    expect(viewBracket(b).champion).toBe("p1");
    b = clearResult(b, "W1-1");
    expect(b.results).toEqual({ "W1-2": "p2" });
    expect(viewBracket(b).champion).toBeNull();
    // Changing a winner replaces the player in the next match rather than leaving a stale result.
    b = reportResult(reportResult(b, "W1-1", "p1"), "W2-1", "p1");
    b = reportResult(b, "W1-1", "p4");
    expect(b.results["W2-1"]).toBeUndefined();
  });
});

describe("double elimination", () => {
  it("nobody is out until they have lost twice", () => {
    for (const n of [3, 4, 5, 6, 8, 11, 16]) {
      const done = playOut(make(n, "double"), betterSeed);
      const view = viewBracket(done);
      expect(view.remaining, `${n} players`).toBe(0);
      expect(view.champion, `${n} players`).toBe("p1");
      const losses = new Map<string, number>();
      for (const m of all(done)) {
        if (m.bye || !m.winner) continue;
        const loser = id(m.a) === m.winner ? id(m.b) : id(m.a);
        losses.set(loser, (losses.get(loser) ?? 0) + 1);
      }
      // The undefeated champion never loses; everyone else loses exactly twice.
      expect(losses.get("p1") ?? 0, `${n} players`).toBe(0);
      for (const p of players(n).slice(1)) expect(losses.get(p.id), `${n} players, ${p.id}`).toBe(2);
      // Without a reset that is 2N − 2 matches.
      expect(view.played, `${n} players`).toBe(2 * n - 2);
      expect(view.placements.map((p) => p.entrantId).sort()).toEqual(players(n).map((p) => p.id).sort());
      expect(view.placements.filter((p) => p.place === 1)).toHaveLength(1);
      expect(view.placements.filter((p) => p.place === 2)).toHaveLength(1);
      expect(view.placements.filter((p) => p.place === 3)).toHaveLength(1);
    }
  });

  it("resets the grand final when the losers-bracket player wins the first one", () => {
    let b = playOut(make(4, "double"), betterSeed, "GF1");
    // Everything but the final is done; p1 is unbeaten, p2 came through the losers bracket.
    const final = all(b).find((m) => m.id === "GF1");
    expect(final && pairing(final)).toBe("p1 v p2");
    expect(all(b).some((m) => m.id === "GF2")).toBe(false);

    b = reportResult(b, "GF1", "p2");
    const reset = all(b).find((m) => m.id === "GF2");
    expect(reset?.playable).toBe(true);
    expect(viewBracket(b).champion).toBeNull();
    expect(viewBracket(b).rounds.at(-1)?.title).toBe("Grand final reset");

    b = reportResult(b, "GF2", "p2");
    const view = viewBracket(b);
    expect(view.champion).toBe("p2");
    expect(view.placements.find((p) => p.entrantId === "p1")?.place).toBe(2);
    // One extra match: 2N − 1.
    expect(view.played).toBe(7);

    // Undo the first final: the reset disappears with it.
    b = clearResult(b, "GF1");
    expect(b.results.GF2).toBeUndefined();
    expect(all(b).some((m) => m.id === "GF2")).toBe(false);
  });

  it("still finishes when every match is an upset", () => {
    for (const n of [4, 7, 8]) {
      const view = viewBracket(playOut(make(n, "double"), worseSeed));
      expect(view.remaining, `${n} players`).toBe(0);
      expect(view.champion, `${n} players`).not.toBeNull();
      expect(view.placements).toHaveLength(n);
    }
  });
});

describe("what can be stored", () => {
  it("needs two players, three for a losers bracket, and no duplicates", () => {
    expect(bracketSchema.safeParse({ format: "single", entrants: players(1) }).success).toBe(false);
    expect(bracketSchema.safeParse({ format: "double", entrants: players(2) }).success).toBe(false);
    expect(bracketSchema.safeParse({ format: "double", entrants: players(3) }).success).toBe(true);
    expect(bracketSchema.safeParse({ format: "single", entrants: [...players(2), ...players(1)] }).success).toBe(false);
  });

  it("ignores stored results that don't fit the bracket", () => {
    const b = bracketSchema.parse({ format: "single", entrants: players(4), results: { "W1-1": "p3", "W2-1": "p1", junk: "p1" } });
    const view = viewBracket(b);
    expect(view.played).toBe(0);
    expect(view.champion).toBeNull();
  });
});

describe("top cut size", () => {
  it("follows common store practice", () => {
    expect([6, 8, 9, 16, 17, 32, 40].map(suggestedTopCut)).toEqual([null, null, 4, 4, 8, 8, 16]);
  });
});
