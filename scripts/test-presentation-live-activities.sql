\set ON_ERROR_STOP on
begin;
do $$ begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon;end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated;end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role bypassrls;end if;
end $$;
create table public.courses(id uuid primary key,archived_at timestamptz);
create table public.students(id uuid primary key);
create table public.lessons(id uuid primary key,unit_id text);
create table public.learning_targets(id uuid primary key,unit_id text);
create table public.course_students(course_id uuid,student_id uuid,enrollment_state text);
create table public.present_sessions(id uuid primary key,course_id uuid,lesson_id uuid,teacher_id text,status text,poll_block_id text,created_at timestamptz default now(),plan_unit_id text,current_slide integer default 8);
create table public.lobby_sessions(id uuid primary key default gen_random_uuid(),course_id uuid,lesson_id uuid,created_by text,status text default 'lobby',created_at timestamptz default now(),closed_at timestamptz);
create table public.mastery_records(id uuid primary key default gen_random_uuid(),user_id uuid,target_id uuid,level smallint,rated_by text,evidence_source text);
create table public.teacher_feedback(id uuid primary key default gen_random_uuid(),user_id text,teacher_email text,target_id uuid,message text);
\ir ../supabase/migrations/20260907145933_classroom_command_tools.sql
\ir ../supabase/migrations/20260909042350_evidence_review_desk.sql
\ir ../supabase/migrations/20260917012344_mastery_review_fast_flow.sql
\ir ../supabase/migrations/20261002181737_presentation_live_activities.sql
create function pg_temp.uid(n integer) returns uuid language sql as $$ select ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid $$;
create function pg_temp.reject(q text) returns void language plpgsql as $$begin begin execute q;exception when raise_exception or check_violation then return;end;raise exception 'Expected rejection: %',q;end $$;
insert into courses values(pg_temp.uid(1),null);
insert into students values(pg_temp.uid(2)),(pg_temp.uid(3)),(pg_temp.uid(4));
insert into course_students values(pg_temp.uid(1),pg_temp.uid(2),'ACTIVE'),(pg_temp.uid(1),pg_temp.uid(3),'INACTIVE');
insert into learning_targets values(pg_temp.uid(10),'unit-1'),(pg_temp.uid(11),'unit-2');
insert into present_sessions(id,course_id,teacher_id,status,plan_unit_id) values(pg_temp.uid(5),pg_temp.uid(1),'teacher','live','unit-1');
do $$ declare p uuid;r uuid;rid uuid:=pg_temp.uid(20);result jsonb;begin
 perform pg_temp.reject($q$select launch_present_pulse(pg_temp.uid(5),'custom',false,true,'Why?',array['A','a'])$q$);
 p:=launch_present_pulse(pg_temp.uid(5),'custom',false,true,'What changes?',array['A','B','C','D','E','F']);
 perform submit_present_pulse(pg_temp.uid(5),p,pg_temp.uid(2)::text,5);
 perform submit_present_pulse(pg_temp.uid(5),p,pg_temp.uid(2)::text,4);
 if (select count(*) from present_pulse_responses)<>1 or (select choice from present_pulse_responses)<>4 then raise exception 'Vote retry failed';end if;
 perform pg_temp.reject(format('select submit_present_pulse(%L,%L,%L,6)',pg_temp.uid(5),p,pg_temp.uid(2)));
 perform pg_temp.reject(format('select submit_present_pulse(%L,%L,%L,0)',pg_temp.uid(5),p,pg_temp.uid(3)));
 perform pg_temp.reject(format('select submit_present_pulse(%L,%L,%L,0)',pg_temp.uid(5),p,pg_temp.uid(4)));
 perform pg_temp.reject($q$select launch_present_pulse(pg_temp.uid(5),'readiness',false,true)$q$);
 perform pg_temp.reject($q$insert into lobby_sessions(course_id,created_by,present_session_id) values(pg_temp.uid(1),'teacher',pg_temp.uid(5))$q$);
 perform pg_temp.reject($q$update present_sessions set poll_block_id='lesson-question'$q$);
 update present_pulses set locked=true where id=p;
 perform pg_temp.reject(format('select submit_present_pulse(%L,%L,%L,0)',pg_temp.uid(5),p,pg_temp.uid(2)));
 update present_pulses set status='closed';
 p:=launch_present_pulse(pg_temp.uid(5),'confidence',true,false);
 perform submit_present_pulse(pg_temp.uid(5),p,pg_temp.uid(2)::text,1);
 if exists(select 1 from present_pulse_responses where pulse_id=p and user_id is not null) then raise exception 'Anonymous identity leaked';end if;
 update present_pulses set status='closed';
 perform pg_temp.reject($q$select launch_present_pulse(pg_temp.uid(5),'warmup',true,true,'Explain.',null,pg_temp.uid(10))$q$);
 perform pg_temp.reject($q$select launch_present_pulse(pg_temp.uid(5),'warmup',false,true,'Explain.',null,pg_temp.uid(11))$q$);
 p:=launch_present_pulse(pg_temp.uid(5),'warmup',false,true,'Explain your evidence.',null,pg_temp.uid(10));
 perform pg_temp.reject(format('select submit_present_pulse(%L,%L,%L,0)',pg_temp.uid(5),p,pg_temp.uid(2)));
 r:=submit_present_ticket(pg_temp.uid(5),p,pg_temp.uid(2),'The slope shows velocity.');
 if submit_present_ticket(pg_temp.uid(5),p,pg_temp.uid(2),'The slope shows velocity.')<>r then raise exception 'Ticket retry duplicated';end if;
 perform pg_temp.reject(format('select submit_present_ticket(%L,%L,%L,%L)',pg_temp.uid(5),p,pg_temp.uid(2),'Changed after submission'));
 perform pg_temp.reject(format('select submit_present_ticket(%L,%L,%L,%L)',pg_temp.uid(5),p,pg_temp.uid(3),'Inactive student'));
 if exists(select 1 from mastery_records) then raise exception 'Submission changed mastery';end if;
 result:=review_present_ticket(rid,pg_temp.uid(2),'teacher@example.com',p,pg_temp.uid(10),jsonb_build_array(jsonb_build_object('key',r,'response','The slope shows velocity.')),'target',3,'Got it.','Use graph evidence.');
 perform review_present_ticket(rid,pg_temp.uid(2),'teacher@example.com',p,pg_temp.uid(10),jsonb_build_array(jsonb_build_object('key',r)),'target',3,'Got it.','Use graph evidence.');
 if (select count(*) from mastery_records)<>1 or (select count(*) from teacher_feedback)<>1 or (select count(*) from mastery_evidence_reviews)<>1 then raise exception 'Rating retry duplicated';end if;
 if result->>'present_pulse_id'<>p::text or result->>'lesson_id' is not null or result->>'overall_level'<>'3' then raise exception 'Review attribution failed';end if;
 perform pg_temp.reject(format('select review_present_ticket(%L,%L,%L,%L,%L,%L,%L,2,%L,%L)',rid,pg_temp.uid(4),'teacher@example.com',p,pg_temp.uid(10),'[{"key":"bad"}]','target','Bad','Bad'));
 update present_pulses set status='closed';
 insert into lobby_sessions(course_id,created_by,present_session_id) values(pg_temp.uid(1),'teacher',pg_temp.uid(5));
 perform pg_temp.reject($q$select launch_present_pulse(pg_temp.uid(5),'readiness',false,true)$q$);
 update present_sessions set status='ended';
 if exists(select 1 from lobby_sessions where status<>'closed') or (select current_slide from present_sessions)<>8 then raise exception 'End failed or slide lost';end if;
 update present_sessions set status='live';
 p:=launch_present_pulse(pg_temp.uid(5),'exit_ticket',false,true,'One thing you learned?',null,pg_temp.uid(10));
 update courses set archived_at=now();
 perform pg_temp.reject(format('select submit_present_ticket(%L,%L,%L,%L)',pg_temp.uid(5),p,pg_temp.uid(2),'Archived class'));
 update courses set archived_at=null;
 update present_sessions set status='ended';
 if exists(select 1 from present_pulses where status='open') then raise exception 'Poll not closed at end';end if;
 if has_table_privilege('anon','present_ticket_responses','select') or has_table_privilege('authenticated','present_ticket_responses','insert') or has_function_privilege('authenticated','review_present_ticket(uuid,uuid,text,uuid,uuid,jsonb,text,integer,text,text)','execute') then raise exception 'Browser access granted';end if;
 if not (select relrowsecurity from pg_class where oid='present_ticket_responses'::regclass) then raise exception 'RLS missing';end if;
end $$;
select 'PASS: class scope, required/custom/anonymous polls, activity conflicts, immutable warm-up and exit evidence, atomic rating and feedback, retry safety, return to slide, RLS and grants' as result;
rollback;
