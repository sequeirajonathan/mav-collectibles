-- Switch for the "We're hiring" page and links, set in Admin → Site. Starts
-- off: the shop asked to stop taking applications until it is ready to hire.
insert into public.feature_flags (id, name, description, enabled, "updatedAt") values
  (gen_random_uuid()::text, 'hiringOpen', 'Show the hiring page and take job applications', false, now())
on conflict (name) do nothing;
