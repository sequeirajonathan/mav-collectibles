import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@utils/supabase/server";
import { parseRole, UserRole } from "@interfaces/roles";

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

type Guard = { user: CurrentUser; response?: never } | { user?: never; response: NextResponse };

/**
 * For route handlers: returns the user, or a 401/403 response to send back.
 * The proxy already enforces lib/auth/access.ts; this is defense in depth and
 * gives handlers the caller's identity.
 */
export async function requireUser(roles?: readonly UserRole[]): Promise<Guard> {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (roles && !roles.includes(user.role)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}
