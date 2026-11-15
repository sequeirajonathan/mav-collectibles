import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader, EmptyState } from "@components/ui/page-header";
import { getLeaderboard, listGames, listPastEvents, listSeasons } from "@lib/data/hub";
import { formatShortDate } from "@lib/format";
import { cn } from "@utils";
import { cardVariants } from "@components/ui/card";
import { Skeleton } from "@components/ui/skeleton";
import { RankMark } from "@components/hub/badges";
import { ChipLink, chipRowClass } from "@components/ui/chip";

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

  return (
    <>
      <nav aria-label="Game" className={cn(chipRowClass, "mb-3")}>
        {games.map((g) => (
          <ChipLink key={g.id} href={`/leaderboard?game=${g.id}`} active={g.id === game.id} dot={g.id === game.id ? undefined : g.color}>
            {g.shortName}
          </ChipLink>
        ))}
      </nav>
      {seasons.length > 0 && (
        <nav aria-label="Season" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none scroll-fade fold:mx-0 fold:px-0">
          {seasons.map((s) => (
            <ChipLink key={s.id} href={`/leaderboard?game=${game.id}&season=${s.id}`} active={s.id === season?.id}>
              {s.name}
            </ChipLink>
          ))}
        </nav>
      )}

      <h2 className="mb-3 text-lg font-bold">
        {game.name} {season ? `· ${season.name}` : "· All time"}
      </h2>
      {rows.length === 0 ? (
        <EmptyState mascot="gengar" title="No results yet" description="Standings appear here after the first tournament results are posted." />
      ) : (
        <>
          {/* Phones: stacked rows */}
          <ol className={cn(cardVariants({ variant: "list" }), "md:hidden")}>
            {rows.map((r) => (
              <li key={`${r.rank}-${r.playerName}`} className="flex items-center gap-3 px-4 py-3">
                <RankMark rank={r.rank} />
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
          <div className={cn(cardVariants(), "hidden overflow-hidden md:block")}>
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
                  <tr key={`${r.rank}-${r.playerName}`} className="transition-colors can-hover:hover:bg-panel-2/60">
                    <td className="px-4 py-2">
                      <RankMark rank={r.rank} />
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
                <Link href={`/events/${e.slug}`} className={cn(cardVariants({ variant: "interactive", padding: "row", radius: "lg" }), "block")}>
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
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Board searchParams={searchParams} />
      </Suspense>
    </>
  );
}
