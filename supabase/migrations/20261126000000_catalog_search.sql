-- The shop's own search index: one row per public product, copied from Square
-- by the sync (lib/catalog/search-index.ts). Square's search can't match inside
-- names like "Monkey.D.Luffy" or tolerate typos; Postgres trigrams can.
create extension if not exists pg_trgm with schema extensions;

create table public.catalog_search (
  item_id text primary key,
  variation_id text not null,
  -- Every variation of the item, for checking live stock.
  variation_ids text[] not null default '{}',
  name text not null,
  description text not null default '',
  sku text not null default '',
  category_id text,
  category_name text,
  image_urls text[] not null default '{}',
  price_amount integer not null default 0,
  price_currency text not null default 'USD',
  sold_out boolean not null default false,
  inventory_count integer,
  -- Lower-case, accent-free name; and the same for name + description.
  name_folded text not null,
  search_text text not null,
  synced_at timestamptz not null default now()
);
create index catalog_search_text_trgm_idx on public.catalog_search using gin (search_text extensions.gin_trgm_ops);
create index catalog_search_name_trgm_idx on public.catalog_search using gin (name_folded extensions.gin_trgm_ops);

-- When the index was last refreshed, and how it went.
create table public.catalog_search_sync (
  id integer primary key default 1 check (id = 1),
  started_at timestamptz,
  finished_at timestamptz,
  item_count integer not null default 0,
  error text
);
insert into public.catalog_search_sync (id) values (1) on conflict (id) do nothing;

-- Read and written only by the server.
alter table public.catalog_search enable row level security;
alter table public.catalog_search_sync enable row level security;
revoke all on public.catalog_search from anon, authenticated;
revoke all on public.catalog_search_sync from anon, authenticated;
