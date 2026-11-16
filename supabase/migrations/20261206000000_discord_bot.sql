-- The shop's Discord bot: where it posts, what it announces, and which
-- Discord accounts players have connected to their site accounts.
create table public.discord_settings (
  id integer primary key default 1 check (id = 1),
  -- From the Discord Developer Portal (General Information). Neither is secret.
  application_id text check (application_id ~ '^[0-9]{15,22}$'),
  public_key text check (public_key ~ '^[0-9a-f]{64}$'),
  -- The shop's server, and the channels the bot posts in.
  guild_id text check (guild_id ~ '^[0-9]{15,22}$'),
  announce_channel_id text check (announce_channel_id ~ '^[0-9]{15,22}$'),
  staff_channel_id text check (staff_channel_id ~ '^[0-9]{15,22}$'),
  announce_events boolean not null default true,
  announce_reminders boolean not null default true,
  announce_results boolean not null default true,
  staff_alerts boolean not null default true,
  commands_registered_at timestamptz,
  updated_at timestamptz not null default now()
);
insert into public.discord_settings (id) values (1) on conflict do nothing;

alter table public.discord_settings enable row level security;
revoke all on public.discord_settings from anon, authenticated;

-- A player's connected Discord account (set through the bot's /link command).
alter table public.profiles
  add column discord_user_id text unique check (discord_user_id ~ '^[0-9]{15,22}$'),
  add column discord_username text check (char_length(discord_username) <= 64);

-- So each event is announced once, reminded once, and its champion posted once.
alter table public.events
  add column discord_announced_at timestamptz,
  add column discord_reminded_at timestamptz,
  add column discord_champion_at timestamptz;
