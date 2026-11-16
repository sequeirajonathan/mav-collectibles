-- Keys for outside services (Google reviews, email, address checks, Discord)
-- that an admin enters in Admin → Site instead of in the hosting settings.
-- Values are encrypted by the app before they are stored, and the table is
-- readable only by the server.
create table public.service_keys (
  name text primary key check (name ~ '^[A-Z][A-Z0-9_]{2,48}$'),
  ciphertext text not null,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

alter table public.service_keys enable row level security;
revoke all on public.service_keys from anon, authenticated;
