import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Same files Next.js reads locally; real environment variables (CI, Vercel) win.
config({ path: [".env.local", ".env"], quiet: true });

// The database schema is owned by Supabase migrations (supabase/migrations).
// Prisma is used only as a typed query client; do not run `prisma migrate`.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Read leniently so `prisma generate` (postinstall) works without a database configured.
    url: process.env.DATABASE_URL ?? "",
  },
});
