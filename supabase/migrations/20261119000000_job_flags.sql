-- Switches for the nightly photo job, set in Admin → Site (admins only).
insert into public.feature_flags (id, name, description, enabled, "updatedAt") values
  (gen_random_uuid()::text, 'tcgplayerPhotos', 'Nightly: suggest better photos for card singles from TCGplayer (reviewed in Admin → Photos)', false, now()),
  (gen_random_uuid()::text, 'paidBackgroundRemoval', 'Nightly: use the paid background-removal service when its key is configured', false, now())
on conflict (name) do nothing;
