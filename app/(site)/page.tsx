import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarDays, Megaphone, Store, Trophy } from "lucide-react";
import { EventCard, EventListSkeleton } from "@components/hub/event-card";
import { PostCard, PostCardSkeleton } from "@components/hub/post-card";
import { SectionHeading, EmptyState } from "@components/hub/page-header";
import { DiscordCta } from "@components/hub/discord";
import { GameBadge, KindBadge } from "@components/hub/badges";
import { GoogleReviews } from "@components/hub/google-reviews";
import { YouTubeEmbed } from "@components/hub/youtube-embed";
import { LiveStream } from "@components/hub/live-stream";
import { getLeaderboard, listEvents, listGames, listPosts } from "@lib/data/hub";
import { withMyReactions } from "@lib/data/viewer";
import { getFlags, getVideoSettings, getYouTubeSettings } from "@lib/data/site";
import { capacityLabel, formatEventWhen } from "@lib/format";

async function Spotlight() {
  const events = await listEvents({ limit: 12 });
  const spotlight = events.find((e) => e.featured && e.status === "published") ?? events.find((e) => e.status === "published");
  if (!spotlight) return null;
  return (
    <Link
      href={`/events/${spotlight.slug}`}
      className="group relative mt-6 block overflow-hidden rounded-2xl border border-gold/40 bg-panel fold:mt-8"
    >
      {spotlight.coverImageUrl && (
        <Image src={spotlight.coverImageUrl} alt="" fill priority sizes="(min-width: 1280px) 1280px, 100vw" className="object-cover opacity-40 transition-opacity group-hover:opacity-50" />
      )}
      <div className="relative bg-gradient-to-r from-black/90 via-black/70 to-transparent p-5 fold:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Next up</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {spotlight.game && <GameBadge game={spotlight.game} />}
          <KindBadge kind={spotlight.kind} />
        </div>
        <h2 className="mt-2 max-w-xl text-2xl font-extrabold leading-tight fold:text-3xl">{spotlight.title}</h2>
        <p className="mt-1 text-foreground/80">{formatEventWhen(spotlight.startsAt, spotlight.endsAt)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{capacityLabel(spotlight.capacity, spotlight.registeredCount, spotlight.waitlistCount)}</p>
        <span className="mt-4 inline-flex min-h-11 items-center rounded-md bg-gold px-5 font-bold text-ink group-hover:bg-gold-light">
          Details & RSVP
        </span>
      </div>
    </Link>
  );
}

async function UpcomingEvents() {
  const events = (await listEvents({ limit: 6 })).filter((e) => e.status === "published");
  return events.length === 0 ? (
    <EmptyState title="New events are coming soon" description="Follow the news feed for the next league night and tournament." />
  ) : (
    <div className="grid gap-3 lg:grid-cols-2">
      {events.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
    </div>
  );
}

async function LatestPosts() {
  const page = await listPosts({ limit: 3 });
  if (page.posts.length === 0) return null;
  const { posts, signedIn } = await withMyReactions(page.posts);
  return (
    <section>
      <SectionHeading title="Latest news" href="/feed" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} signedIn={signedIn} />
        ))}
      </div>
    </section>
  );
}

async function GameStrip() {
  const games = await listGames();
  return (
    <nav aria-label="Games we play" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none scroll-fade fold:mx-0 fold:flex-wrap fold:px-0">
      {games.map((g) => (
        <Link
          key={g.id}
          href={`/events?game=${g.id}`}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-line bg-panel px-4 text-sm font-semibold hover:border-gold/60"
        >
          <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: g.color }} />
          {g.shortName}
        </Link>
      ))}
    </nav>
  );
}

async function PokemonStandings() {
  const rows = (await getLeaderboard("pokemon")).slice(0, 5);
  if (rows.length === 0) return null;
  return (
    <section>
      <SectionHeading title="Pokémon standings" href="/leaderboard?game=pokemon" linkLabel="Full leaderboard" />
      <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
        {rows.map((r) => (
          <li key={`${r.rank}-${r.playerName}`} className="flex items-center gap-3 px-4 py-3">
            <span className="w-6 text-center font-extrabold text-gold">{r.rank}</span>
            <span className="min-w-0 flex-1 truncate font-semibold">{r.playerName}</span>
            <span className="font-bold tabular-nums">{r.points} pts</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

async function Media() {
  const flags = await getFlags();
  const [youtube, video] = await Promise.all([
    flags.showYouTubeVideo ? getYouTubeSettings() : null,
    flags.showVideoPlayer ? getVideoSettings() : null,
  ]);
  if (!youtube && !video) return null;
  return (
    <section className="space-y-4">
      <SectionHeading title={video?.isLive ? "Live now" : "Watch"} />
      {video && <LiveStream settings={video} />}
      {youtube && <YouTubeEmbed videoId={youtube.videoId} title={youtube.title} playlistId={youtube.playlistId || undefined} />}
    </section>
  );
}

async function Reviews() {
  const flags = await getFlags();
  return flags.showGoogleReviews ? <GoogleReviews /> : null;
}

const QUICK_LINKS = [
  { href: "/events", label: "Events", description: "Leagues, tournaments, prereleases", Icon: CalendarDays },
  { href: "/feed", label: "News", description: "Announcements & recaps", Icon: Megaphone },
  { href: "/vendors", label: "Vendors", description: "Buy, sell & trade days", Icon: Store },
  { href: "/leaderboard", label: "Leaderboard", description: "Season standings", Icon: Trophy },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-12 fold:space-y-14">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Montgomery, TX</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-extrabold leading-[1.1] tracking-tight fold:text-5xl short:text-3xl">
          Your home for Pokémon <span className="text-gold">&</span> every TCG.
        </h1>
        <p className="mt-3 max-w-2xl text-foreground/80 fold:text-lg">
          League nights, tournaments, prereleases and vendor days. RSVP, track your season points and never miss a release.
        </p>
        <Suspense fallback={<div className="mt-6 h-48 animate-pulse rounded-2xl bg-panel fold:mt-8" />}>
          <Spotlight />
        </Suspense>
        <ul className="mt-6 grid grid-cols-2 gap-2 fold:gap-3 lg:grid-cols-4">
          {QUICK_LINKS.map(({ href, label, description, Icon }) => (
            <li key={href}>
              <Link href={href} className="flex h-full flex-col gap-1 rounded-xl border border-line bg-panel p-3 hover:border-gold/50 fold:p-4">
                <Icon className="size-5 text-gold" />
                <span className="font-bold">{label}</span>
                <span className="text-xs text-muted-foreground fold:text-sm">{description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionHeading title="Coming up" href="/events" linkLabel="All events" />
        <Suspense fallback={<div className="h-10" />}>
          <GameStrip />
        </Suspense>
        <div className="mt-4">
          <Suspense fallback={<EventListSkeleton count={4} />}>
            <UpcomingEvents />
          </Suspense>
        </div>
      </section>

      <Suspense fallback={<div className="grid gap-4 md:grid-cols-2"><PostCardSkeleton /><PostCardSkeleton /></div>}>
        <LatestPosts />
      </Suspense>

      <div className="grid gap-12 lg:grid-cols-2">
        <Suspense fallback={null}>
          <PokemonStandings />
        </Suspense>
        <section className="rounded-2xl border border-line bg-gradient-to-br from-panel to-panel-2 p-5 fold:p-6">
          <h2 className="text-xl font-bold">Sell or trade at MAV</h2>
          <p className="mt-2 text-foreground/80">
            Vendors set up at the shop on vendor days. Bring your binder, slabs and sealed product and meet the community.
          </p>
          <div className="mt-4 flex flex-col gap-2 fold:flex-row">
            <Link href="/vendors" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 font-semibold hover:border-gold/60">
              Meet the vendors
            </Link>
            <Link href="/vendors/apply" className="inline-flex min-h-11 items-center justify-center rounded-md bg-gold px-4 font-bold text-ink hover:bg-gold-light">
              Apply for a table
            </Link>
          </div>
        </section>
      </div>

      <Suspense fallback={null}>
        <DiscordCta />
      </Suspense>

      <Suspense fallback={null}>
        <Media />
      </Suspense>

      <Suspense fallback={null}>
        <Reviews />
      </Suspense>
    </div>
  );
}
