import Image from "next/image";
import Link from "next/link";
import { Pin } from "lucide-react";
import type { Post } from "@lib/contracts/hub";
import { formatEventWhen, formatShortDate } from "@lib/format";
import { Card, cardVariants } from "@components/ui/card";
import { Skeleton } from "@components/ui/skeleton";
import { cn } from "@utils";
import { GameBadge } from "./badges";
import { ReactionBar } from "./reaction-bar";

/** A post in the feed. Long bodies are clamped; the detail page shows all of it. */
export function PostCard({ post, signedIn, full = false }: { post: Post; signedIn: boolean; full?: boolean }) {
  const href = `/feed/${post.id}`;
  return (
    <article className={cn(cardVariants(), "overflow-hidden", post.pinned && "border-gold/30")}>
      {post.imageUrl && (
        <Link href={href} className="group relative block aspect-[16/9] overflow-hidden bg-panel-2">
          <Image src={post.imageUrl} alt="" fill sizes="(min-width: 768px) 672px, 100vw" className="object-cover transition-transform duration-500 can-hover:group-hover:scale-[1.03]" />
        </Link>
      )}
      <div className="p-4 fold:p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {post.pinned && (
            <span className="inline-flex items-center gap-1 font-semibold text-gold">
              <Pin className="size-3.5" /> Pinned
            </span>
          )}
          {post.game && <GameBadge game={post.game} />}
          <span>
            {post.authorName}
            {post.publishedAt && ` · ${formatShortDate(post.publishedAt)}`}
          </span>
        </div>
        <h2 className="mt-2 text-lg font-bold leading-snug text-foreground fold:text-xl">
          {full ? post.title : <Link href={href} className="hover:text-gold-light">{post.title}</Link>}
        </h2>
        {post.body && (
          <p className={full ? "mt-2 whitespace-pre-line text-foreground/90" : "mt-2 line-clamp-4 whitespace-pre-line text-sm text-foreground/85 fold:text-base"}>
            {post.body}
          </p>
        )}
        {post.event && (
          <Link
            href={`/events/${post.event.slug}`}
            className={cn(cardVariants({ variant: "accent", radius: "lg" }), "mt-3 flex min-h-11 items-center justify-between gap-3 px-3 py-2 text-sm transition-colors can-hover:hover:border-gold/60")}
          >
            <span className="min-w-0">
              <span className="block truncate font-semibold text-foreground">{post.event.title}</span>
              <span className="text-muted-foreground">{formatEventWhen(post.event.startsAt)}</span>
            </span>
            <span className="shrink-0 font-semibold text-gold">View event →</span>
          </Link>
        )}
        <div className="mt-3 border-t border-line pt-1">
          <ReactionBar
            postId={post.id}
            initial={{ liked: post.likedByMe, saved: post.savedByMe, likeCount: post.likeCount }}
            commentCount={post.commentCount}
            signedIn={signedIn}
            commentsHref={`${href}#comments-heading`}
          />
        </div>
      </div>
    </article>
  );
}

export function PostCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[16/9] rounded-none bg-panel-2" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-32 rounded bg-panel-2" />
        <Skeleton className="h-5 w-3/4 rounded bg-panel-2" />
        <Skeleton className="h-3 w-full rounded bg-panel-2" />
        <Skeleton className="h-3 w-5/6 rounded bg-panel-2" />
      </div>
    </Card>
  );
}
