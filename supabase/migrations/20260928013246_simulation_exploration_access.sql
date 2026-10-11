-- This setting controls optional browsing; assigned lesson access stays canonical.
alter table public.courses add column if not exists simulation_exploration_enabled boolean not null default false;
comment on column public.courses.simulation_exploration_enabled is 'Permit optional simulation browsing for enrolled students. Assigned lesson embeds use lesson class windows.';
