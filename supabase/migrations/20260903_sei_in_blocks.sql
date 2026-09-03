-- ============================================================================
-- 20260903_sei_in_blocks.sql
--
-- SEI embedded in instructional blocks (design: "SEI in Blocks", 2026-09-03).
-- The language scaffold is DATA ON THE BLOCK (lessons.content_blocks → sei{}),
-- so the schema change is small and additive:
--   1. language_profile — one row per student: WIDA composite, home language,
--      whether the L1 rendering is on by default. Drives the level dial.
--   2. block_responses gains response_mode + scaffolds_used, so the Control
--      Room reads work in context and the Observatory can disaggregate.
--   3. courses.translation_enabled — the math warm-up's per-class toggle
--      generalised to every block (math_translation_enabled stays as is).
-- mastery_records are UNCHANGED — that is the rule, not an omission.
-- ============================================================================

create table if not exists public.language_profile (
  user_id     text primary key,
  wida        smallint check (wida between 1 and 6),
  home_lang   text check (home_lang in ('es','pt','ht','ar','zh','vi','fr')),
  l1_default  boolean not null default false,
  updated_by  text,
  updated_at  timestamptz not null default now()
);
comment on table public.language_profile is 'Per-student language profile: WIDA composite (1–6) and home language. Sets the default scaffold level per block (1–2 full · 3–4 partial · 5–6 bare). Never read by mastery.';
alter table public.language_profile enable row level security;
-- The app talks to this table with the service role (supabaseAdmin); no anon policy on purpose.

alter table public.block_responses add column if not exists response_mode text check (response_mode in ('text','sketch','audio','label','choice'));
alter table public.block_responses add column if not exists scaffolds_used text[] not null default '{}';
comment on column public.block_responses.response_mode is 'How the student answered (text · sketch · audio · label · choice). All modes rate on the same rubric.';
comment on column public.block_responses.scaffolds_used is 'Which scaffolds were ON when they answered (level:full, l1, frame:1, word_bank, visual, talk_first, mode:…). Context for the teacher, a signal for the Observatory, never a score.';

alter table public.courses add column if not exists translation_enabled boolean not null default false;
comment on column public.courses.translation_enabled is 'Per-class: offer the L1 rendering of prompts on every block (the math warm-up toggle, generalised).';
