-- Where a learning target is INTRODUCED and where it is REVISITED.
--
-- A target still belongs to exactly ONE unit (learning_targets.unit_id) and its
-- growth line still rolls up per unit — that invariant is untouched. This table
-- records the separate, previously unmodelled fact that some targets recur all
-- year: "read a tape to 1/16" is introduced in trades-1 and used again in every
-- unit after it. Mirrors math_competency_focus exactly.

create table if not exists public.target_focus (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references public.learning_targets(id) on delete cascade,
  unit_id text not null,
  role text not null default 'revisit' check (role in ('introduce', 'revisit')),
  hook text,
  order_index integer not null default 0,
  created_at timestamptz default now(),
  unique (target_id, unit_id)
);

create index if not exists idx_target_focus_unit on public.target_focus (unit_id, order_index);
create index if not exists idx_target_focus_target on public.target_focus (target_id);

alter table public.target_focus enable row level security;

drop policy if exists "Anyone can view target focus" on public.target_focus;
create policy "Anyone can view target focus"
  on public.target_focus for select using (true);

drop policy if exists "Staff manage target focus" on public.target_focus;
create policy "Staff manage target focus"
  on public.target_focus for all using (
    (auth.jwt() ->> 'email') in (
      select unnest(string_to_array(current_setting('app.admin_emails', true), ','))
      union
      select unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
    )
  );

comment on table public.target_focus is
  'Where a learning target is introduced and revisited. A target still has exactly one owning unit on learning_targets.unit_id; this is the recurrence map, not a second home.';
comment on column public.target_focus.role is
  'introduce = the unit that owns it (matches learning_targets.unit_id). revisit = used again, no new growth line.';
comment on column public.target_focus.hook is
  'Optional: the concrete moment it rides in on. Parallels math_competency_focus.physics_hook.';
