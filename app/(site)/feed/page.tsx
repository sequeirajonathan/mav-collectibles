import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, EmptyState } from "@components/ui/page-header";
import { PostCard, PostCardSkeleton } from "@components/hub/post-card";
import { listPosts } from "@lib/data/hub";
import { withMyReactions } from "@lib/data/viewer";
import { isoDateTime } from "@lib/contracts/common";
import { LinkButton } from "@components/ui/link-button";

export const metadata: Metadata = {
  title: "News & announcements",
  description: "Announcements, new arrivals, event recaps and community news from MAV Collectibles.",
};

type SearchParams = Promise<{ before?: string }>;

async function Feed({ searchParams }: { searchParams: SearchParams }) {
  const { before } = await searchParams;
  const cursor = isoDateTime.safeParse(before);
  const page = await listPosts({ limit: 10, before: cursor.success ? cursor.data : undefined });
  const { posts, signedIn } = await withMyReactions(page.posts);

  if (posts.length === 0) {
    return <EmptyState title="No posts yet" description="Announcements from the shop will show up here." />;
  }
  return (
    <div className="space-y-5">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} signedIn={signedIn} />
      ))}
      {page.nextCursor && (
        <div className="flex justify-center pt-2">
          <LinkButton
            href={`/feed?before=${encodeURIComponent(page.nextCursor)}`} variant="outline"
          >
            Older posts
          </LinkButton>
        </div>
      )}
    </div>
  );
}

export default function FeedPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Community" title="News & announcements" description="What's happening at the shop. Like, comment and save posts to your hub." />
      <Suspense
        fallback={
          <div className="space-y-5">
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        }
      >
        <Feed searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
