/**
 * Browser-safe configuration. Everything here is inlined into the client
 * bundle at build time, so it must never contain a secret.
 *
 * Each value is read with a literal `process.env.NEXT_PUBLIC_*` expression,
 * which is what lets Next.js inline it. Validation is hand-written (no zod)
 * because this module ships to every page.
 */
interface PublicEnv {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_API_URL?: string;
  NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY?: string;
  NEXT_PUBLIC_GOOGLE_PLACE_ID?: string;
  NEXT_PUBLIC_MAINTENANCE_MODE: "true" | "false";
  NEXT_PUBLIC_DEBUG: "true" | "false";
}

const optional = (v: string | undefined) => (v ? v : undefined);
const bool = (v: string | undefined): "true" | "false" => (v === "true" ? "true" : "false");

function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

let cached: PublicEnv | undefined;

export function publicEnv(): PublicEnv {
  if (cached) return cached;
  const env: PublicEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    NEXT_PUBLIC_SITE_URL: optional(process.env.NEXT_PUBLIC_SITE_URL),
    NEXT_PUBLIC_API_URL: optional(process.env.NEXT_PUBLIC_API_URL),
    NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY: optional(process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY),
    NEXT_PUBLIC_GOOGLE_PLACE_ID: optional(process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID),
    NEXT_PUBLIC_MAINTENANCE_MODE: bool(process.env.NEXT_PUBLIC_MAINTENANCE_MODE),
    NEXT_PUBLIC_DEBUG: bool(process.env.NEXT_PUBLIC_DEBUG),
  };

  const problems: string[] = [];
  if (!isUrl(env.NEXT_PUBLIC_SUPABASE_URL)) problems.push("NEXT_PUBLIC_SUPABASE_URL must be a URL");
  if (!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) problems.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required");
  if (env.NEXT_PUBLIC_SITE_URL && !isUrl(env.NEXT_PUBLIC_SITE_URL)) problems.push("NEXT_PUBLIC_SITE_URL must be a URL");
  if (problems.length) {
    throw new Error(`Invalid public environment variables:\n- ${problems.join("\n- ")}\nSee .env.example.`);
  }
  cached = env;
  return cached;
}

export const isMaintenanceMode = () => publicEnv().NEXT_PUBLIC_MAINTENANCE_MODE === "true";
