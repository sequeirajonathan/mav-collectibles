-- Event hub: games, events + registrations, posts + likes/saves/comments,
-- vendors + vendor days, tournament results + seasons.
--
-- All of these are read and written by the server through Prisma (which
-- connects as the database owner), with authorization done in server actions.
-- The Data API therefore gets no access to them.

------------------------------------------------------------------------------
-- Games
------------------------------------------------------------------------------
create table public.games (
  id text primary key,                      -- slug, e.g. 'pokemon'
  name text not null,
  short_name text not null,
  color text not null default '#E6B325',    -- accent used on badges
  sort_order integer not null default 100,
  active boolean not null default true
);

insert into public.games (id, name, short_name, color, sort_order) values
  ('pokemon', 'Pokémon TCG', 'Pokémon', '#FFCB05', 1),
  ('magic', 'Magic: The Gathering', 'Magic', '#F97316', 2),
  ('one-piece', 'One Piece Card Game', 'One Piece', '#DC2626', 3),
  ('lorcana', 'Disney Lorcana', 'Lorcana', '#7C3AED', 4),
  ('yugioh', 'Yu-Gi-Oh! TCG', 'Yu-Gi-Oh!', '#B45309', 5),
  ('riftbound', 'Riftbound', 'Riftbound', '#0EA5E9', 6),
  ('gundam', 'Gundam Card Game', 'Gundam', '#2563EB', 7),
  ('dragon-ball', 'Dragon Ball Super Fusion World', 'Dragon Ball', '#F59E0B', 8),
  ('star-wars', 'Star Wars: Unlimited', 'Star Wars', '#EAB308', 9),
  ('digimon', 'Digimon Card Game', 'Digimon', '#06B6D4', 10),
  ('union-arena', 'Union Arena', 'Union Arena', '#DB2777', 11),
  ('weiss', 'Weiß Schwarz', 'Weiß Schwarz', '#64748B', 12);

------------------------------------------------------------------------------
-- Events
------------------------------------------------------------------------------
create type public.event_kind as enum (
  'tournament', 'league', 'prerelease', 'release', 'casual', 'trade_night', 'vendor_day', 'special'
);
create type public.event_status as enum ('draft', 'published', 'cancelled', 'completed');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  description text not null default '',
  kind public.event_kind not null default 'tournament',
  game_id text references public.games (id) on delete set null,
  format text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text not null default 'MAV Collectibles',
  cover_image_url text,
  capacity integer check (capacity is null or capacity > 0),
  entry_fee_cents integer check (entry_fee_cents is null or entry_fee_cents >= 0),
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  status public.event_status not null default 'draft',
  featured boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint events_ends_after_start check (ends_at is null or ends_at >= starts_at)
);

create index events_status_starts_at_idx on public.events (status, starts_at);
create index events_game_idx on public.events (game_id);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create type public.registration_status as enum ('registered', 'waitlisted', 'checked_in', 'cancelled');

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null,
  status public.registration_status not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  checked_in_at timestamptz,
  unique (event_id, user_id)
);

create index event_registrations_event_status_idx on public.event_registrations (event_id, status, created_at);
create index event_registrations_user_idx on public.event_registrations (user_id);

create trigger event_registrations_set_updated_at
  before update on public.event_registrations
  for each row execute function public.set_updated_at();

-- Registers a user atomically: takes a seat if one is free, otherwise joins
-- the waitlist. Re-registering after cancelling reuses the row.
create or replace function public.register_for_event(p_event_id uuid, p_user_id uuid)
returns public.registration_status
language plpgsql
set search_path = ''
as $$
declare
  ev public.events;
  taken integer;
  result public.registration_status;
begin
  select * into ev from public.events where id = p_event_id for update;
  if not found or ev.status <> 'published' then
    raise exception 'event_not_open' using errcode = 'P0001';
  end if;
  if ev.registration_opens_at is not null and now() < ev.registration_opens_at then
    raise exception 'registration_not_open' using errcode = 'P0001';
  end if;
  if now() > coalesce(ev.registration_closes_at, ev.starts_at) then
    raise exception 'registration_closed' using errcode = 'P0001';
  end if;

  select status into result from public.event_registrations
    where event_id = p_event_id and user_id = p_user_id;
  if found and result <> 'cancelled' then
    return result;
  end if;

  select count(*) into taken from public.event_registrations
    where event_id = p_event_id and status in ('registered', 'checked_in');
  result := case when ev.capacity is null or taken < ev.capacity then 'registered' else 'waitlisted' end;

  insert into public.event_registrations (event_id, user_id, status)
  values (p_event_id, p_user_id, result)
  on conflict (event_id, user_id)
  do update set status = excluded.status, created_at = now(), checked_in_at = null;

  return result;
end;
$$;

-- Cancels a registration and promotes the earliest waitlisted player.
create or replace function public.cancel_event_registration(p_event_id uuid, p_user_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  previous public.registration_status;
  next_id uuid;
begin
  perform 1 from public.events where id = p_event_id for update;

  update public.event_registrations set status = 'cancelled'
    where event_id = p_event_id and user_id = p_user_id and status <> 'cancelled'
    returning status into previous;

  select id into next_id from public.event_registrations
    where event_id = p_event_id and status = 'waitlisted'
    order by created_at
    limit 1;

  if next_id is not null and (
    select capacity is null or capacity > (
      select count(*) from public.event_registrations
      where event_id = p_event_id and status in ('registered', 'checked_in')
    ) from public.events where id = p_event_id
  ) then
    update public.event_registrations set status = 'registered' where id = next_id;
  end if;
end;
$$;

revoke execute on function public.register_for_event(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.cancel_event_registration(uuid, uuid) from public, anon, authenticated;

------------------------------------------------------------------------------
-- Posts
------------------------------------------------------------------------------
create type public.post_status as enum ('draft', 'published');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  image_url text,
  game_id text references public.games (id) on delete set null,
  event_id uuid references public.events (id) on delete set null,
  pinned boolean not null default false,
  status public.post_status not null default 'draft',
  published_at timestamptz,
  author_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_feed_idx on public.posts (status, pinned desc, published_at desc);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.post_saves (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index post_saves_user_idx on public.post_saves (user_id, created_at desc);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid
);
create index post_comments_post_idx on public.post_comments (post_id, created_at);

------------------------------------------------------------------------------
-- Vendors
------------------------------------------------------------------------------
create type public.vendor_status as enum ('pending', 'approved', 'rejected');

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  bio text not null default '',
  specialties text not null default '',
  games text[] not null default '{}',
  logo_url text,
  instagram text,
  website text,
  contact_email text,                 -- private: shown to staff only
  owner_user_id uuid,
  status public.vendor_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendors_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
create unique index vendors_owner_idx on public.vendors (owner_user_id) where owner_user_id is not null;

create trigger vendors_set_updated_at
  before update on public.vendors
  for each row execute function public.set_updated_at();

create type public.vendor_table_status as enum ('requested', 'confirmed', 'declined');

create table public.event_vendors (
  event_id uuid not null references public.events (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  status public.vendor_table_status not null default 'requested',
  table_label text,
  message text,
  created_at timestamptz not null default now(),
  primary key (event_id, vendor_id)
);

------------------------------------------------------------------------------
-- Tournaments
------------------------------------------------------------------------------
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games (id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  constraint seasons_dates check (ends_on >= starts_on)
);

create table public.tournament_results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid,                        -- linked account, when the player has one
  player_name text not null,
  placement integer not null check (placement > 0),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  draws integer not null default 0 check (draws >= 0),
  points integer not null default 0 check (points >= 0),
  deck text,
  created_at timestamptz not null default now()
);
create unique index tournament_results_event_player_idx on public.tournament_results (event_id, lower(player_name));
create index tournament_results_user_idx on public.tournament_results (user_id);

------------------------------------------------------------------------------
-- Profiles: public display fields for comments and standings
------------------------------------------------------------------------------
alter table public.profiles add column avatar_url text;
alter table public.profiles add column favorite_game_id text references public.games (id) on delete set null;
grant update (avatar_url, favorite_game_id) on public.profiles to authenticated;

------------------------------------------------------------------------------
-- The old single-purpose featured_events table is replaced by events.
------------------------------------------------------------------------------
drop table public.featured_events;

------------------------------------------------------------------------------
-- Lock down: server-only tables
------------------------------------------------------------------------------
alter table public.games enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_saves enable row level security;
alter table public.post_comments enable row level security;
alter table public.vendors enable row level security;
alter table public.event_vendors enable row level security;
alter table public.seasons enable row level security;
alter table public.tournament_results enable row level security;

revoke all on public.games, public.events, public.event_registrations, public.posts,
  public.post_likes, public.post_saves, public.post_comments, public.vendors,
  public.event_vendors, public.seasons, public.tournament_results
  from anon, authenticated;

------------------------------------------------------------------------------
-- Staff can upload event, post and vendor images (not only admins).
------------------------------------------------------------------------------
drop policy "Admins can upload images" on storage.objects;
drop policy "Admins can update images" on storage.objects;
drop policy "Admins can delete images" on storage.objects;

create policy "Staff can upload images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and (select public.app_role()) in ('ADMIN', 'STAFF', 'EVENT'));

create policy "Staff can update images"
  on storage.objects for update to authenticated
  using (bucket_id = 'images' and (select public.app_role()) in ('ADMIN', 'STAFF', 'EVENT'));

create policy "Staff can delete images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'images' and (select public.app_role()) in ('ADMIN', 'STAFF', 'EVENT'));

------------------------------------------------------------------------------
-- Default feature flags (production gets these too; existing values are kept)
------------------------------------------------------------------------------
insert into public.feature_flags (id, name, description, enabled, "updatedAt") values
  (gen_random_uuid()::text, 'shopLive', 'Online shop is live: show cart and purchasing. Off = in-store showcase only.', false, now()),
  (gen_random_uuid()::text, 'showAlertBanner', 'Show the alert banner at the top of the site', true, now()),
  (gen_random_uuid()::text, 'showYouTubeVideo', 'Show the featured YouTube video on the homepage', false, now()),
  (gen_random_uuid()::text, 'showVideoPlayer', 'Show the live stream player on the homepage', false, now()),
  (gen_random_uuid()::text, 'showGoogleReviews', 'Show Google Reviews on the homepage', true, now())
on conflict (name) do nothing;
delete from public.feature_flags where name = 'showDirectStreaming';
