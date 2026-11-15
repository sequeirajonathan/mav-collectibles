-- Switch for the Vendors section (directory, vendor pages, table applications),
-- set in Admin → Site. Starts on, so nothing changes until an admin turns it off.
insert into public.feature_flags (id, name, description, enabled, "updatedAt") values
  (gen_random_uuid()::text, 'vendorsVisible', 'Show the Vendors section and table applications', true, now())
on conflict (name) do nothing;
