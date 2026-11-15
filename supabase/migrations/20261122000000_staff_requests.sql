-- Feature requests and bug reports from staff, tracked to completion in
-- Admin → Requests. Staff submit; admins set status, priority and a reply.
create table public.staff_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'feature' check (kind in ('feature', 'bug', 'improvement')),
  title text not null check (char_length(title) between 3 and 120),
  details text not null default '' check (char_length(details) <= 4000),
  -- Where on the site it applies (a page name or link), if any.
  page text check (char_length(page) <= 300),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  status text not null default 'new' check (status in ('new', 'planned', 'in_progress', 'done', 'declined')),
  created_by uuid not null,
  -- Name at the time of asking, so the list still reads well if the account goes away.
  created_by_name text not null,
  -- Reply from whoever is handling it (what was done, or why not).
  response text not null default '' check (char_length(response) <= 2000),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index staff_requests_status_idx on public.staff_requests (status, created_at);

create trigger staff_requests_set_updated_at
  before update on public.staff_requests
  for each row execute function public.set_updated_at();

-- Read and written only by the server, after its own role checks.
alter table public.staff_requests enable row level security;
revoke all on public.staff_requests from anon, authenticated;
