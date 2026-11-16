-- Files players attach when they sign up for an event (a deck list as a PDF
-- or photo). Private: uploaded through a one-time link the server issues to
-- the signed-in player, and opened by staff through a short-lived link.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-uploads', 'event-uploads', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;
-- No storage policies: only the server (secret key) reads this bucket.
