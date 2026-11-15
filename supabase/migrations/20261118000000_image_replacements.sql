-- Better photos for card singles whose Square photo is missing or low
-- resolution, matched from TCGplayer's catalogue (scripts/images/tcgplayer.ts).
-- Nothing is shown to customers until staff approve it in Admin → Photos.
create table public.image_replacements (
  square_item_id text primary key,
  -- The Square photo this stands in for; null when the item had none.
  square_image_id text,
  item_name text not null,
  source text not null check (source in ('tcgplayer')),
  -- The matched product on the source (TCGplayer product id) and its name.
  source_ref text not null,
  source_name text not null,
  source_set text,
  -- Path of the cleaned copy in the product-images bucket.
  path text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index image_replacements_status_idx on public.image_replacements (status, created_at);

alter table public.image_replacements enable row level security;
revoke all on public.image_replacements from anon, authenticated;
