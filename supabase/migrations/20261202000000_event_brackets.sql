-- One elimination bracket per event: the players in seed order and the
-- winners staff have recorded. The bracket's shape is derived from these.
create table public.event_brackets (
  event_id uuid primary key references public.events (id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger event_brackets_set_updated_at
  before update on public.event_brackets
  for each row execute function public.set_updated_at();

-- Read and written only by the server, after its own role checks.
alter table public.event_brackets enable row level security;
revoke all on public.event_brackets from anon, authenticated;
