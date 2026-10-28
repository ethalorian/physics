\set ON_ERROR_STOP on
begin;
insert into students (email,name) values ('blair@example.test','Blair Two');
insert into student_identities (student_id,provider,provider_sub) select id,'google','22222222-2222-4222-8222-222222222222' from students where email='blair@example.test';
insert into test_saved_work select id,'Original work',91 from students where email='blair@example.test';
do $$ begin
 begin
  perform sync_classroom_roster('{"id":"legacy-case","name":"Physics"}', '[{"google_id":"123456789012345678901","name":"Blair Two"}]', 'teacher@example.test', array['teacher@example.test'],false,clock_timestamp());
  raise exception 'Expected original identity mismatch';
 exception when raise_exception then
  if sqlerrm not like '%ROSTER_AMBIGUOUS%' then raise; end if;
 end;
 if (select count(*) from test_saved_work)<>1 or (select count(*) from courses)<>0 then raise exception 'Original failure changed data'; end if;
 raise notice 'PASS: exact production UUID-versus-Classroom-ID failure reproduced with saved work unchanged';
end $$;
rollback;
