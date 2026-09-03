-- ============================================================================
-- 20260903_lesson_system_schema.sql — Lesson system step 1: schema + flags
-- Implements A-2, A-5, B-3, E-1, E-2, MC-2 of docs/LESSON_SYSTEM_RULES.md.
-- Additive only. mastery_records untouched (M-1).
-- ============================================================================

-- A-5 · per-class feature flags. Default = the new experience for every class
-- (decided with Craig 2026-09-03: "in effect for all classes"); a class can flip
-- back to 'classic' mid-unit with zero data migration.
alter table public.courses add column if not exists lesson_experience text not null default 'stepped';
alter table public.courses drop constraint if exists courses_lesson_experience_check;
alter table public.courses add constraint courses_lesson_experience_check check (lesson_experience in ('classic', 'stepped'));
alter table public.courses add column if not exists present_live_layer boolean not null default true;
alter table public.courses add column if not exists lobby_launcher boolean not null default true;
-- B-3 · gating is a class setting that block.gate opts into.
alter table public.courses add column if not exists gate_checkpoints boolean not null default true;
comment on column public.courses.lesson_experience is 'A-5: which student reader renders the BlockDocument — classic (scroll) or stepped (sections, gates, help drawer, Done screen). Same document either way.';
comment on column public.courses.gate_checkpoints is 'B-3: when true, blocks with gate:true block advancing until complete (and correct if auto-checkable); when false, gates degrade to the soft nudge.';

-- E-1 · evidence columns on block_responses (response_mode + scaffolds_used landed 2026-09-03 with SEI).
alter table public.block_responses add column if not exists target_id uuid references public.learning_targets(id) on delete set null;
alter table public.block_responses add column if not exists evidence_source text;
alter table public.block_responses drop constraint if exists block_responses_evidence_source_check;
alter table public.block_responses add constraint block_responses_evidence_source_check
  check (evidence_source is null or evidence_source in ('lesson_checkpoint', 'exit_ticket', 'lobby', 'live_poll', 'warmup', 'practice', 'transfer'));
alter table public.block_responses add column if not exists confidence text;
alter table public.block_responses drop constraint if exists block_responses_confidence_check;
alter table public.block_responses add constraint block_responses_confidence_check check (confidence is null or confidence in ('sure', 'unsure'));
alter table public.block_responses add column if not exists role text;
create index if not exists idx_block_responses_target on public.block_responses(target_id);
create index if not exists idx_block_responses_source on public.block_responses(evidence_source);
comment on column public.block_responses.evidence_source is 'E-2: closed vocabulary, kept in src/lib/evidence.ts — lesson_checkpoint · exit_ticket · lobby · live_poll · warmup · practice · transfer.';
comment on column public.block_responses.confidence is 'MC-5: one-tap confidence on a checkpoint. Wrong + sure is the misconception flag.';
comment on column public.block_responses.role is 'E-4 / L-3: the lobby discourse role the student held when the group artifact was written.';

-- L-1 · a lobby session knows which lesson / block / target it was launched from.
alter table public.lobby_sessions add column if not exists lesson_id uuid references public.lessons(id) on delete set null;
alter table public.lobby_sessions add column if not exists block_id text;

-- MC-2 · calibration: latest self-rating vs latest teacher rating per (student, target).
-- Self-ratings live in block_responses (MC-1): marzano rows carry a numeric response and
-- a target_id (new saves); self_assessment rows carry {targetId: level}. Computed, never stored.
create or replace view public.mastery_calibration as
with self_marzano as (
  select br.user_id::text as user_id, br.target_id, (br.response)::text::int as self_level, br.created_at
  from public.block_responses br
  where br.block_type = 'marzano' and br.target_id is not null and jsonb_typeof(br.response) = 'number'
),
self_assess as (
  select br.user_id::text as user_id, lt.id as target_id, (kv.value)::text::int as self_level, br.created_at
  from public.block_responses br
  cross join lateral jsonb_each(br.response) as kv
  join public.learning_targets lt on lt.slug = kv.key or lt.id::text = kv.key
  where br.block_type = 'self_assessment' and jsonb_typeof(br.response) = 'object' and jsonb_typeof(kv.value) = 'number'
),
self_all as (select * from self_marzano union all select * from self_assess),
self_latest as (
  select distinct on (user_id, target_id) user_id, target_id, self_level, created_at as self_at
  from self_all order by user_id, target_id, created_at desc
),
teacher_latest as (
  select distinct on (user_id, target_id) user_id, target_id, level as teacher_level, observed_at as teacher_at
  from public.mastery_records order by user_id, target_id, observed_at desc
)
select s.user_id, s.target_id, s.self_level, s.self_at, t.teacher_level, t.teacher_at,
       case when t.teacher_level is null then null else s.self_level - t.teacher_level end as delta
from self_latest s
left join teacher_latest t on t.user_id::text = s.user_id and t.target_id = s.target_id;
comment on view public.mastery_calibration is 'MC-2: latest self-rating vs latest teacher rating per (student, target). delta = self − teacher ∈ {−2..2}; null until a teacher rating exists (MC-3).';
