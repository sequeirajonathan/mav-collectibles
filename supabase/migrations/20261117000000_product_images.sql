-- Processed product photos. The originals stay on Square untouched; a nightly
-- job (scripts/images/sync.ts) writes a cleaned copy of each one here and the
-- shop shows the cleaned copy when one exists.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/webp'])
on conflict (id) do nothing;
-- No storage policies: the bucket is public to read by URL and only the
-- server (secret key) can write.

create table public.product_images (
  square_image_id text primary key,
  -- Path inside the product-images bucket.
  path text not null,
  kind text not null check (kind in ('cutout', 'photo')),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  -- The Square URL this was made from; a changed URL means a new photo.
  source_url text not null,
  -- What removed the background: the free local model, the paid service, or
  -- nothing (card scans and photos left as they are).
  background_provider text not null default 'none' check (background_provider in ('none', 'local', 'photoroom')),
  -- Bumped when the processing improves, so old output is redone.
  processor_version integer not null,
  processed_at timestamptz not null default now()
);

alter table public.product_images enable row level security;
revoke all on public.product_images from anon, authenticated;
