-- Applied to PhysicsAPP 2026-09-04 as "block_drafts".
-- In-progress work on a capture block: ONE row per (student, lesson, block), upserted
-- as the student types. Never a record of evidence — block_responses (append-only,
-- explicit Save) stays the record; a draft is the safety net so nothing is lost when
-- a screen changes. No XP, no activity, no progress recompute reads this table.
create table if not exists public.block_drafts (
  user_id uuid not null,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  block_id text not null,
  block_type text,
  response jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id, block_id)
);
create index if not exists idx_block_drafts_lesson on public.block_drafts(lesson_id, user_id);
comment on table public.block_drafts is 'Autosaved in-progress block work, one row per student×lesson×block (upsert). Cleared when the block is explicitly saved. Not evidence.';
