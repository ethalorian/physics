-- Private review drafts are never student grades. Native ledgers remain authoritative.
create table public.review_desk_drafts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id),
  source_key text not null check (length(source_key) between 1 and 240),
  user_id text not null,
  source_version text not null check (length(source_version) between 1 and 240),
  reviewer_email text not null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload)='object' and octet_length(payload::text)<250000),
  state text not null default 'draft' check (state in ('draft','ready','releasing','released','returning','returned')),
  version integer not null default 1 check (version>0),
  request_id uuid not null default gen_random_uuid(),
  completed_actions jsonb not null default '[]'::jsonb,
  lease_until timestamptz,
  updated_at timestamptz not null default now(),
  unique (source_key,user_id,source_version,reviewer_email)
);
create index review_desk_ready on public.review_desk_drafts(course_id,reviewer_email,state);
create table public.review_desk_revisions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id),
  source_key text not null,
  user_id text not null,
  source_version text not null,
  reviewer_email text not null,
  feedback text not null check (length(btrim(feedback)) between 1 and 1600),
  evidence jsonb not null check (jsonb_typeof(evidence)='array' and octet_length(evidence::text)<2000000),
  change_summary text not null default '' check(length(change_summary)<=2000),
  addressed jsonb not null default '[]'::jsonb check(jsonb_typeof(addressed)='array'),
  requested_at timestamptz not null default now(),
  resubmitted_at timestamptz,
  released_at timestamptz,
  unique(source_key,user_id,source_version)
);
create index review_desk_student_revisions on public.review_desk_revisions(user_id,requested_at desc);
create table public.review_desk_suggestions (
  source_key text not null, user_id text not null, source_version text not null,
  status text not null default 'queued' check(status in ('queued','processing','ready','error')),
  result jsonb, error text, lock_id uuid, lease_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key(source_key,user_id,source_version)
);
-- NextAuth authorization and roster scope are checked by the server endpoints.
-- Neither anonymous nor Supabase-authenticated clients can reach these records.
alter table public.review_desk_drafts enable row level security;
alter table public.review_desk_revisions enable row level security;
alter table public.review_desk_suggestions enable row level security;
revoke all on public.review_desk_drafts, public.review_desk_revisions, public.review_desk_suggestions from public,anon,authenticated;
grant select,insert,update,delete on public.review_desk_drafts, public.review_desk_revisions, public.review_desk_suggestions to service_role;
-- A frozen, server-authored release plan supports safe retries after network failures.
alter table public.review_desk_drafts add column release_plan jsonb, add column review_snapshot jsonb;
