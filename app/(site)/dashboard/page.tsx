import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageHeader, EmptyState, SectionHeading } from "@components/hub/page-header";
import { EventCard, EventListSkeleton } from "@components/hub/event-card";
import { PostCard } from "@components/hub/post-card";
import { getCurrentUser } from "@lib/auth/server";
import { listMyEvents, listSavedPosts } from "@lib/data/hub";
import { withMyReactions } from "@lib/data/viewer";
import { CONTENT_ROLES, UserRole } from "@interfaces/roles";

export const metadata: Metadata = { title: "My hub" };

async function Greeting() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/dashboard");
  if (user.role === UserRole.PRINT_AGENT) redirect("/print-agent");
  return (
    <PageHeader
      eyebrow="My hub"
      title="Welcome back"
      description="Your RSVPs and saved posts, all in one place."
      actions={
        <>
          <Link href="/profile" className="inline-flex min-h-10 items-center rounded-md border border-line px-3 text-sm font-semibold hover:border-gold/60">Edit profile</Link>
          {CONTENT_ROLES.includes(user.role) && (
            <Link href="/admin" className="inline-flex min-h-10 items-center rounded-md bg-gold px-3 text-sm font-bold text-ink hover:bg-gold-light">Admin</Link>
          )}
        </>
      }
    />
  );
}

async function MyEvents() {
  const user = await getCurrentUser();
  if (!user) return null;
  const events = await listMyEvents(user.id);
  if (events.length === 0) {
    return <EmptyState title="No RSVPs yet" description="Find a league night or tournament and save your seat." action={<Link href="/events" className="font-semibold text-gold">Browse events →</Link>} />;
  }
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {events.map((e) => (
        <div key={e.id} className="relative">
          <EventCard event={e} />
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/80 px-2 py-0.5 text-xs font-bold text-success">
            {e.myStatus === "waitlisted" ? "Waitlist" : e.myStatus === "checked_in" ? "Checked in" : "Going"}
          </span>
        </div>
      ))}
    </div>
  );
}

async function SavedPosts() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { posts } = await withMyReactions(await listSavedPosts(user.id));
  if (posts.length === 0) return <EmptyState title="Nothing saved yet" description="Tap Save on a post to keep it here." />;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} signedIn />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<div className="mb-6 h-20" />}>
        <Greeting />
      </Suspense>
      <section className="mb-10">
        <SectionHeading title="My events" href="/events" linkLabel="Find more" />
        <Suspense fallback={<EventListSkeleton count={2} />}>
          <MyEvents />
        </Suspense>
      </section>
      <section>
        <SectionHeading title="Saved posts" href="/feed" linkLabel="News feed" />
        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-panel" />}>
          <SavedPosts />
        </Suspense>
      </section>
    </>
  );
}
