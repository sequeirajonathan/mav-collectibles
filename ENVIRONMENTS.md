# Environments and release pipeline

MAV Collectibles runs in three environments. The database schema lives in
`supabase/migrations` and flows through all three unchanged.

| | **Development** | **Test** | **Production** |
|---|---|---|---|
| Where | Your machine | GitHub Actions (`ci.yml`) on every PR | Vercel + Supabase `mav-collectables-db` |
| Database & auth | Local Supabase stack in Docker (`npm run db:start`) | Fresh local Supabase stack per run | Supabase project `dxtlhxaxmuxxkdecehqb` |
| Data | `supabase/seed.sql` (content + test accounts) | Same seed | Real data; seed is never pushed |
| Catalog | Fixtures or Square sandbox | Fixtures (`tests/fixtures/catalog.json`) | Square production |
| Deploys | `npm run dev` | — | `deploy.yml` on every push to `main` |

**Vercel preview deployments are off** (`vercel.json`). Pages are prerendered from
the database at build time, and on the free Supabase plan there is no staging
database for previews to use. CI is the test environment: every PR gets a fresh
database, the full test suite, and a downloadable Playwright report with
screenshots of every page at every screen size.

## Daily development

```bash
npm install
npm run db:start          # starts Postgres, Auth, Storage, Realtime, Mailpit; applies migrations + seed
cp .env.example .env.local # fill in the keys printed by db:start
npm run dev
```

- Test accounts (password `password123`): `admin@mav.local`, `staff@mav.local`, `events@mav.local` (EVENT role),
  `printer@mav.local` (print agent), `customer@mav.local`.
- Emails (sign-up confirmation, password reset) appear in Mailpit at
  http://127.0.0.1:54324.
- `npm run db:reset` rebuilds the local database from migrations + seed.
- Tests:
  - `npm test`: unit + component tests (Vitest), no database needed.
  - `npm run test:integration`: SQL-level tests for registration, waitlist and
    concurrency against the local database.
  - `npm run test:e2e`: Playwright against a running app on port 3000
    (`npm run build && npm start` first; run `npm run db:reset` before for clean
    seed data). Projects: `desktop`, `iphone`, `duo-cover`,
    `duo-cover-landscape`, `duo-inner`, `duo-inner-landscape`. Set
    `CHROMIUM_PATH=...` to reuse an installed Chromium.

### Square sandbox with the real catalog

`scripts/square/clone-catalog.ts` copies the shop's catalog (categories, items,
variations, prices, images and stock counts) into a free Square **sandbox**, so
development never touches the live store. The production step only *reads*.

1. Create a free account at developer.squareup.com, open the default
   application and copy its **Sandbox access token**.
2. Run on your machine (tokens stay in your shell, never in the repo):
   ```bash
   SQUARE_PRODUCTION_TOKEN=... npx tsx scripts/square/clone-catalog.ts export   # → square-export/ (gitignored)
   SQUARE_SANDBOX_TOKEN=...    npx tsx scripts/square/clone-catalog.ts import   # → sandbox; writes const/square-sandbox-map.json
   npx tsx scripts/square/clone-catalog.ts fixtures                             # optional: refresh tests/fixtures/catalog.json
   ```
3. In `.env.local`: `CATALOG_SOURCE=square`, `SQUARE_ENVIRONMENT=sandbox`,
   `SQUARE_ACCESS_TOKEN=<sandbox token>`, `SQUARE_LOCATION_IDS=<id printed by import>`.
   Commit `const/square-sandbox-map.json` (category IDs only, no secrets) so the
   app's production category IDs resolve to the sandbox copies.

`import` refuses to run if the sandbox already has items (pass `--force` to add anyway).

### Product photos

The shop's photos on Square are never changed. `scripts/images/sync.ts` makes
a cleaned copy of each one (background removed from products shot on white,
borders trimmed, corners rounded, resized to WebP) in the `product-images`
storage bucket and records it in `product_images`. The shop shows the cleaned
copy when one exists and the Square original otherwise.

- **Production:** the *Product images* workflow runs nightly and processes
  only new or replaced photos. Run it by hand once after the first deploy for
  the full pass (about 7,000 photos; it resumes where it stopped). It needs
  `SQUARE_ACCESS_TOKEN` and `SUPABASE_SECRET_KEY` as secrets in the GitHub
  `production` environment.
- **Locally:** `npx tsx scripts/images/sync.ts --from-export --limit 50` after a
  catalog export, with `.env.local` loaded. The model (~170 MB) downloads once
  to `.cache/`.
- **Improving the processing:** change `scripts/images/process-image.ts` and
  bump `PROCESSOR_VERSION` in `lib/catalog/product-image-config.ts`; the next
  run redoes every photo under new file names.

### Changing the database

1. `npm run db:migration <name>` creates `supabase/migrations/<timestamp>_<name>.sql`.
2. Write the SQL (tables, RLS policies, grants), then `npm run db:reset`.
3. Mirror any table change in `prisma/schema.prisma`, then run
   `npm run db:check-prisma` (CI fails if the two drift) and `npx prisma generate`.
4. Open a PR. CI applies every migration to a clean database; merging to `main`
   applies the new ones to production before the app deploys.

Never edit a migration that has already reached production; add a new one.

## Release pipeline

```
PR ─▶ CI: type-aware lint (no `any`) · typecheck · unit + component tests
         · migrations on a fresh DB · db lint · Prisma drift · integration tests
         · build · end-to-end + responsive tests on 6 screen sizes
merge to main ─▶ CI again ─▶ [production approval, optional] ─▶ supabase db push ─▶ vercel deploy --prod
```

`vercel.json` turns off Vercel's own Git deploys for `main`, so production only
changes through `deploy.yml`, after migrations succeed.

## Variables

Browser-safe values (`NEXT_PUBLIC_*`) are inlined into the client bundle.
Everything else is server-only: `lib/env.server.ts` imports `server-only`, so
the build fails if a client component tries to use it.

| Variable | Kind | Development | (Preview: off) | Vercel Production |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | `http://127.0.0.1:54321` | prod project URL | prod project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | local key | prod publishable key | prod publishable key |
| `NEXT_PUBLIC_SITE_URL` | public | — | — | `https://mavcollectibles.com` (**required**: auth emails link here) |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | public | optional | referrer-restricted key | referrer-restricted key |
| `NEXT_PUBLIC_GOOGLE_PLACE_ID` | public | optional | place ID | place ID |
| `NEXT_PUBLIC_MAINTENANCE_MODE` | public | `false` | `false` | as needed |
| `DATABASE_URL` | **secret** | local DB | — (not set) | pooler connection string |
| `SUPABASE_SECRET_KEY` | **secret** | local key | — (not set) | prod secret key (`sb_secret_…`) |
| `CATALOG_SOURCE` | config | `fixtures` or `square` | — | `square` (default) |
| `SQUARE_ENVIRONMENT` | config | `sandbox` | — | `production` |
| `SQUARE_ACCESS_TOKEN` | **secret** | sandbox token (optional) | — | production token |
| `SQUARE_LOCATION_IDS` | config | sandbox location ID | — | (default: shop location) |
| `SHIPPO_API_KEY` | **secret** | test key | test key | live key |
| `GOOGLE_PLACES_API_KEY` | **secret** | optional | — | API-restricted key |

In Vercel, mark every **secret** row as *Sensitive*.

### Vercel cleanup (one-time)

Delete these Production/Preview/Development variables. They are no longer read:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`,
  `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL`,
  `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (replaced by `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (split into the embed and Places keys above)
- `NEXT_PUBLIC_SQUARE_APPLICATION_ID`, `BLOB_READ_WRITE_TOKEN` (unused)

Then set the remaining ones for **Production** only (previews are off).

## GitHub configuration (one-time)

Settings → Environments → **New environment** `production`:

| Name | Type | Value |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | secret | Personal access token from supabase.com/dashboard/account/tokens |
| `SUPABASE_DB_PASSWORD` | secret | The production database password |
| `VERCEL_TOKEN` | secret | Token from vercel.com/account/tokens |
| `SQUARE_ACCESS_TOKEN` | secret | Square production token (read-only use, for the nightly photo job) |
| `SUPABASE_SECRET_KEY` | secret | Production secret key (`sb_secret_…`), for the nightly photo job |
| `SUPABASE_PROJECT_ID` | variable | `dxtlhxaxmuxxkdecehqb` |
| `VERCEL_ORG_ID` | variable | `team_sMnSSXzNrFvRsmm06ojfFbc4` |
| `VERCEL_PROJECT_ID` | variable | `prj_jl9VG2RKnQIYpJDSj05RfFVAu0Xe` |

Optional: enable **Required reviewers** on the environment to approve each
production release, and protect `main` so the `CI / verify` check must pass.

## Production Supabase setup (one-time)

1. **Reset the existing project.** `mav-collectables-db` still has empty tables
   from an earlier experiment (`cart`, `orders`, `user_profile`, …) that conflict
   with the baseline migration. After confirming they are empty, run:
   ```bash
   npx supabase link --project-ref dxtlhxaxmuxxkdecehqb
   npx supabase db reset --linked   # drops everything, then applies supabase/migrations (no seed)
   ```
2. **Auth → URL configuration:** Site URL `https://mavcollectibles.com`; redirect
   URLs `https://mavcollectibles.com/**`.
3. **Auth → Providers:** keep *Confirm email* on; add Google and Facebook client
   IDs/secrets (their consoles need the callback
   `https://dxtlhxaxmuxxkdecehqb.supabase.co/auth/v1/callback`).
4. **Auth → SMTP:** configure your own SMTP sender. The built-in sender is
   rate-limited to a few emails per hour and isn't meant for production.
5. **Auth → Attack protection:** turn on leaked-password protection. Under
   **Providers → Email**, turn on *Secure password change* (changing a password
   needs a recent sign-in), as in `supabase/config.toml`.
6. **First admin:** sign up on the site, confirm the email, then in the SQL editor:
   ```sql
   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"ADMIN"}'
   where email = 'you@example.com';
   ```
   Sign out and back in. After that, manage roles in the admin **Roles** tab
   (`ADMIN`, `STAFF`, `EVENT`, `PRINT_AGENT`, `USER`).
7. **Print agent account:** create a normal account for the shop PC and set its
   role to `PRINT_AGENT`. See the mav-print README.

## Roles and access

| Role | Can |
|---|---|
| `USER` | RSVP, like/save/comment, apply as a vendor |
| `EVENT` | + manage events, posts, vendors, check-in, results, seasons; moderate comments |
| `STAFF` | + everything EVENT can, plus the print queue |
| `PRINT_AGENT` | The shop PC: print queue only |
| `ADMIN` | Everything, including site settings (feature flags such as `shopLive`), roles and downloads |


Roles live in `app_metadata.role`, which only the server (secret key) can write.
Every page and API route is governed by one table, `lib/auth/access.ts`,
enforced in `proxy.ts`. Unlisted routes require a signed-in user, and unlisted
methods are admin-only. Database access from browsers is limited by RLS
(`supabase/migrations`): content tables are server-only; `print_jobs` is
readable/updatable by `ADMIN`, `STAFF` and `PRINT_AGENT`; users can edit only
their own profile's name, username and phone.
