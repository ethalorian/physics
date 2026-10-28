\set ON_ERROR_STOP on
begin;
create function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %', label; end if; raise notice 'PASS: %', label; end $$;
create function pg_temp.sync(roster jsonb, course text default 'class-one', teacher text default 'teacher@example.test', admin boolean default false, snapshot timestamptz default clock_timestamp()) returns jsonb language sql as $$
 select public.sync_classroom_roster(jsonb_build_object('id',course,'name','Physics'),roster,teacher,array[teacher,'alias@example.test'],admin,snapshot)
$$;
select pg_temp.check((pg_temp.sync('[{"google_id":"a","name":"Alex One"},{"google_id":"b","name":"Blair Two"}]')->>'studentsAdded')::int = 2, 'initial import');
insert into test_saved_work select id, 'Saved answer', 92 from students where email='a@classroom.local';
select pg_temp.sync('[{"google_id":"a","name":"Alex One"}]','other-class');
select pg_temp.check(pg_temp.sync('[{"google_id":"b","name":"Blair Two"},{"google_id":"c","name":"Casey Three"}]') @> '{"studentsAdded":1,"studentsRemoved":1,"studentsTotal":2}', 'add and remove together');
select pg_temp.check((select count(*)=3 from students) and (select count(*)=1 from test_saved_work where grade=92) and (select count(*)=1 from course_students cs join courses c on c.id=cs.course_id where c.google_course_id='other-class'), 'accounts, grades, work and other classes preserved');
select pg_temp.check(pg_temp.sync('[{"google_id":"b","name":"Blair Two"},{"google_id":"c","name":"Casey Three"}]') @> '{"studentsAdded":0,"studentsRemoved":0}', 'repeat is idempotent');
select pg_temp.check(pg_temp.sync('[]') @> '{"studentsAdded":0,"studentsRemoved":2,"studentsTotal":0}', 'complete empty roster removes all memberships');
select pg_temp.check((select student_count=0 from courses where google_course_id='class-one') and (select count(*)=3 from students), 'empty roster count and retained accounts');
select pg_temp.sync('[{"google_id":"a","name":"Alex One"}]');
select pg_temp.check((select count(*)=1 from test_saved_work w join course_students cs on cs.student_id=w.student_id join courses c on c.id=cs.course_id where c.google_course_id='class-one'), 'rejoining student retains original work');
insert into student_identities select id,'google','a' from students where email='a@classroom.local';
update students set email='alex@example.test', alias='Personal alias',photo_url='saved-avatar' where email='a@classroom.local';
select pg_temp.sync('[{"google_id":"a","name":"Alex Newname"}]');
select pg_temp.check((select name='Alex Newname' and alias='Personal alias' and photo_url='saved-avatar' from students where email='alex@example.test'), 'Google identity preserves account after name change');
insert into students(email,name) values ('drew@example.test','Drew Four');
select pg_temp.sync('[{"google_id":"d","name":"Drew Four"}]');
select pg_temp.check((select count(*)=1 from students where name='Drew Four') and (select count(*)=1 from course_students cs join students s on s.id=cs.student_id join courses c on c.id=cs.course_id where c.google_course_id='class-one' and s.email='drew@example.test'), 'existing signed-in account matched without duplicate');
insert into students(email,name) values ('twin1@example.test','Twin Name'),('twin2@example.test','Twin Name');
do $$ declare before_state jsonb; begin
 select jsonb_agg(to_jsonb(cs) order by cs.id) into before_state from course_students cs;
 begin perform pg_temp.sync('[{"google_id":"new","name":"New Student"},{"google_id":"twin","name":"Twin Name"}]'); raise exception 'Expected ambiguity';
 exception when raise_exception then if sqlerrm not like '%ROSTER_AMBIGUOUS%' then raise; end if; end;
 perform pg_temp.check((select jsonb_agg(to_jsonb(cs) order by cs.id) from course_students cs)=before_state and not exists(select 1 from students where email='new@classroom.local'), 'ambiguous identity rolls back entire refresh');
 begin perform pg_temp.sync('[]','class-one','stranger@example.test'); raise exception 'Expected forbidden';
 exception when raise_exception then if sqlerrm not like '%ROSTER_FORBIDDEN%' then raise; end if; end;
 perform pg_temp.check((select jsonb_agg(to_jsonb(cs) order by cs.id) from course_students cs)=before_state,'wrong teacher cannot change roster');
 begin perform pg_temp.sync('[]','class-one','teacher@example.test',false,'2000-01-01'); raise exception 'Expected stale';
 exception when raise_exception then if sqlerrm not like '%ROSTER_STALE%' then raise; end if; end;
 perform pg_temp.check((select jsonb_agg(to_jsonb(cs) order by cs.id) from course_students cs)=before_state,'older overlapping refresh rejected');
 begin perform pg_temp.sync('[{"google_id":"a","name":"Alex"},{"google_id":"a","name":"Alex"}]'); raise exception 'Expected duplicate';
 exception when raise_exception then if sqlerrm not like '%ROSTER_AMBIGUOUS%' then raise; end if; end;
 perform pg_temp.check((select jsonb_agg(to_jsonb(cs) order by cs.id) from course_students cs)=before_state,'duplicate IDs roll back');
 begin perform pg_temp.sync('null'); raise exception 'Expected invalid';
 exception when raise_exception then if sqlerrm not like '%ROSTER_INVALID%' then raise; end if; end;
 perform pg_temp.check((select jsonb_agg(to_jsonb(cs) order by cs.id) from course_students cs)=before_state,'malformed roster cannot clear class');
end $$;
alter table students add constraint simulated_failure check (name <> 'Simulated failure');
do $$ begin
 begin perform pg_temp.sync('[{"google_id":"e","name":"New Before Failure"},{"google_id":"f","name":"Simulated failure"}]'); raise exception 'Expected constraint failure';
 exception when check_violation then null; end;
 perform pg_temp.check(not exists(select 1 from students where email='e@classroom.local') and (select student_count=1 from courses where google_course_id='class-one'), 'database failure rolls back additions, removals and count');
end $$;
select pg_temp.sync('[]','class-one','admin@example.test',true);
select pg_temp.check((select teacher_email='teacher@example.test' from courses where google_course_id='class-one'), 'admin refresh preserves course owner');
update courses set teacher_email='alias@example.test' where google_course_id='class-one';
select pg_temp.check(pg_temp.sync('[]') @> '{"studentsTotal":0}', 'teacher aliases accepted');
select pg_temp.check(not has_function_privilege('anon','public.sync_classroom_roster(jsonb,jsonb,text,text[],boolean,timestamptz)','execute') and not has_function_privilege('authenticated','public.sync_classroom_roster(jsonb,jsonb,text,text[],boolean,timestamptz)','execute') and has_function_privilege('service_role','public.sync_classroom_roster(jsonb,jsonb,text,text[],boolean,timestamptz)','execute'), 'only server service role can execute');
rollback;
