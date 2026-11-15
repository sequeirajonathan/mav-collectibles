import type { SupabaseClient } from "@supabase/supabase-js";

/** Reads a feature flag set in Admin → Site. Off when missing or unreadable. */
export async function flagEnabled(supabase: SupabaseClient, name: string): Promise<boolean> {
  const { data, error } = await supabase.from("feature_flags").select("enabled").eq("name", name).maybeSingle<{ enabled: boolean }>();
  if (error) {
    console.warn(`Couldn't read flag ${name}: ${error.message}`);
    return false;
  }
  return data?.enabled === true;
}
