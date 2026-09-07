-- A-2 additive; M-1 no mastery writes; O-2 staff-only tools.
create table public.present_pulses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.present_sessions(id) on delete cascade,
  kind text not null check (kind in ('readiness', 'confidence')),
  anonymous boolean not null default false,
  salt uuid not null default gen_random_uuid(),
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);
create unique index present_one_open_pulse on public.present_pulses(session_id) where status = 'open';
create index present_pulses_session_time on public.present_pulses(session_id, created_at desc);
create table public.present_pulse_responses (
  pulse_id uuid not null references public.present_pulses(id) on delete cascade,
  respondent_key text not null,
  user_id text,
  choice smallint not null check (choice between 0 and 2),
  primary key (pulse_id, respondent_key)
);
create table public.present_help_requests (
  session_id uuid not null references public.present_sessions(id) on delete cascade,
  user_id text not null,
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  primary key (session_id,user_id)
);
create table public.present_teacher_marks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.present_sessions(id) on delete cascade,
  teacher_id text not null,
  kind text not null check (kind in ('bookmark','called','skipped')),
  student_id text,
  slide integer not null check (slide >= 0),
  note text not null check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index present_marks_session_time on public.present_teacher_marks(session_id,created_at desc);
create unique index present_picker_no_repeat on public.present_teacher_marks(session_id,student_id) where kind = 'called';
create table public.present_session_tools (
  session_id uuid primary key references public.present_sessions(id) on delete cascade,
  reconnect_token uuid,
  discussion_block_id text,
  discussion_poll_run_id uuid,
  updated_at timestamptz not null default now()
);
create table public.present_projector_state (
  session_id uuid primary key references public.present_sessions(id) on delete cascade,
  signature text not null,
  seen_at timestamptz not null default now(),
  slide integer not null check (slide >= 0),
  ready boolean not null
);
alter table public.present_pulses enable row level security;
alter table public.present_pulse_responses enable row level security;
alter table public.present_help_requests enable row level security;
alter table public.present_teacher_marks enable row level security;
alter table public.present_session_tools enable row level security;
alter table public.present_projector_state enable row level security;
-- NextAuth application identity is checked by the API. No browser Data API access.
revoke all on public.present_pulses, public.present_pulse_responses, public.present_help_requests,
  public.present_teacher_marks, public.present_session_tools, public.present_projector_state from public, anon, authenticated;
grant select, insert, update, delete on public.present_pulses, public.present_pulse_responses, public.present_help_requests,
  public.present_teacher_marks, public.present_session_tools, public.present_projector_state to service_role;

create function public.submit_present_pulse(p_session uuid, p_pulse uuid, p_user text, p_choice integer)
returns void language plpgsql security invoker set search_path = public as $$
declare pulse public.present_pulses%rowtype;
begin
  -- Lock order: presentation then pulse. Ending a session or closing a pulse
  -- waits for an in-flight response; responses arriving afterwards are rejected.
  perform 1 from public.present_sessions where id = p_session and status = 'live' for share;
  if not found then raise exception 'Presentation ended'; end if;
  select * into pulse from public.present_pulses where id = p_pulse and session_id = p_session for share;
  if not found or pulse.status <> 'open' or p_choice not between 0 and 2 then raise exception 'Pulse unavailable'; end if;
  if not exists (select 1 from public.course_students c join public.present_sessions s on s.course_id = c.course_id
    where s.id = p_session and c.student_id::text = p_user) then raise exception 'Not enrolled'; end if;
  insert into public.present_pulse_responses(pulse_id,respondent_key,user_id,choice)
    values(p_pulse,md5(pulse.salt::text || p_user),case when pulse.anonymous then null else p_user end,p_choice)
    on conflict(pulse_id,respondent_key) do update set choice = excluded.choice;
end;
$$;
revoke all on function public.submit_present_pulse(uuid,uuid,text,integer) from public, anon, authenticated;
grant execute on function public.submit_present_pulse(uuid,uuid,text,integer) to service_role;
