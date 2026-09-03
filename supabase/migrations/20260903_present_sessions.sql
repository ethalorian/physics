-- ============================================================================
-- 20260903_present_sessions.sql — Lesson system step 5: Present live layer
-- Implements P-3, P-4, P-5 of docs/LESSON_SYSTEM_RULES.md. Additive only.
-- One row per live presentation. Students poll it (P-4 follow state is a
-- presence ping — it is never written to lesson progress).
-- ============================================================================

create table if not exists public.present_sessions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  teacher_id text not null,
  status text not null default 'live' check (status in ('live', 'ended')),
  current_slide integer not null default 0,
  current_section integer not null default 0,
  -- P-3 · live poll controls. poll_block_id names the `question` block that is open.
  poll_block_id text,
  poll_locked boolean not null default false,
  poll_revealed boolean not null default false,
  blackout boolean not null default false,
  timer_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_present_sessions_lesson_live on public.present_sessions(lesson_id) where status = 'live';
create index if not exists idx_present_sessions_teacher on public.present_sessions(teacher_id, created_at desc);
comment on table public.present_sessions is 'P-3/P-4/P-5: the projector''s live state for one lesson. Students poll it for follow mode + open polls. Poll answers are block_responses rows with evidence_source = live_poll.';
comment on column public.present_sessions.current_section is 'P-4: the reader section that matches the current slide (deck.slideMap or 1:1). Follow-mode devices move here.';
