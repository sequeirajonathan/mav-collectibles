import "server-only";
import { redirect } from "next/navigation";
import { getUserWithRole, type CurrentUser } from "@lib/auth/server";
import type { UserRole } from "@interfaces/roles";

/** For server components (checks the role as stored now, not the token's copy): the user, or a redirect (sign-in, or home when the role is wrong). */
export async function requirePageRole(roles: readonly UserRole[], next: string): Promise<CurrentUser> {
  const { user, allowed } = await getUserWithRole(roles);
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  if (!allowed) redirect("/");
  return user;
}
