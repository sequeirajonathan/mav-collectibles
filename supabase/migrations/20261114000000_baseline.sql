-- Baseline schema for MAV Collectibles.
-- Supabase migrations are the single source of truth for the database.
-- prisma/schema.prisma mirrors the public tables so the app keeps a typed client;
-- after changing a table here, update schema.prisma to match.

------------------------------------------------------------------------------
-- Application tables (accessed server-side through Prisma)
------------------------------------------------------------------------------
-- CreateSchema

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_banners" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "code" TEXT,
    "backgroundColor" TEXT NOT NULL DEFAULT '#E6B325',
    "textColor" TEXT NOT NULL DEFAULT '#000000',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "featured_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "imageSrc" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "link" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "featured_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "youtube_settings" (
    "id" TEXT NOT NULL DEFAULT '1',
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "autoplay" BOOLEAN NOT NULL DEFAULT true,
    "muted" BOOLEAN NOT NULL DEFAULT true,
    "playlistId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "youtube_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "src" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'application/x-mpegURL',
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "poster" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT 'Live Stream',
    "autoplay" BOOLEAN NOT NULL DEFAULT true,
    "muted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_jobs" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "label_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "claimed_by" TEXT,
    "claimed_at" TIMESTAMP(3),
    "printed_at" TIMESTAMP(3),
    "retries" INTEGER NOT NULL DEFAULT 0,
    "last_tried_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "copies" INTEGER DEFAULT 1,

    CONSTRAINT "print_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'github_release',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_name_key" ON "feature_flags"("name");


------------------------------------------------------------------------------
-- Roles
-- A user's role lives in auth.users.raw_app_meta_data->>'role'. Only the
-- service role can write app_metadata, so users cannot change their own role.
-- It is embedded in every access token, so RLS and the app read it from there.
------------------------------------------------------------------------------
create or replace function public.app_role()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'USER')
$$;

------------------------------------------------------------------------------
-- Profiles: public-facing user details, one row per auth user
------------------------------------------------------------------------------
create table public.profiles (
  -- Same id as auth.users. Kept in sync by the triggers below rather than a
  -- foreign key, so Prisma can introspect the public schema on its own.
  id uuid primary key,
  username text,
  first_name text,
  last_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_.-]{3,30}$')
);

create unique index profiles_username_lower_key on public.profiles (lower(username));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile when a user signs up, from the metadata passed to signUp().
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, first_name, last_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'username', ''),
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

-- Only the auth trigger may run this; it must not be callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_deleted_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$;

revoke execute on function public.handle_deleted_user() from public, anon, authenticated;

create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.handle_deleted_user();

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Staff can read all profiles"
  on public.profiles for select to authenticated
  using ((select public.app_role()) in ('ADMIN', 'STAFF'));

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Users may only edit these columns of their own row.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (username, first_name, last_name, phone) on public.profiles to authenticated;

------------------------------------------------------------------------------
-- Row level security for application tables.
-- Content tables are read and written only by the server (Prisma connects as
-- the database owner), so the Data API gets no access at all.
------------------------------------------------------------------------------
alter table public.feature_flags enable row level security;
alter table public.alert_banners enable row level security;
alter table public.featured_events enable row level security;
alter table public.youtube_settings enable row level security;
alter table public."VideoSettings" enable row level security;
alter table public.installers enable row level security;

revoke all on public.feature_flags, public.alert_banners, public.featured_events,
  public.youtube_settings, public."VideoSettings", public.installers
  from anon, authenticated;

------------------------------------------------------------------------------
-- Print jobs: the admin UI and the print agent read and update these directly
-- (Realtime + supabase-js), so access is granted by role.
------------------------------------------------------------------------------
alter table public.print_jobs alter column id set default gen_random_uuid()::text;
alter table public.print_jobs alter column updated_at set default now();

create trigger print_jobs_set_updated_at
  before update on public.print_jobs
  for each row execute function public.set_updated_at();

alter table public.print_jobs enable row level security;

revoke all on public.print_jobs from anon, authenticated;
grant select, update on public.print_jobs to authenticated;

create policy "Staff and print agents can read print jobs"
  on public.print_jobs for select to authenticated
  using ((select public.app_role()) in ('ADMIN', 'STAFF', 'PRINT_AGENT'));

create policy "Staff and print agents can update print jobs"
  on public.print_jobs for update to authenticated
  using ((select public.app_role()) in ('ADMIN', 'STAFF', 'PRINT_AGENT'))
  with check ((select public.app_role()) in ('ADMIN', 'STAFF', 'PRINT_AGENT'));

alter publication supabase_realtime add table public.print_jobs;

------------------------------------------------------------------------------
-- Storage
------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('images', 'images', true, 5242880, array['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('installers', 'installers', true, 524288000, null)
on conflict (id) do nothing;

-- Public buckets serve files by URL without a select policy.
-- Event images are uploaded from the admin UI by admins.
create policy "Admins can upload images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and (select public.app_role()) = 'ADMIN');

create policy "Admins can update images"
  on storage.objects for update to authenticated
  using (bucket_id = 'images' and (select public.app_role()) = 'ADMIN');

create policy "Admins can delete images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'images' and (select public.app_role()) = 'ADMIN');

-- Installers are uploaded by the server with the service role; no user policies.
