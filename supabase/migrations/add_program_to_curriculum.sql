-- ===========================================================================
-- Scope the curriculum content layer by PROGRAM.
--
-- Until now units / learning_targets / mastery_tasks were a single flat
-- namespace holding exactly one course (the asteroid physics course). Adding a
-- second course would blend its targets into the physics K/R/S/P growth lines
-- anywhere a query pulls targets unfiltered — today that is
-- src/app/api/analytics/mastery/route.ts, which selects all units and all
-- learning_targets with no scope at all.
--
-- Additive, defaulted, and reversible: every existing row becomes 'physics'.
-- Rollback is three DROP COLUMNs.
-- ===========================================================================

alter table public.units
  add column if not exists program text not null default 'physics';
alter table public.learning_targets
  add column if not exists program text not null default 'physics';
alter table public.mastery_tasks
  add column if not exists program text not null default 'physics';

-- Keep the vocabulary closed, the same way domain is closed on learning_targets.
-- Adding a third program later is a one-line ALTER.
alter table public.units drop constraint if exists units_program_check;
alter table public.units add constraint units_program_check
  check (program in ('physics', 'trades'));

alter table public.learning_targets drop constraint if exists learning_targets_program_check;
alter table public.learning_targets add constraint learning_targets_program_check
  check (program in ('physics', 'trades'));

alter table public.mastery_tasks drop constraint if exists mastery_tasks_program_check;
alter table public.mastery_tasks add constraint mastery_tasks_program_check
  check (program in ('physics', 'trades'));

create index if not exists idx_units_program
  on public.units (program, order_index);
create index if not exists idx_learning_targets_program
  on public.learning_targets (program, unit_id, order_index);
create index if not exists idx_mastery_tasks_program
  on public.mastery_tasks (program, unit_id);

comment on column public.units.program is
  'Which course this unit belongs to. physics = the asteroid course; trades = Trades Physics. Content queries MUST scope by this or the two courses blend.';
comment on column public.learning_targets.program is
  'Denormalised from units.program so growth-tree queries can scope without a join. A target belongs to exactly one program and exactly one unit.';
comment on column public.mastery_tasks.program is
  'Denormalised from units.program. Mastery task results are never blended across programs.';
