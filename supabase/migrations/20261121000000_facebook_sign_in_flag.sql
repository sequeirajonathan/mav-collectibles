-- Switch for the Facebook sign-in button, set in Admin → Site (admins only).
-- Off until the Facebook app is published (Live).
insert into public.feature_flags (id, name, description, enabled, "updatedAt") values
  (gen_random_uuid()::text, 'facebookSignIn', 'Show the Facebook button on the sign-in and sign-up pages', false, now())
on conflict (name) do nothing;
