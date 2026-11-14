import Link from "next/link";
import { Suspense } from "react";
import { Pin } from "lucide-react";
import { PageHeader, EmptyState } from "@components/ui/page-header";
import { requirePageRole } from "@lib/auth/guard";
import { CONTENT_ROLES } from "@interfaces/roles";
import { listAllPostsForStaff } from "@lib/data/hub";
import { formatShortDate } from "@lib/format";
import { cardVariants } from "@components/ui/card";
import { Skeleton } from "@components/ui/skeleton";
import { LinkButton } from "@components/ui/link-button";

async function List() {
  await requirePageRole(CONTENT_ROLES, "/admin/posts");
  const posts = await listAllPostsForStaff();
  if (posts.length === 0) return <EmptyState title="No posts yet" action={<Link href="/admin/posts/new" className="font-semibold text-gold">Write the first one →</Link>} />;
  return (
    <ul className={cardVariants({ variant: "list" })}>
      {posts.map((p) => (
        <li key={p.id}>
          <Link href={`/admin/posts/${p.id}`} className="flex items-center gap-3 p-4 hover:bg-panel-2">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate font-semibold">{p.pinned && <Pin className="size-3.5 shrink-0 text-gold" />}{p.title}</p>
              <p className="text-sm text-muted-foreground">
                {p.status === "published" && p.publishedAt ? `Published ${formatShortDate(p.publishedAt)}` : "Draft"} · {p.likeCount} likes · {p.commentCount} comments
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function AdminPostsPage() {
  return (
    <>
      <PageHeader title="Posts" actions={<LinkButton href="/admin/posts/new" size="sm">New post</LinkButton>} />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <List />
      </Suspense>
    </>
  );
}
