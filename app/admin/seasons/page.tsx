import { Suspense } from "react";
import { PageHeader } from "@components/hub/page-header";
import { SeasonForm } from "@components/admin/season-form";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES } from "@interfaces/roles";
import { listGames, listSeasons } from "@lib/data/hub";

async function Seasons() {
  await requirePageRole(CONTENT_ROLES, "/admin/seasons");
  const [games, seasons] = await Promise.all([listGames(), listSeasons()]);
  const gameName = new Map(games.map((g) => [g.id, g.shortName]));
  return (
    <div className="space-y-6">
      <SeasonForm games={games} />
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
        {seasons.length === 0 && <li className="p-4 text-sm text-muted-foreground">No seasons yet. Without one, the leaderboard shows all-time points.</li>}
        {seasons.map((s) => (
          <li key={s.id} className="flex flex-wrap justify-between gap-2 p-4">
            <span className="font-semibold">{gameName.get(s.gameId)} · {s.name}</span>
            <span className="text-sm text-muted-foreground">{s.startsOn} → {s.endsOn}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminSeasonsPage() {
  return (
    <>
      <PageHeader title="Seasons" description="Leaderboard points add up within a season for each game." />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-panel" />}>
        <Seasons />
      </Suspense>
    </>
  );
}
