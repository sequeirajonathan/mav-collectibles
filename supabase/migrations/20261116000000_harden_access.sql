-- Tighten what signed-in users can write directly through the Data API.

-- Profiles: users edit their own row from the browser, so the database enforces
-- the same limits as the app's forms. Avatars are set by the server only.
revoke update (avatar_url) on public.profiles from authenticated;
alter table public.profiles
  add constraint profiles_first_name_length check (char_length(first_name) <= 50),
  add constraint profiles_last_name_length check (char_length(last_name) <= 50),
  add constraint profiles_phone_format check (phone ~ '^[0-9+() .-]{7,20}$');

-- Print jobs: agents and staff only change a job's progress. The label URL,
-- order and copies are set when the job is created (server, admin only), so a
-- leaked agent token can't point the shop printer at another document.
revoke update on public.print_jobs from authenticated;
grant update (status, claimed_by, claimed_at, printed_at, retries, last_tried_at) on public.print_jobs to authenticated;
alter table public.print_jobs
  add constraint print_jobs_label_url_https check (label_url ~ '^https://');

-- Community links (Discord). One row, edited in Admin → Site; server-only like
-- the other site settings.
create table public.community_settings (
  id smallint primary key default 1 check (id = 1),
  discord_url text check (discord_url ~ '^https://(discord\.gg|discord\.com/invite)/[A-Za-z0-9-]+$'),
  updated_at timestamptz not null default now()
);
create trigger community_settings_set_updated_at
  before update on public.community_settings
  for each row execute function public.set_updated_at();
alter table public.community_settings enable row level security;
revoke all on public.community_settings from anon, authenticated;
insert into public.community_settings (discord_url) values ('https://discord.gg/kU2R5Z6Qx');
