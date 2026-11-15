// Applies pending database migrations before a production build on Vercel, so
// the site never ships ahead of its database. Runs from `npm run build:production`
// (see vercel.json). Does nothing outside Vercel production builds.
//
// Uses the same DATABASE_URL the site uses. The site connects through the
// transaction pooler (port 6543); migrations need a session connection, which
// is the same pooler host on port 5432.
import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log("Not a production build: skipping database migrations.");
  process.exit(0);
}

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("DATABASE_URL is not set. Add the Supabase pooler connection string in Vercel → Environment Variables (Production).");
  process.exit(1);
}

let url;
try {
  url = new URL(raw);
} catch {
  console.error("DATABASE_URL isn't a valid connection string. If the password has special characters, they must be URL-encoded.");
  process.exit(1);
}
if (url.port === "6543") url.port = "5432";
url.search = "";

console.log(`Applying migrations to ${url.hostname}…`);
const result = spawnSync("npx", ["supabase", "db", "push", `--remote=${url.toString()}`, "--yes"], { stdio: "inherit" });
if (result.status !== 0) {
  console.error("Database migrations failed; stopping the build so the site isn't deployed against an out-of-date database.");
  process.exit(result.status ?? 1);
}
