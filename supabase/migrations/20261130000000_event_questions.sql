-- Questions staff ask players when they RSVP to an event (player ID, date of
-- birth, deck list...), and each player's answers. Replaces the separate
-- Google Forms staff used, so the attendee list is the single list.
alter table public.events
  add column questions jsonb not null default '[]'::jsonb,
  add constraint events_questions_is_list check (jsonb_typeof(questions) = 'array');

-- Answers are personal details: read only by the server for the player
-- themselves and for staff (the table already has no client grants).
alter table public.event_registrations
  add column answers jsonb not null default '{}'::jsonb,
  add constraint event_registrations_answers_is_object check (jsonb_typeof(answers) = 'object');
