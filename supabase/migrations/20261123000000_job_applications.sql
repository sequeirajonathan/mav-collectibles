-- Job applications from the public /jobs page, reviewed in Admin → Applications.
-- Résumés live in a private bucket and are only ever served through a
-- short-lived signed link, after the server has checked the reviewer's role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes', 'resumes', false, 4194304,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;
-- No storage policies: only the server (secret key) reads or writes this bucket.

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  position text not null check (char_length(position) between 1 and 80),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) <= 254),
  phone text not null default '' check (char_length(phone) <= 40),
  availability text not null default '' check (char_length(availability) <= 500),
  message text not null default '' check (char_length(message) <= 4000),
  -- Path in the resumes bucket and the applicant's original file name.
  resume_path text,
  resume_name text check (char_length(resume_name) <= 200),
  status text not null default 'new' check (status in ('new', 'reviewing', 'interview', 'hired', 'declined')),
  -- Private notes from whoever is reviewing.
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index job_applications_status_idx on public.job_applications (status, created_at);
create index job_applications_email_idx on public.job_applications (email, created_at);

create trigger job_applications_set_updated_at
  before update on public.job_applications
  for each row execute function public.set_updated_at();

alter table public.job_applications enable row level security;
revoke all on public.job_applications from anon, authenticated;
