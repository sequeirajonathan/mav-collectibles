import "server-only";
import { z } from "zod";

/**
 * Server-only secrets. Importing this module from a client component fails
 * the build (via `server-only`), so these values can never reach a browser.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  SQUARE_ACCESS_TOKEN: z.string().min(1).optional(),
  SQUARE_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  /** Comma-separated Square location IDs to read inventory from (defaults to the shop's production locations). */
  SQUARE_LOCATION_IDS: z.string().optional(),
  /** "fixtures" serves the catalog from tests/fixtures (CI, offline dev); default reads Square. */
  CATALOG_SOURCE: z.enum(["square", "fixtures"]).default("square"),
  SHIPPO_API_KEY: z.string().min(1).optional(),
  GOOGLE_PLACES_API_KEY: z.string().min(1).optional(),
  // The first admin: see lib/auth/bootstrap.ts.
  BOOTSTRAP_ADMIN_EMAIL: z.email().optional(),
  // Email (Resend). Without a key the site works and simply sends nothing.
  RESEND_API_KEY: z.string().min(1).optional(),
  /** "Name <address>" on a domain verified in Resend. */
  EMAIL_FROM: z.string().min(3).optional(),
  /** Where new job applications are sent. */
  JOBS_NOTIFY_EMAIL: z.email().optional(),
  // Web push for staff notifications. Without both keys nothing is sent.
  VAPID_PRIVATE_KEY: z.string().min(1).optional(),
  /** Shared secret Vercel sends with scheduled jobs (app/api/cron). */
  CRON_SECRET: z.string().min(16).optional(),
});

type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SQUARE_ACCESS_TOKEN: process.env.SQUARE_ACCESS_TOKEN,
    SQUARE_ENVIRONMENT: process.env.SQUARE_ENVIRONMENT || undefined,
    SQUARE_LOCATION_IDS: process.env.SQUARE_LOCATION_IDS || undefined,
    CATALOG_SOURCE: process.env.CATALOG_SOURCE || undefined,
    SHIPPO_API_KEY: process.env.SHIPPO_API_KEY || undefined,
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || undefined,
    BOOTSTRAP_ADMIN_EMAIL: process.env.BOOTSTRAP_ADMIN_EMAIL || undefined,
    RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
    EMAIL_FROM: process.env.EMAIL_FROM || undefined,
    JOBS_NOTIFY_EMAIL: process.env.JOBS_NOTIFY_EMAIL || undefined,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || undefined,
    CRON_SECRET: process.env.CRON_SECRET || undefined,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment variables:\n${z.prettifyError(parsed.error)}\nSee .env.example.`
    );
  }
  cached = parsed.data;
  return cached;
}
