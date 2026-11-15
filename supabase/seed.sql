-- Local development and CI seed data.
-- Runs on `supabase start` / `supabase db reset` only. It is never applied to
-- hosted projects by `supabase db push`.

------------------------------------------------------------------------------
-- Site content defaults
------------------------------------------------------------------------------
insert into public.feature_flags (id, name, description, enabled, "updatedAt") values
  (gen_random_uuid()::text, 'showAlertBanner', 'Controls visibility of the alert banner at the top of the site', true, now()),
  (gen_random_uuid()::text, 'showYouTubeVideo', 'Controls visibility of the YouTube video on the homepage', true, now()),
  (gen_random_uuid()::text, 'showVideoPlayer', 'Controls visibility of the direct streaming video player on the homepage', false, now()),
  (gen_random_uuid()::text, 'showGoogleReviews', 'Controls visibility of Google Reviews section on the homepage', true, now())
on conflict (name) do nothing;

insert into public.alert_banners (id, message, code, "backgroundColor", "textColor", enabled, "updatedAt")
values ('1', 'Pokémon League every Friday at 6 PM. RSVP to save your seat!', null, '#E6B325', '#000000', true, now())
on conflict (id) do nothing;


insert into public.youtube_settings (id, "videoId", title, autoplay, muted, "playlistId", "updatedAt")
values ('1', 'V8D_ELNVRko', 'Featured Video', true, true, '', now())
on conflict (id) do nothing;

insert into public."VideoSettings" (id, src, type, "isLive", poster, title, autoplay, muted, "updatedAt")
values (1, 'https://example.com/stream.m3u8', 'application/x-mpegURL', false, '/images/video-poster.jpg', 'Featured Video', true, true, now())
on conflict (id) do nothing;

------------------------------------------------------------------------------
-- Local test accounts (password for all: password123)
------------------------------------------------------------------------------
do $$
declare
  account record;
  new_id uuid;
begin
  for account in
    select * from (values
      ('admin@mav.local', 'admin', 'ADMIN'),
      ('staff@mav.local', 'staff', 'STAFF'),
      ('events@mav.local', 'events', 'EVENT'),
      ('printer@mav.local', 'printer', 'PRINT_AGENT'),
      ('customer@mav.local', 'customer', 'USER')
    ) as t(email, username, role)
  loop
    new_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
      account.email, extensions.crypt('password123', extensions.gen_salt('bf')), now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', account.role),
      jsonb_build_object('username', account.username, 'phone', '+15555550100'),
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), new_id, new_id::text,
      jsonb_build_object('sub', new_id::text, 'email', account.email, 'email_verified', true),
      'email', now(), now(), now()
    );
  end loop;
end $$;

------------------------------------------------------------------------------
-- Event hub sample data (dates are relative so it never goes stale)
------------------------------------------------------------------------------
do $$
declare
  admin_id uuid := (select id from auth.users where email = 'admin@mav.local');
  customer_id uuid := (select id from auth.users where email = 'customer@mav.local');
  staff_id uuid := (select id from auth.users where email = 'staff@mav.local');
  league uuid;
  prerelease uuid;
  vendor_day uuid;
  past uuid;
  post1 uuid;
  vendor1 uuid;
  -- Friday 6 PM store time this week (a wall-clock time AT TIME ZONE gives a timestamptz).
  next_friday timestamptz := (date_trunc('week', now() at time zone 'America/Chicago') + interval '4 days 18 hours') at time zone 'America/Chicago';
begin
  if next_friday < now() then next_friday := next_friday + interval '7 days'; end if;

  insert into public.events (slug, title, summary, description, kind, game_id, format, starts_at, ends_at, capacity, entry_fee_cents, status, featured, created_by)
  values ('pokemon-league-night', 'Pokémon League Night', 'Weekly Standard league. All skill levels welcome.',
          E'Bring a Standard deck. Swiss rounds, best of one.\nPrizes: booster packs for the top 4 and a promo for every player.',
          'league', 'pokemon', 'Standard', next_friday, next_friday + interval '3 hours', 32, 500, 'published', true, admin_id)
  returning id into league;

  insert into public.events (slug, title, summary, kind, game_id, format, starts_at, capacity, entry_fee_cents, status, created_by)
  values ('pokemon-prerelease', 'Pokémon Prerelease', 'Build a deck from 4 boosters and play the new set first.', 'prerelease', 'pokemon', 'Sealed', now() + interval '14 days', 2, 3000, 'published', admin_id)
  returning id into prerelease;

  insert into public.events (slug, title, summary, kind, game_id, starts_at, ends_at, status, created_by)
  values ('vendor-day', 'Vendor & Trade Day', 'Local vendors bring singles, slabs and vintage. Bring your binder.', 'vendor_day', 'pokemon', now() + interval '21 days', now() + interval '21 days 6 hours', 'published', admin_id)
  returning id into vendor_day;

  insert into public.events (slug, title, kind, game_id, format, starts_at, status, created_by)
  values ('one-piece-casual', 'One Piece Casual Night', 'casual', 'one-piece', 'Casual', now() + interval '5 days', 'published', admin_id);

  insert into public.events (slug, title, kind, game_id, starts_at, status, created_by)
  values ('draft-event', 'Draft event (hidden)', 'tournament', 'magic', now() + interval '30 days', 'draft', admin_id);

  insert into public.events (slug, title, summary, kind, game_id, format, starts_at, status, created_by)
  values ('pokemon-cup-last-month', 'Pokémon Cup', 'Monthly Standard tournament.', 'tournament', 'pokemon', 'Standard', now() - interval '20 days', 'completed', admin_id)
  returning id into past;

  insert into public.event_registrations (event_id, user_id, status) values (league, customer_id, 'registered'), (league, staff_id, 'registered');
  insert into public.event_registrations (event_id, user_id, status) values (prerelease, staff_id, 'registered'), (prerelease, admin_id, 'registered');

  insert into public.seasons (game_id, name, starts_on, ends_on)
  values ('pokemon', 'Current season', (now() - interval '60 days')::date, (now() + interval '60 days')::date);

  insert into public.tournament_results (event_id, user_id, player_name, placement, wins, losses, draws, points, deck) values
    (past, customer_id, 'customer', 1, 4, 0, 0, 10, 'Charizard ex'),
    (past, null, 'Ash K.', 2, 3, 1, 0, 8, 'Gardevoir ex'),
    (past, staff_id, 'staff', 3, 2, 2, 0, 6, 'Dragapult ex'),
    (past, null, 'Misty W.', 4, 2, 2, 0, 6, 'Lost Box');

  insert into public.posts (title, body, game_id, event_id, pinned, status, published_at, author_id)
  values ('League night is back every Friday', E'Pokémon League runs every Friday at 6 PM.\nRSVP to save your seat; we cap it at 32 players.', 'pokemon', league, true, 'published', now() - interval '2 days', admin_id)
  returning id into post1;
  insert into public.posts (title, body, game_id, status, published_at, author_id)
  values ('New arrivals this week', 'Fresh booster boxes and ETBs just hit the shelves. Come see us!', 'pokemon', 'published', now() - interval '1 day', staff_id);
  insert into public.posts (title, body, status, author_id) values ('Unpublished draft', 'Only staff can see this.', 'draft', admin_id);

  insert into public.post_likes (post_id, user_id) values (post1, customer_id), (post1, staff_id);
  insert into public.post_comments (post_id, user_id, body) values (post1, customer_id, 'See everyone Friday!');

  insert into public.vendors (slug, name, bio, specialties, games, instagram, contact_email, status)
  values ('lone-star-slabs', 'Lone Star Slabs', 'Graded Pokémon and vintage WOTC singles.', 'PSA slabs, vintage holos', array['pokemon'], 'lonestarslabs', 'hello@example.com', 'approved')
  returning id into vendor1;
  insert into public.vendors (slug, name, specialties, games, contact_email, status)
  values ('pending-vendor', 'Pending Vendor Co', 'Sealed Japanese product', array['pokemon','one-piece'], 'pending@example.com', 'pending');
  insert into public.event_vendors (event_id, vendor_id, status, table_label) values (vendor_day, vendor1, 'confirmed', '3');
end $$;
