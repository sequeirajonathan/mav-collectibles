import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CalendarDays, Megaphone, Store, Trophy } from "lucide-react";
import { EventCard, EventListSkeleton } from "@components/hub/event-card";
import { PostCard, PostCardSkeleton } from "@components/hub/post-card";
import { SectionHeading, EmptyState } from "@components/ui/page-header";
import { DiscordCta } from "@components/hub/discord";
import { GameBadge, KindBadge } from "@components/hub/badges";
import { GoogleReviews } from "@components/hub/google-reviews";
import { YouTubeEmbed } from "@components/hub/youtube-embed";
import { LiveStream } from "@components/hub/live-stream";
import { getLeaderboard, listEvents, listGames, listPosts } from "@lib/data/hub";
import { withMyReactions } from "@lib/data/viewer";
import { getFlags, getVideoSettings, getYouTubeSettings } from "@lib/data/site";
import { capacityLabel, formatEventWhen } from "@lib/format";
import { cardVariants } from "@components/ui/card";
import { cn } from "@utils";
import { Skeleton } from "@components/ui/skeleton";
import { LinkButton } from "@components/ui/link-button";
import { buttonVariants } from "@components/ui/button";
import { ChipLink, chipRowClass } from "@components/ui/chip";
import { Eyebrow } from "@components/ui/page-header";
import { JsonLd } from "@components/seo/json-ld";
import { storeJsonLd } from "@lib/seo";
import { ShopOnly, VendorsOnly } from "@components/layout/shop-only";
import { BuyBanner } from "@components/home/buy-banner";
import { GameGrid } from "@components/home/game-grid";
import { Petals } from "@components/home/petals";
import { RankMark } from "@components/hub/badges";

/** Decorative fan of trading cards for the hero on wide screens. Pure CSS, hidden from assistive tech. */
function HeroCards() {
  const card = "absolute top-1/2 aspect-[5/7] w-28 rounded-xl border shadow-2xl shadow-black/60 xl:w-32";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 right-10 hidden w-72 lg:block xl:right-16">
      <div className={cn(card, "left-4 -translate-y-1/2 -rotate-12 border-line bg-gradient-to-br from-panel-2 to-ink")} />
      <div className={cn(card, "left-36 -translate-y-1/2 rotate-12 border-discord/40 bg-gradient-to-br from-discord/30 to-ink")} />
      <div className={cn(card, "holo left-20 -translate-y-[55%] overflow-hidden border-gold/60 bg-gradient-to-br from-gold-light via-gold to-gold-dark p-2")}>
        <div className="flex h-full items-center justify-center rounded-lg border border-ink/20">
          <div className="relative size-12 overflow-hidden rounded-full border-4 border-ink bg-foreground">
            <div className="absolute inset-x-0 top-0 h-1/2 bg-danger" />
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-ink" />
            <div className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-ink bg-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function Spotlight() {
  const events = await listEvents({ limit: 12 });
  const spotlight = events.find((e) => e.featured && e.status === "published") ?? events.find((e) => e.status === "published");
  if (!spotlight) return null;
  return (
    <Link
      href={`/events/${spotlight.slug}`}
      className={cn(
        cardVariants({ variant: "featured", radius: "2xl" }),
        "group relative mt-4 block overflow-hidden transition-shadow duration-300 can-hover:hover:shadow-glow fold:mt-6"
      )}
    >
      {spotlight.coverImageUrl && (
        <Image src={spotlight.coverImageUrl} alt="" fill priority sizes="(min-width: 1280px) 1280px, 100vw" className="object-cover opacity-40 transition-[opacity,scale] duration-500 can-hover:group-hover:scale-[1.02] can-hover:group-hover:opacity-50" />
      )}
      <div className="relative bg-gradient-to-r from-panel/95 via-panel/75 to-transparent p-5 fold:p-8">
        <Eyebrow className="flex items-center gap-2">
          <span aria-hidden className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-gold" />
          </span>
          Next up
        </Eyebrow>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {spotlight.game && <GameBadge game={spotlight.game} />}
          <KindBadge kind={spotlight.kind} />
        </div>
        <h2 className="mt-2 max-w-xl text-2xl font-extrabold leading-tight fold:text-3xl">{spotlight.title}</h2>
        <p className="mt-1 text-foreground/80">{formatEventWhen(spotlight.startsAt, spotlight.endsAt)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{capacityLabel(spotlight.capacity, spotlight.registeredCount, spotlight.waitlistCount)}</p>
        <span className={cn(buttonVariants(), "mt-4 can-hover:group-hover:bg-gold-light")}>
          Details & RSVP
          <ArrowRight aria-hidden className="transition-transform can-hover:group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

async function UpcomingEvents() {
  const events = (await listEvents({ limit: 6 })).filter((e) => e.status === "published");
  return events.length === 0 ? (
    <EmptyState mascot="random" title="New events are coming soon" description="Follow the news feed for the next league night and tournament." />
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
    <nav aria-label="Games we play" className={chipRowClass}>
      {games.map((g) => (
        <ChipLink key={g.id} href={`/events?game=${g.id}`} dot={g.color} className="px-4 font-semibold text-foreground">
          {g.shortName}
        </ChipLink>
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
      <ol className={cardVariants({ variant: "list" })}>
        {rows.map((r) => (
          <li key={`${r.rank}-${r.playerName}`} className="flex items-center gap-3 px-4 py-3">
            <RankMark rank={r.rank} />
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
  { href: "/events", label: "Events", description: "Leagues, tournaments, pre-releases", Icon: CalendarDays },
  { href: "/feed", label: "News", description: "Announcements & recaps", Icon: Megaphone },
  { href: "/vendors", label: "Vendors", description: "Buy, sell & trade days", Icon: Store },
  { href: "/leaderboard", label: "Leaderboard", description: "Season standings", Icon: Trophy },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-12 fold:space-y-14">
      <JsonLd data={storeJsonLd()} />
      <section>
        <div className="relative overflow-hidden rounded-2xl border border-line bg-hero px-5 py-8 fold:px-8 fold:py-12 short:py-6">
          <div aria-hidden className="speed-lines pointer-events-none absolute inset-0" />
          <Petals />
          <HeroCards />
          <span aria-hidden className="comic-only burst absolute right-4 top-4 lg:right-[21rem] lg:top-6">New pulls weekly!</span>
          <div className="relative max-w-3xl lg:max-w-xl xl:max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow>Montgomery, TX</Eyebrow>
              <span className="sticker px-2 py-1 text-sm">Buy · Sell · Trade</span>
            </div>
            <h1 className="ui-hero-title font-display mt-3 text-[2.6rem] leading-[1.12] fold:text-6xl short:text-4xl">
              Your home for <span className="text-pop">Pokémon</span> & every TCG.
            </h1>
            <p className="mt-3 max-w-2xl text-foreground/80 fold:text-lg">
              League nights, tournaments, pre-releases and vendor days. RSVP, track your season points and never miss a release.
            </p>
          </div>
        </div>
        <Suspense fallback={<Skeleton className="mt-4 h-48 rounded-2xl fold:mt-6" />}>
          <Spotlight />
        </Suspense>
        <ul className="mt-4 grid grid-cols-2 gap-2 fold:mt-6 fold:gap-3 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
          {QUICK_LINKS.map(({ href, label, description, Icon }) => {
            const tile = (
              <li key={href}>
                <Link href={href} className={cn(cardVariants({ variant: "interactive" }), "group flex h-full flex-col gap-1 p-3 fold:p-4")}>
                  <span className="mb-1 inline-flex size-9 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 transition-colors can-hover:group-hover:bg-gold/20">
                    <Icon className="size-5 text-gold" />
                  </span>
                  <span className="font-bold">{label}</span>
                  <span className="text-xs text-muted-foreground fold:text-sm">{description}</span>
                </Link>
              </li>
            );
            return href === "/vendors" ? <VendorsOnly key={href}>{tile}</VendorsOnly> : tile;
          })}
        </ul>
      </section>

      <ShopOnly>
        <section>
          <SectionHeading title="Choose your game" href="/shop" linkLabel="Whole shop" />
          <GameGrid />
        </section>
      </ShopOnly>

      <BuyBanner />

      <section>
        <SectionHeading title="Coming up" href="/events" linkLabel="All events" />
        <Suspense fallback={<div className="h-11 can-hover:h-9" />}>
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

      <div className="grid gap-12 lg:grid-flow-col lg:auto-cols-fr">
        <Suspense fallback={null}>
          <PokemonStandings />
        </Suspense>
        <VendorsOnly>
        <section className={cn(cardVariants({ radius: "2xl" }), "bg-gradient-to-br from-panel to-panel-2 p-5 fold:p-6")}>
          <h2 className="text-xl font-bold">Sell or trade at MAV</h2>
          <p className="mt-2 text-foreground/80">
            Vendors set up at the shop on vendor days. Bring your binder, slabs and sealed product and meet the community.
          </p>
          <div className="mt-4 flex flex-col gap-2 fold:flex-row">
            <LinkButton href="/vendors" variant="outline">
              Meet the vendors
            </LinkButton>
            <LinkButton href="/vendors/apply">
              Apply for a table
            </LinkButton>
          </div>
        </section>
        </VendorsOnly>
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
