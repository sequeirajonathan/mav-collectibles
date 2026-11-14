import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@components/hub/page-header";
import { PostForm } from "@components/admin/post-form";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES } from "@interfaces/roles";
import { getPostForEdit, listGames } from "@lib/data/hub";
import { eventOptions } from "@lib/data/admin-options";
import { uuid } from "@lib/contracts/common";

type Params = Promise<{ id: string }>;

async function Edit({ params }: { params: Params }) {
  const { id } = await params;
  await requirePageRole(CONTENT_ROLES, `/admin/posts/${id}`);
  if (!uuid.safeParse(id).success) notFound();
  const [post, games, events] = await Promise.all([getPostForEdit(id), listGames(), eventOptions()]);
  if (!post) notFound();
  return (
    <>
      <PageHeader title="Edit post" />
      <PostForm
        postId={id}
        games={games}
        events={events}
        initial={{ title: post.title, body: post.body, imageUrl: post.image_url, gameId: post.game_id ?? "", eventId: post.event_id ?? "", pinned: post.pinned, status: post.status }}
      />
    </>
  );
}

export default function EditPostPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-panel" />}>
      <Edit params={params} />
    </Suspense>
  );
}
