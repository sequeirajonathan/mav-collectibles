-- When a staff request is finished the team is told about it once (a Team chat
-- message, a notification, and an email to whoever asked). `notified_at`
-- records that the alert went out, however the request was marked done.
alter table public.staff_requests add column notified_at timestamptz;
create index staff_requests_unnotified_idx on public.staff_requests (completed_at) where status = 'done' and notified_at is null;
