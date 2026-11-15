-- Switch for showing the shop to customers, set in Admin → Site (admins only).
-- Off: only admins and staff can open shop pages; everyone else sees a
-- "coming soon" note and the shop links are hidden.
insert into public.feature_flags (id, name, description, enabled, "updatedAt") values
  (gen_random_uuid()::text, 'shopVisible', 'Show the shop to customers (off: admins and staff only)', false, now())
on conflict (name) do nothing;
