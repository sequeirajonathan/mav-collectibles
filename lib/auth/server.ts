import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@utils/supabase/server";
import { parseRole, UserRole } from "@interfaces/roles";
import { prisma } from "@lib/prisma";

export interface CurrentUser {
  id: string;
  email: string | null;
  role: UserRole;
}

/**
 * The signed-in user, from verified access-token claims (no network call when
 * the project uses asymmetric signing keys). Null when signed out.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  const claims = data.claims;
  return {
    id: claims.sub,
    email: (claims.email as string | undefined) ?? null,
    role: parseRole((claims.app_metadata as Record<string, unknown> | undefined)?.role),
  };
}

/**
 * The user's role as stored right now, or null when the account is gone or
 * banned. Access tokens carry the role from when they were issued (up to an
 * hour), so privileged checks use this: a demoted user loses access at once.
 */
export async function currentRole(userId: string): Promise<UserRole | null> {
  const rows = await prisma.$queryRaw<{ role: string | null }[]>`
    select raw_app_meta_data->>'role' as role from auth.users
    where id = ${userId}::uuid and deleted_at is null and (banned_until is null or banned_until < now())`;
  const [row] = rows;
  return row ? parseRole(row.role) : null;
}

/** The signed-in user if their *current* role is in `roles`. */
export async function getUserWithRole(roles: readonly UserRole[]): Promise<{ user: CurrentUser | null; allowed: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { user: null, allowed: false };
  const role = await currentRole(user.id);
  if (!role || !roles.includes(role)) return { user, allowed: false };
  return { user: { ...user, role }, allowed: true };
}

type Guard = { user: CurrentUser; response?: never } | { user?: never; response: NextResponse };

/**
 * For route handlers: returns the user, or a 401/403 response to send back.
 * The proxy already enforces lib/auth/access.ts; this is defense in depth and
 * gives handlers the caller's identity.
 */
export async function requireUser(roles?: readonly UserRole[]): Promise<Guard> {
  if (!roles) {
    const user = await getCurrentUser();
    return user ? { user } : { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const { user, allowed } = await getUserWithRole(roles);
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!allowed) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}
