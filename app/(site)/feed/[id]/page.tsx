import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPost, listComments } from "@lib/data/hub";
import { withMyReactions } from "@lib/data/viewer";
import { PostCard, PostCardSkeleton } from "@components/hub/post-card";
import { Comments } from "@components/hub/comments";
import { uuid } from "@lib/contracts/common";
import { CONTENT_ROLES } from "@interfaces/roles";

type Params = Promise<{ id: string }>;

async function loadPost(params: Params) {
  const { id } = await params;
  return uuid.safeParse(id).success ? getPost(id) : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const post = await loadPost(params);
  if (!post) return { title: "Post not found" };
  return { title: post.title, description: post.body.slice(0, 160), openGraph: post.imageUrl ? { images: [post.imageUrl] } : undefined };
}

async function PostContent({ params }: { params: Params }) {
  const post = await loadPost(params);
  if (!post) notFound();
  const [{ posts, signedIn, viewerId, role }, comments] = await Promise.all([withMyReactions([post]), listComments(post.id)]);
  return (
    <>
      <PostCard post={posts[0]} signedIn={signedIn} full />
      <Comments
        postId={post.id}
        comments={comments}
        viewerId={viewerId}
        canModerate={role !== null && CONTENT_ROLES.includes(role)}
      />
    </>
  );
}

export default function PostPage({ params }: { params: Params }) {
  return (
    <div className="mx-auto max-w-2xl">
      <nav className="mb-4 text-sm">
        <Link href="/feed" className="text-muted-foreground hover:text-gold">← All posts</Link>
      </nav>
      <Suspense fallback={<PostCardSkeleton />}>
        <PostContent params={params} />
      </Suspense>
    </div>
  );
}
