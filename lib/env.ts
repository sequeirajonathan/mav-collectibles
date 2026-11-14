import { z } from "zod";

/**
 * Browser-safe configuration. Everything here is inlined into the client
 * bundle at build time, so it must never contain a secret.
 *
 * Each value is read with a literal `process.env.NEXT_PUBLIC_*` expression,
 * which is what lets Next.js inline it.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  NEXT_PUBLIC_API_URL: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_PLACE_ID: z.string().optional(),
  NEXT_PUBLIC_MAINTENANCE_MODE: z.enum(["true", "false"]).default("false"),
  NEXT_PUBLIC_DEBUG: z.enum(["true", "false"]).default("false"),
});

type PublicEnv = z.infer<typeof publicSchema>;

let cached: PublicEnv | undefined;

export function publicEnv(): PublicEnv {
  if (cached) return cached;
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || undefined,
    NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY || undefined,
    NEXT_PUBLIC_GOOGLE_PLACE_ID: process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || undefined,
    NEXT_PUBLIC_MAINTENANCE_MODE: process.env.NEXT_PUBLIC_MAINTENANCE_MODE || undefined,
    NEXT_PUBLIC_DEBUG: process.env.NEXT_PUBLIC_DEBUG || undefined,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid public environment variables:\n${z.prettifyError(parsed.error)}\nSee .env.example.`
    );
  }
  cached = parsed.data;
  return cached;
}

export const isMaintenanceMode = () => publicEnv().NEXT_PUBLIC_MAINTENANCE_MODE === "true";
