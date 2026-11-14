import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@lib/env";

let browserClient: SupabaseClient | undefined;

/** Browser Supabase client (session stored in cookies, shared with the server). */
export function createClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const env = publicEnv();
  browserClient = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
  return browserClient;
}
