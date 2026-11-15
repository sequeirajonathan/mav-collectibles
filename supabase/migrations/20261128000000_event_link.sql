-- Optional link on an event (for example a Google Form players must fill in),
-- shown as a button on the event page.
alter table public.events
  add column link_url text,
  add column link_label text,
  add constraint events_link_url_http check (link_url is null or link_url ~ '^https?://'),
  add constraint events_link_label_length check (link_label is null or char_length(link_label) <= 40);
