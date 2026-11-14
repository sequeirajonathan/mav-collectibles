import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@lib/auth/server";
import type { UserRole } from "@interfaces/roles";

/** For server components: the user, or a redirect (sign-in, or home when the role is wrong). */
export async function requirePageRole(roles: readonly UserRole[], next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  if (!roles.includes(user.role)) redirect("/");
  return user;
}
