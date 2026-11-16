-- Birth month and year, kept on a profile only for adults so the site can
-- fill it in at event sign-up. Under-18s give it per event and it is never
-- copied to their profile. Written only by the server.
alter table public.profiles
  add column birth_month text,
  add constraint profiles_birth_month_format check (birth_month is null or birth_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');
