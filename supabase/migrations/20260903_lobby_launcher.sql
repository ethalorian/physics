-- ============================================================================
-- 20260903_lobby_launcher.sql — Lesson system step 4: lobby launcher (L-1, L-2, L-5)
-- Additive. lesson_id / block_id landed with 20260903_lesson_system_schema.sql.
-- ============================================================================
alter table public.lobby_sessions add column if not exists language_balance boolean not null default false;
comment on column public.lobby_sessions.language_balance is 'L-2: spread WIDA levels across groups (snake-deal by band) for a language-heavy task.';
alter table public.lobby_sessions add column if not exists debrief_meta jsonb;
comment on column public.lobby_sessions.debrief_meta is 'L-5 / L-6: { debrief, then } for the projector — the Reporter question and the teacher''s next move, from lesson-plan data.';
