#!/bin/sh
set -eu
# Isolated test cluster: never uses the application's database URL.
PG_BIN=${PG_BIN:-/opt/homebrew/opt/postgresql@14/bin}
TEST_DIR=$(mktemp -d /private/tmp/presentation-tools-pg.XXXXXX)
PORT=55442
cleanup() { "$PG_BIN/pg_ctl" -D "$TEST_DIR" -m immediate stop >/dev/null 2>&1 || true; }
trap cleanup EXIT
"$PG_BIN/initdb" -D "$TEST_DIR" -A trust >/dev/null
"$PG_BIN/pg_ctl" -D "$TEST_DIR" -l "$TEST_DIR/server.log" -o "-p $PORT -h 127.0.0.1 -k /private/tmp" start >/dev/null
"$PG_BIN/psql" -h 127.0.0.1 -p "$PORT" -d postgres -v ON_ERROR_STOP=1 <<'SQL'
create role anon;
create role authenticated;
create role service_role bypassrls;
create table public.present_sessions(id uuid primary key, course_id uuid, status text);
create table public.course_students(course_id uuid, student_id uuid);
SQL
"$PG_BIN/psql" -h 127.0.0.1 -p "$PORT" -d postgres -v ON_ERROR_STOP=1 -f supabase/migrations/20260907145933_classroom_command_tools.sql >/dev/null
"$PG_BIN/psql" -h 127.0.0.1 -p "$PORT" -d postgres -v ON_ERROR_STOP=1 <<'SQL'
insert into present_sessions values ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','live');
insert into course_students values ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003');
insert into present_pulses(id,session_id,kind,anonymous) values ('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','readiness',false);
select submit_present_pulse('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000003',0);
select submit_present_pulse('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000003',2);
do $$ begin
 if (select count(*) from present_pulse_responses) <> 1 or (select choice from present_pulse_responses limit 1) <> 2 then raise exception 'duplicate or lost vote'; end if;
 if (select user_id from present_pulse_responses limit 1) is null then raise exception 'named identity missing'; end if;
 begin
  perform submit_present_pulse('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000099',0);
  raise exception 'outsider accepted';
 exception when raise_exception then if sqlerrm = 'outsider accepted' then raise; end if; end;
end $$;
update present_pulses set status='closed';
insert into present_pulses(id,session_id,kind,anonymous) values ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','confidence',true);
select submit_present_pulse('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000003',1);
do $$ begin
 if exists (select 1 from present_pulse_responses where pulse_id='00000000-0000-0000-0000-000000000005' and user_id is not null) then raise exception 'anonymous identity stored'; end if;
 begin
  perform submit_present_pulse('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000003',1);
  raise exception 'closed pulse accepted';
 exception when raise_exception then if sqlerrm = 'closed pulse accepted' then raise; end if; end;
end $$;
update present_sessions set status='ended';
do $$ begin
 begin
  perform submit_present_pulse('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000003',1);
  raise exception 'ended session accepted';
 exception when raise_exception then if sqlerrm = 'ended session accepted' then raise; end if; end;
 if has_table_privilege('anon','present_teacher_marks','select') or has_table_privilege('authenticated','present_pulse_responses','select') or has_function_privilege('authenticated','submit_present_pulse(uuid,uuid,text,integer)','execute') then raise exception 'browser data access granted'; end if;
 if exists(select 1 from pg_class where relname in ('present_pulses','present_pulse_responses','present_help_requests','present_teacher_marks','present_session_tools','present_projector_state') and not relrowsecurity) then raise exception 'RLS missing'; end if;
end $$;
insert into present_teacher_marks(session_id,teacher_id,kind,student_id,slide,note) values ('00000000-0000-0000-0000-000000000001','teacher','called','student',0,'Called on');
do $$ begin
 begin
 insert into present_teacher_marks(session_id,teacher_id,kind,student_id,slide,note) values ('00000000-0000-0000-0000-000000000001','teacher','called','student',0,'Called on');
 raise exception 'repeat picker allowed';
 exception when unique_violation then null; end;
end $$;
select 'PASS migration, named/anonymous votes, duplicate voting, closed and ended rejection, roster checks, RLS/grants, fair-picker uniqueness' as result;
SQL
