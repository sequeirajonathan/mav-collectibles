import { Suspense } from "react";
import { PageHeader } from "@components/hub/page-header";
import { PostForm } from "@components/admin/post-form";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES } from "@interfaces/roles";
import { listGames } from "@lib/data/hub";
import { eventOptions } from "@lib/data/admin-options";

async function Form() {
  await requirePageRole(CONTENT_ROLES, "/admin/posts/new");
  const [games, events] = await Promise.all([listGames(), eventOptions()]);
  return <PostForm games={games} events={events} initial={{ title: "", body: "", imageUrl: null, gameId: "", eventId: "", pinned: false, status: "draft" }} />;
}

export default function NewPostPage() {
  return (
    <>
      <PageHeader title="New post" />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-panel" />}>
        <Form />
      </Suspense>
    </>
  );
}
