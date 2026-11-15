import "server-only";
import { getCurrentUser } from "@lib/auth/server";
import { getMyReactions, type PublicPost } from "@lib/data/hub";
import type { Post } from "@lib/contracts/hub";
import type { UserRole } from "@interfaces/roles";

/** Adds the viewer's like/save state to cached public posts. */
export async function withMyReactions(posts: PublicPost[]): Promise<{ posts: Post[]; signedIn: boolean; viewerId: string | null; role: UserRole | null }> {
  const user = await getCurrentUser();
  const mine = user ? await getMyReactions(posts.map((p) => p.id), user.id) : null;
  return {
    signedIn: user !== null,
    viewerId: user?.id ?? null,
    role: user?.role ?? null,
    posts: posts.map((p) => ({ ...p, likedByMe: mine?.liked.has(p.id) ?? false, savedByMe: mine?.saved.has(p.id) ?? false })),
  };
}
