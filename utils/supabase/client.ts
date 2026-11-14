import type { SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@lib/env";

let browserClient: Promise<SupabaseClient> | undefined;

/**
 * Browser Supabase client (session stored in cookies, shared with the server).
 * Loaded on demand so supabase-js (~60 kB) stays out of the initial bundle.
 */
export function getBrowserClient(): Promise<SupabaseClient> {
  browserClient ??= import("@supabase/ssr").then(({ createBrowserClient }) => {
    const env = publicEnv();
    return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  });
  return browserClient;
}
