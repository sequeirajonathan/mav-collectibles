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
  (gen_random_uuid()::text, 'showDirectStreaming', 'Controls visibility of direct streaming video on the homepage', false, now()),
  (gen_random_uuid()::text, 'showGoogleReviews', 'Controls visibility of Google Reviews section on the homepage', true, now())
on conflict (name) do nothing;

insert into public.alert_banners (id, message, code, "backgroundColor", "textColor", enabled, "updatedAt")
values ('1', 'Free shipping on orders $50 and up', 'FREESHIP50', '#E6B325', '#000000', true, now())
on conflict (id) do nothing;

insert into public.featured_events (id, title, date, description, "imageSrc", "imageAlt", link, enabled, "order", "updatedAt")
values (
  '1',
  'Pokémon TCG Championship',
  '2023-12-15T19:00:00Z',
  'Join us for our monthly Pokémon Trading Card Game championship! Great prizes for top players.',
  '/images/pokemon-event.jpg',
  'Pokémon Trading Card Game Championship',
  '/events/pokemon-championship',
  true,
  0,
  now()
)
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
