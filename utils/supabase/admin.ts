import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@lib/env";
import { serverEnv } from "@lib/env.server";

/**
 * Supabase client with the secret key. Bypasses RLS and can manage users.
 * Server-only; use it only after the caller has been authorized.
 */
export function createAdminClient() {
  return createClient(publicEnv().NEXT_PUBLIC_SUPABASE_URL, serverEnv().SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
