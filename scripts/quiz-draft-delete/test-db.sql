\set ON_ERROR_STOP on
begin;
\ir ../../supabase/migrations/20260929171610_quiz_draft_deletion.sql
do $$
declare course uuid:=gen_random_uuid(); draft uuid:=gen_random_uuid(); assigned uuid:=gen_random_uuid(); changed integer;
begin
 insert into courses(id,teacher_email,program) values(course,'draft-test@example.invalid','physics');
 insert into quiz_assignments(id,course_id,created_by,title,kind,grade_mode,questions,status)
 values(draft,course,'draft-test@example.invalid','Synthetic draft','mixed','numeric','[]','draft');
 insert into quiz_assignments(id,course_id,created_by,title,kind,grade_mode,questions,status,source_quiz_id)
 values(assigned,course,'draft-test@example.invalid','Assigned copy','mixed','numeric','[]','published',draft);
 update quiz_assignments set deleted_at=now(),version=version+1 where id=draft and status='draft' and version=1 and deleted_at is null;
 get diagnostics changed=row_count;
 assert changed=1,'Draft not deleted';
 assert exists(select 1 from quiz_assignments where id=assigned and source_quiz_id=draft and status='published' and deleted_at is null),'Assigned copy changed';
 update quiz_assignments set deleted_at=now(),version=version+1 where id=draft and status='draft' and version=1;
 get diagnostics changed=row_count;
 assert changed=0,'Stale version changed draft';
 begin
  update quiz_assignments set deleted_at=now() where id=assigned;
  raise exception 'Published quiz deletion was allowed';
 exception when check_violation then null;
 end;
 begin
  update quiz_assignments set status='published' where id=draft;
  raise exception 'Deleted draft publication was allowed';
 exception when check_violation then null;
 end;
 update quiz_assignments set deleted_at=null,version=version+1 where id=draft and status='draft' and version=2;
 assert exists(select 1 from quiz_assignments where id=draft and deleted_at is null and version=3),'Undo failed';
 assert not has_table_privilege('anon','public.quiz_assignments','UPDATE'),'Anonymous writes allowed';
 assert not has_table_privilege('authenticated','public.quiz_assignments','UPDATE'),'Browser writes allowed';
 raise notice 'PASS: reversible draft deletion, version conflict, protected published copies, blocked deleted-draft publishing, unchanged browser permissions.';
end $$;
rollback;
