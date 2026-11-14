import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Trophy } from "lucide-react";
import { PageHeader, EmptyState } from "@components/hub/page-header";
import { getLeaderboard, listGames, listPastEvents, listSeasons } from "@lib/data/hub";
import { formatShortDate } from "@lib/format";
import { cn } from "@utils";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Season standings for Pokémon and other games at MAV Collectibles.",
};

type SearchParams = Promise<{ game?: string; season?: string }>;

async function Board({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const games = await listGames();
  const game = games.find((g) => g.id === params.game) ?? games[0];
  if (!game) return null;
  const seasons = await listSeasons(game.id);
  const season = seasons.find((s) => s.id === params.season) ?? seasons[0];
  const [rows, recent] = await Promise.all([getLeaderboard(game.id, season?.id), listPastEvents(5, game.id)]);

  const chip = (active: boolean) =>
    cn(
      "inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 text-sm font-medium",
      active ? "border-gold bg-gold text-ink" : "border-line bg-panel text-muted-foreground hover:text-foreground"
    );

  return (
    <>
      <nav aria-label="Game" className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none scroll-fade fold:mx-0 fold:flex-wrap fold:px-0">
        {games.map((g) => (
          <Link key={g.id} href={`/leaderboard?game=${g.id}`} className={chip(g.id === game.id)} aria-current={g.id === game.id ? "page" : undefined}>
            {g.shortName}
          </Link>
        ))}
      </nav>
      {seasons.length > 0 && (
        <nav aria-label="Season" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none scroll-fade fold:mx-0 fold:px-0">
          {seasons.map((s) => (
            <Link key={s.id} href={`/leaderboard?game=${game.id}&season=${s.id}`} className={chip(s.id === season?.id)}>
              {s.name}
            </Link>
          ))}
        </nav>
      )}

      <h2 className="mb-3 text-lg font-bold">
        {game.name} {season ? `· ${season.name}` : "· All time"}
      </h2>
      {rows.length === 0 ? (
        <EmptyState title="No results yet" description="Standings appear here after the first tournament results are posted." />
      ) : (
        <>
          {/* Phones: stacked rows */}
          <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel md:hidden">
            {rows.map((r) => (
              <li key={`${r.rank}-${r.playerName}`} className="flex items-center gap-3 px-4 py-3">
                <span className={cn("w-8 shrink-0 text-center text-lg font-extrabold", r.rank <= 3 ? "text-gold" : "text-muted-foreground")}>{r.rank}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.playerName}</span>
                  <span className="text-xs text-muted-foreground">
                    {r.events} event{r.events === 1 ? "" : "s"} · {r.wins} wins · best #{r.bestPlacement}
                  </span>
                </span>
                <span className="shrink-0 font-bold tabular-nums">{r.points}</span>
              </li>
            ))}
          </ol>
          {/* Wider screens: table */}
          <div className="hidden overflow-hidden rounded-xl border border-line md:block">
            <table className="w-full text-sm">
              <thead className="bg-panel-2 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3 text-right">Events</th>
                  <th className="px-4 py-3 text-right">Wins</th>
                  <th className="px-4 py-3 text-right">Best</th>
                  <th className="px-4 py-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-panel">
                {rows.map((r) => (
                  <tr key={`${r.rank}-${r.playerName}`}>
                    <td className={cn("px-4 py-3 font-extrabold", r.rank <= 3 ? "text-gold" : "text-muted-foreground")}>
                      {r.rank === 1 ? <Trophy className="inline size-4" aria-label="1st" /> : r.rank}
                    </td>
                    <td className="px-4 py-3 font-semibold">{r.playerName}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.events}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.wins}</td>
                    <td className="px-4 py-3 text-right tabular-nums">#{r.bestPlacement}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {recent.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold">Recent events</h2>
          <ul className="grid gap-2 fold:grid-cols-2">
            {recent.map((e) => (
              <li key={e.id}>
                <Link href={`/events/${e.slug}`} className="block rounded-lg border border-line bg-panel px-4 py-3 hover:border-gold/50">
                  <span className="block truncate font-semibold">{e.title}</span>
                  <span className="text-sm text-muted-foreground">{formatShortDate(e.startsAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export default function LeaderboardPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader eyebrow="Compete" title="Leaderboard" description="Season points from every tournament at the shop." />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-panel" />}>
        <Board searchParams={searchParams} />
      </Suspense>
    </>
  );
}
