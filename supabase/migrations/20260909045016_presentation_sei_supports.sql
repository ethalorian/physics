-- Presentation-only visibility; individual student language profiles are unchanged.
alter table public.present_session_tools
  add column sei_enabled boolean not null default false;
comment on column public.present_session_tools.sei_enabled is
  'Teacher-controlled visibility of authored SEI scaffolds on the classroom display.';
