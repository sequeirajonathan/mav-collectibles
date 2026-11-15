-- Internal staff chat (Admin → Chat) and the browsers staff have asked to be
-- notified on. Photos and GIFs live in a private bucket and are served only
-- through short-lived signed links after a role check.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('staff-chat', 'staff-chat', false, 4194304, array['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
on conflict (id) do nothing;
-- No storage policies: only the server (secret key) reads or writes this bucket.

create table public.staff_messages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null,
  -- Name at the time of posting, so history reads well if the account goes away.
  author_name text not null,
  body text not null default '' check (char_length(body) <= 4000),
  image_path text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint staff_messages_not_empty check (body <> '' or image_path is not null)
);
create index staff_messages_created_idx on public.staff_messages (created_at desc);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  endpoint text not null unique check (endpoint like 'https://%'),
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.staff_messages enable row level security;
alter table public.push_subscriptions enable row level security;
revoke all on public.staff_messages from anon, authenticated;
revoke all on public.push_subscriptions from anon, authenticated;
