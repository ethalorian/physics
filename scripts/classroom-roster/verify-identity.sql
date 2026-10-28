\set ON_ERROR_STOP on
begin;
create function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %', label; end if; raise notice 'PASS: %', label; end $$;
create function pg_temp.sync(roster jsonb, course text default 'identity-class') returns jsonb language sql as $$
 select sync_classroom_roster(jsonb_build_object('id',course,'name','Physics'),roster,'teacher@example.test',array['teacher@example.test'],false,clock_timestamp())
$$;
insert into students(email,name) values ('blair@example.test','Blair Two'),('casey@example.test','Casey Three');
insert into student_identities(student_id,provider,provider_sub)
 select id,'google','22222222-2222-4222-8222-222222222222' from students where email='blair@example.test';
insert into student_identities(student_id,provider,provider_sub)
 select id,'google','33333333-3333-4333-8333-333333333333' from students where email='blair@example.test';
insert into test_saved_work select id,'Original work',91 from students where email='blair@example.test';
select pg_temp.check(pg_temp.sync('[{"google_id":"123456789012345678901","name":"Blair Two"}]') @> '{"studentsAdded":1,"studentsTotal":1}', 'existing account with multiple legacy login UUIDs syncs successfully');
select pg_temp.check((select count(*)=2 from student_identities where provider='google') and (select count(*)=1 from student_identities where provider='google_classroom'), 'Classroom mapping stored separately; login identities untouched');
select pg_temp.check((select count(*)=2 from students) and (select count(*)=1 from test_saved_work w join course_students cs on cs.student_id=w.student_id where w.grade=91), 'no account replacement or duplicate; work and grade remain linked');
select pg_temp.check(pg_temp.sync('[{"google_id":"123456789012345678901","name":"Blair Newname"}]') @> '{"studentsAdded":0,"studentsRemoved":0}', 'repeat refresh uses stable Classroom mapping after name change');
select pg_temp.check((select name='Blair Newname' from students where email='blair@example.test'), 'name update stays on original account');
select pg_temp.sync('[{"google_id":"123456789012345678901","name":"Blair Newname"},{"google_id":"223456789012345678901","name":"Casey Three"}]');
select pg_temp.check(pg_temp.sync('[{"google_id":"223456789012345678901","name":"Casey Three"},{"google_id":"323456789012345678901","name":"Drew Four"}]') @> '{"studentsAdded":1,"studentsRemoved":1,"studentsTotal":2}', 'additions and removals still reconcile');
select pg_temp.check((select count(*)=1 from test_saved_work where grade=91) and (select count(*)=3 from students), 'departing account and original work preserved');
select pg_temp.sync('[{"google_id":"123456789012345678901","name":"Blair Newname"}]');
select pg_temp.check((select count(*)=1 from test_saved_work w join course_students cs on cs.student_id=w.student_id where w.grade=91), 'returning student reconnects to original saved work');
do $$ declare before_state jsonb; begin
 select jsonb_agg(to_jsonb(cs) order by cs.id) into before_state from course_students cs;
 begin perform pg_temp.sync('[{"google_id":"423456789012345678901","name":"Blair Newname"}]'); raise exception 'Expected true Classroom conflict';
 exception when raise_exception then if sqlerrm not like '%ROSTER_AMBIGUOUS%' then raise; end if; end;
 perform pg_temp.check((select jsonb_agg(to_jsonb(cs) order by cs.id) from course_students cs)=before_state,'genuinely conflicting Classroom ID is rejected atomically');
end $$;
insert into students(email,name) values ('same1@example.test','Same Name'),('same2@example.test','Same Name');
do $$ begin
 begin perform pg_temp.sync('[{"google_id":"523456789012345678901","name":"Same Name"}]'); raise exception 'Expected duplicate name conflict';
 exception when raise_exception then if sqlerrm not like '%ROSTER_AMBIGUOUS%' then raise; end if; end;
 perform pg_temp.check(not exists(select 1 from student_identities where provider_sub='523456789012345678901'), 'duplicate names still never guessed or linked');
end $$;
-- A login UUID cannot be mistaken for a Classroom identity even if its text happens to match.
select pg_temp.check(pg_temp.sync('[{"google_id":"22222222-2222-4222-8222-222222222222","name":"Unrelated Student"}]','separate-class') @> '{"studentsAdded":1}', 'overlapping identifier text remains in separate namespaces');
select pg_temp.check((select a.student_id <> b.student_id from student_identities a join student_identities b on a.provider_sub=b.provider_sub where a.provider='google' and b.provider='google_classroom' and a.provider_sub='22222222-2222-4222-8222-222222222222'), 'login account cannot be reassigned by Classroom namespace');
rollback;
