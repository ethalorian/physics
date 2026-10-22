const fs=require('fs'),path=require('path');
const root=process.env.READING_ROOT||path.resolve(__dirname,'..');
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const base=fs.readFileSync(root+'/scripts/test-textbook-readings-db.cjs','utf8');

const quizMigration=fs.readFileSync(root+'/supabase/migrations/20260926225821_quiz_grading.sql','utf8');
const bundleMigration=fs.readFileSync(root+'/supabase/migrations/20261007132230_reading_syllabus_bundles.sql','utf8');
const linkedSchema=quizMigration+`
alter table quiz_assignments add deleted_at timestamptz;
create table vocab_tasks(id uuid primary key,course_id uuid references courses(id),due_on date,active boolean,syllabus_draft boolean,student_ids uuid[],term_ids uuid[]);
create table vocabulary_sets(id uuid primary key,archived boolean,published boolean);
create table vocabulary_terms(id uuid primary key,vocabulary_set_id uuid,archived boolean);
`+bundleMigration.slice(bundleMigration.indexOf('create table public.reading_syllabus_bundles'),bundleMigration.indexOf('-- All four assignments'));
const extra=linkedSchema+['20261014014627_reading_assignment_exemptions.sql','20261014023959_reading_calendar_windows.sql','20261014032134_reading_linked_dates.sql','20261014103927_reading_planner_unassign.sql'].map(f=>fs.readFileSync(root+'/supabase/migrations/'+f,'utf8')).join('\n');
let script=base.replace('do $$ declare r jsonb; begin',()=>extra+'\ndo $$ declare r jsonb; begin');
const sql=`
update course_students set enrollment_state='ACTIVE';
insert into course_students(course_id,student_id,enrollment_state) values('${id(1)}','${id(4)}','ACTIVE');
do $$ declare r jsonb; saved_work jsonb; v integer; begin
  select jsonb_agg(to_jsonb(w)) into saved_work from textbook_work w;
  begin perform schedule_textbook_reading('${id(10)}','2099-10-18 03:59Z','2099-10-17 03:59Z',1,'other@test','other@test'); raise exception 'FAILED ownership'; exception when raise_exception then if sqlerrm not like '%unavailable%' then raise; end if; end;
  r:=schedule_textbook_reading('${id(10)}','2099-10-18 03:59Z','2099-10-17 03:59Z',1,'teacher@test','teacher@test');
  if (r->>'version')::int<>2 or r->>'status'<>'published' or (r->>'opens_at')::timestamptz<>'2099-10-17 03:59Z'::timestamptz then raise exception 'Schedule failed'; end if;
  r:=schedule_textbook_reading('${id(10)}','2099-10-18 03:59Z','2099-10-17 03:59Z',1,'teacher@test','teacher@test');
  if (r->>'version')::int<>2 then raise exception 'Retry created extra version'; end if;
  begin perform schedule_textbook_reading('${id(10)}','2099-10-20 03:59Z','2099-10-19 03:59Z',1,'teacher@test','teacher@test'); raise exception 'FAILED stale version'; exception when raise_exception then if sqlerrm not like '%changed%' then raise; end if; end;
  begin perform textbook_student_action('${id(10)}','${id(4)}','save','{}',0,'${id(80)}'); raise exception 'FAILED early save'; exception when raise_exception then if sqlerrm not like '%not opened%' then raise; end if; end;
  begin perform textbook_student_action('${id(10)}','${id(4)}','submit','{}',0,'${id(80)}'); raise exception 'FAILED early submit'; exception when raise_exception then if sqlerrm not like '%not opened%' then raise; end if; end;
  if exists(select 1 from textbook_work where user_id='${id(4)}') then raise exception 'Early save created work'; end if;
  update textbook_assignments set status='archived',version=3 where id='${id(10)}';
  r:=schedule_textbook_reading('${id(10)}',null,null,3,'teacher@test','teacher@test');
  if r->>'status'<>'published' or r->>'due_at' is not null or r->>'opens_at' is not null then raise exception 'Undo failed'; end if;
  if saved_work is distinct from (select jsonb_agg(to_jsonb(w)) from textbook_work w) or (select count(*) from textbook_submissions)<>2 or (select count(*) from textbook_reviews)<>2 then raise exception 'Existing work altered'; end if;
  perform textbook_student_action('${id(10)}','${id(4)}','save','{}',0,'${id(81)}');
  insert into textbook_assignments(id,course_id,created_by,title,chapter,reading,section_ids,instructions,questions,status)
    select '${id(11)}',course_id,created_by,title,chapter,reading,section_ids,instructions,questions,'draft' from textbook_assignments where id='${id(10)}';
  r:=schedule_textbook_reading('${id(11)}','2099-10-18 03:59Z','2099-10-17 03:59Z',1,'teacher@test','teacher@test');
  if r->>'status'<>'published' or (r->>'version')::int<>2 or r->>'opens_at' is null then raise exception 'Draft publish not atomic'; end if;
  begin perform schedule_textbook_reading('${id(11)}',null,'2099-10-17 03:59Z',2,'teacher@test','teacher@test'); raise exception 'FAILED invalid window'; exception when raise_exception then if sqlerrm not like '%Opening%' then raise; end if; end;
  if has_function_privilege('anon','schedule_textbook_reading(uuid,timestamptz,timestamptz,integer,text,text)','EXECUTE') or has_function_privilege('authenticated','schedule_textbook_reading(uuid,timestamptz,timestamptz,integer,text,text)','EXECUTE') then raise exception 'Schedule exposed'; end if;
end $$;
`;
const linkedSql=`
-- Use published, draft, and archived attachments; dates change without changing visibility.
insert into vocab_tasks values('00000000-0000-4000-8000-000000000040','00000000-0000-4000-8000-000000000001',null,true,false,array['00000000-0000-4000-8000-000000000002']::uuid[],'{}');
insert into quiz_assignments(id,course_id,created_by,title,kind,instructions,grade_mode,questions,student_ids,due_at,status)
select '00000000-0000-4000-8000-000000000030',course_id,created_by,'Reading quiz','understanding','','numeric',
  jsonb_build_array(jsonb_build_object('id','00000000-0000-4000-8000-000000000070','kind','written','points',2,'prompt','Explain motion.','guide','A clear explanation.','target_id','00000000-0000-4000-8000-000000000003')),null,null,'published' from textbook_assignments where id='00000000-0000-4000-8000-000000000010';
insert into quiz_assignments(id,course_id,created_by,title,kind,instructions,grade_mode,questions,status)
select '00000000-0000-4000-8000-000000000031',course_id,created_by,'Vocabulary quiz','vocabulary','','numeric',questions,'draft' from quiz_assignments where id='00000000-0000-4000-8000-000000000030';
insert into quiz_assignments(id,course_id,created_by,title,kind,instructions,grade_mode,questions,status)
select '00000000-0000-4000-8000-000000000032',course_id,created_by,'Unrelated quiz','understanding','','numeric',questions,'published' from quiz_assignments where id='00000000-0000-4000-8000-000000000030';
insert into reading_syllabus_bundles(course_id,step_id,reading_id,practice_id,reading_quiz_id,vocabulary_quiz_id)
values('00000000-0000-4000-8000-000000000001','motion','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000040','00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000031');
insert into quiz_work(quiz_id,user_id,answers,state) values('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000002','{"answer":"saved"}','submitted');
do $$ declare r jsonb; before_work jsonb; v integer; qv integer; begin
 select jsonb_agg(to_jsonb(w)) into before_work from quiz_work w;
 select version into v from textbook_assignments where id='00000000-0000-4000-8000-000000000010';
 -- Saturday rollover computed by readingWindow: Friday opening, Sunday 11:59 PM deadline.
 r:=schedule_textbook_reading('00000000-0000-4000-8000-000000000010','2099-10-19 03:59Z','2099-10-17 03:59Z',v,'teacher@test','teacher@test');
 if exists(select 1 from quiz_assignments where id in ('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000031') and due_at is distinct from '2099-10-19 03:59Z'::timestamptz) or (select due_on from vocab_tasks where id='00000000-0000-4000-8000-000000000040') is distinct from '2099-10-18'::date then raise exception 'Linked calendar dates or Eastern date failed'; end if;
 if (select status from quiz_assignments where id='00000000-0000-4000-8000-000000000030')<>'published' or (select status from quiz_assignments where id='00000000-0000-4000-8000-000000000031')<>'draft' or (select due_at from quiz_assignments where id='00000000-0000-4000-8000-000000000032') is not null then raise exception 'Visibility or unrelated quiz changed'; end if;
 select version into qv from quiz_assignments where id='00000000-0000-4000-8000-000000000030';
 perform schedule_textbook_reading('00000000-0000-4000-8000-000000000010','2099-10-19 03:59Z','2099-10-17 03:59Z',v,'teacher@test','teacher@test');
 if (select version from quiz_assignments where id='00000000-0000-4000-8000-000000000030')<>qv then raise exception 'Retry changed linked quiz version'; end if;
 begin perform schedule_textbook_reading('00000000-0000-4000-8000-000000000010','2099-10-20 03:59Z','2099-10-19 03:59Z',v,'teacher@test','teacher@test'); raise exception 'FAILED stale'; exception when raise_exception then if sqlerrm not like '%changed%' then raise; end if; end;
 if (select version from quiz_assignments where id='00000000-0000-4000-8000-000000000030')<>qv then raise exception 'Stale parent mutated quiz'; end if;
 -- Undo moves all four back to the previous deadline, including an empty deadline.
 perform schedule_textbook_reading('00000000-0000-4000-8000-000000000010',null,null,(r->>'version')::int,'teacher@test','teacher@test');
 if exists(select 1 from quiz_assignments where id in ('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000031') and due_at is not null) or (select due_on from vocab_tasks where id='00000000-0000-4000-8000-000000000040') is not null then raise exception 'Linked Undo failed'; end if;
 -- The ordinary due-date editor uses a direct update and must also cascade.
 update textbook_assignments set due_at='2099-12-10 04:59Z',version=version+1 where id='00000000-0000-4000-8000-000000000010';
 if (select due_on from vocab_tasks where id='00000000-0000-4000-8000-000000000040') is distinct from '2099-12-09'::date or (select due_at from quiz_assignments where id='00000000-0000-4000-8000-000000000031') is distinct from '2099-12-10 04:59Z'::timestamptz then raise exception 'Winter/date editor dates failed'; end if;
 update quiz_assignments set status='archived' where id='00000000-0000-4000-8000-000000000031';
 -- Any child failure rolls back the parent and every earlier child update.
 alter table quiz_assignments add constraint fixture_block_date check(due_at is distinct from '2099-12-11 04:59Z'::timestamptz);
 begin update textbook_assignments set due_at='2099-12-11 04:59Z',version=version+1 where id='00000000-0000-4000-8000-000000000010'; raise exception 'FAILED expected child rejection'; exception when check_violation then null; end;
 if (select due_at from textbook_assignments where id='00000000-0000-4000-8000-000000000010') is distinct from '2099-12-10 04:59Z'::timestamptz or (select due_on from vocab_tasks where id='00000000-0000-4000-8000-000000000040') is distinct from '2099-12-09'::date then raise exception 'Linked transaction not atomic'; end if;
 alter table quiz_assignments drop constraint fixture_block_date;
 -- Existing sequence release must use the refreshed quiz version after the trigger.
 update textbook_assignments set status='draft' where id='00000000-0000-4000-8000-000000000010';
 update quiz_assignments set status='draft' where id='00000000-0000-4000-8000-000000000030';
 select version into v from textbook_assignments where id='00000000-0000-4000-8000-000000000010';
 perform release_reading_syllabus_step('00000000-0000-4000-8000-000000000001','motion','teacher@test','teacher@test',v,'2099-12-12 04:59Z');
 if (select status from quiz_assignments where id='00000000-0000-4000-8000-000000000030')<>'published' or (select due_at from quiz_assignments where id='00000000-0000-4000-8000-000000000030') is distinct from '2099-12-12 04:59Z'::timestamptz or (select status from quiz_assignments where id='00000000-0000-4000-8000-000000000031')<>'archived' then raise exception 'Sequence draft publish failed'; end if;
 select version into v from textbook_assignments where id='00000000-0000-4000-8000-000000000010';
 perform release_reading_syllabus_step('00000000-0000-4000-8000-000000000001','motion','teacher@test','teacher@test',v,'2099-12-13 04:59Z');
 if (select due_at from quiz_assignments where id='00000000-0000-4000-8000-000000000031') is distinct from '2099-12-13 04:59Z'::timestamptz then raise exception 'Existing sequence move failed'; end if;
 if before_work is distinct from (select jsonb_agg(to_jsonb(w)) from quiz_work w) then raise exception 'Student quiz work changed'; end if;
 if (select student_ids from vocab_tasks where id='00000000-0000-4000-8000-000000000040') is distinct from array['00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000004']::uuid[] then raise exception 'Unexpected practice audience'; end if;
 if has_function_privilege('anon','sync_reading_linked_dates()','EXECUTE') or has_function_privilege('authenticated','sync_reading_linked_dates()','EXECUTE') then raise exception 'Linked trigger exposed'; end if;
end $$;
`;
const unassignSql=`
-- Exercise calendar unassignment through the same RPCs used by the UI.
update quiz_assignments set status='published' where id='00000000-0000-4000-8000-000000000031';
insert into textbook_reading_exemptions(assignment_id,user_id,created_by) values('00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000004','teacher@test');
do $$ declare a jsonb; saved_quiz_work jsonb; saved_reading_work jsonb; old_due timestamptz; old_open timestamptz; v integer; qv integer; audience uuid[]; begin
 select jsonb_agg(to_jsonb(w)) into saved_quiz_work from quiz_work w;
 select jsonb_agg(to_jsonb(w)) into saved_reading_work from textbook_work w;
 select version,due_at,opens_at into v,old_due,old_open from textbook_assignments where id='00000000-0000-4000-8000-000000000010';
 select student_ids into audience from vocab_tasks where id='00000000-0000-4000-8000-000000000040';
 begin perform unassign_reading_sequence('00000000-0000-4000-8000-000000000010',v,'other@test','other@test'); raise exception 'FAILED foreign owner'; exception when raise_exception then if sqlerrm not like '%unavailable%' then raise; end if; end;
 begin perform unassign_reading_sequence('00000000-0000-4000-8000-000000000010',v-1,'teacher@test','teacher@test'); raise exception 'FAILED stale unassign'; exception when raise_exception then if sqlerrm not like '%changed%' then raise; end if; end;
 -- Failure on the last child must undo the first child's archive and the practice update.
 alter table quiz_assignments add constraint fixture_reject_archive check(id<>'00000000-0000-4000-8000-000000000031' or status<>'archived');
 begin perform unassign_reading_sequence('00000000-0000-4000-8000-000000000010',v,'teacher@test','teacher@test'); raise exception 'FAILED expected rejection'; exception when check_violation then null; end;
 if (select status from textbook_assignments where id='00000000-0000-4000-8000-000000000010')<>'published' or (select status from quiz_assignments where id='00000000-0000-4000-8000-000000000030')<>'published' or not (select active from vocab_tasks where id='00000000-0000-4000-8000-000000000040') or exists(select 1 from reading_planner_unassignments) then raise exception 'Unassignment was not atomic'; end if;
 alter table quiz_assignments drop constraint fixture_reject_archive;
 a:=unassign_reading_sequence('00000000-0000-4000-8000-000000000010',v,'teacher@test','teacher@test');
 begin perform quiz_student_action('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000002','save','{}',0,'00000000-0000-4000-8000-000000000099'); raise exception 'FAILED expected quiz unavailable'; exception when raise_exception then if sqlerrm not like 'This quiz is unavailable.%' then raise; end if; end;
 begin perform textbook_student_action('00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000002','save','{}',0,'00000000-0000-4000-8000-000000000099'); raise exception 'FAILED expected reading unavailable'; exception when raise_exception then if sqlerrm not like 'This reading is unavailable.%' then raise; end if; end;

 if a->>'status'<>'archived' or exists(select 1 from quiz_assignments where id in ('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000031') and status<>'archived') or (select active from vocab_tasks where id='00000000-0000-4000-8000-000000000040') then raise exception 'Linked pieces stayed assigned'; end if;
 if (select status from quiz_assignments where id='00000000-0000-4000-8000-000000000032')<>'published' or (select student_ids from vocab_tasks where id='00000000-0000-4000-8000-000000000040') is distinct from audience or (a->>'due_at')::timestamptz is distinct from old_due then raise exception 'Unrelated state or dates changed'; end if;
 select version into qv from quiz_assignments where id='00000000-0000-4000-8000-000000000030';
 perform unassign_reading_sequence('00000000-0000-4000-8000-000000000010',v,'teacher@test','teacher@test');
 if (select version from quiz_assignments where id='00000000-0000-4000-8000-000000000030')<>qv then raise exception 'Archive retry bumped a child version'; end if;
 -- A newer child edit cannot be overwritten by Undo, and a rejected Undo stays atomic.
 update quiz_assignments set version=version+1 where id='00000000-0000-4000-8000-000000000031';
 begin perform schedule_textbook_reading('00000000-0000-4000-8000-000000000010',old_due,old_open,(a->>'version')::int,'teacher@test','teacher@test'); raise exception 'FAILED stale child restore'; exception when raise_exception then if sqlerrm not like '%linked quiz changed%' then raise; end if; end;
 if (select active from vocab_tasks where id='00000000-0000-4000-8000-000000000040') or (select status from quiz_assignments where id='00000000-0000-4000-8000-000000000030')<>'archived' or (select status from textbook_assignments where id='00000000-0000-4000-8000-000000000010')<>'archived' then raise exception 'Restore conflict left partial assignments'; end if;
 update quiz_assignments set version=version-1 where id='00000000-0000-4000-8000-000000000031';
 update vocab_tasks set student_ids=array['00000000-0000-4000-8000-000000000002']::uuid[] where id='00000000-0000-4000-8000-000000000040';
 begin perform schedule_textbook_reading('00000000-0000-4000-8000-000000000010',old_due,old_open,(a->>'version')::int,'teacher@test','teacher@test'); raise exception 'FAILED stale practice restore'; exception when raise_exception then if sqlerrm not like '%practice changed%' then raise; end if; end;
 update vocab_tasks set student_ids=audience where id='00000000-0000-4000-8000-000000000040';
 a:=schedule_textbook_reading('00000000-0000-4000-8000-000000000010',old_due,old_open,(a->>'version')::int,'teacher@test','teacher@test');
 if exists(select 1 from quiz_assignments where id in ('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000031') and status<>'published') or not (select active from vocab_tasks where id='00000000-0000-4000-8000-000000000040') or exists(select 1 from reading_planner_unassignments) then raise exception 'Undo did not restore assigned pieces'; end if;
 -- A draft quiz and already-unassigned practice must stay unassigned after Undo.
 update quiz_assignments set status='draft' where id='00000000-0000-4000-8000-000000000031';
 update vocab_tasks set active=false where id='00000000-0000-4000-8000-000000000040';
 a:=unassign_reading_sequence('00000000-0000-4000-8000-000000000010',(a->>'version')::int,'teacher@test','teacher@test');
 a:=schedule_textbook_reading('00000000-0000-4000-8000-000000000010',old_due,old_open,(a->>'version')::int,'teacher@test','teacher@test');
 if (select status from quiz_assignments where id='00000000-0000-4000-8000-000000000031')<>'draft' or (select active from vocab_tasks where id='00000000-0000-4000-8000-000000000040') or (select status from quiz_assignments where id='00000000-0000-4000-8000-000000000030')<>'published' then raise exception 'Undo published unassigned work'; end if;
 -- The durable receipt also restores linked work when dragging back after refresh.
 update vocab_tasks set active=true where id='00000000-0000-4000-8000-000000000040';
 a:=unassign_reading_sequence('00000000-0000-4000-8000-000000000010',(a->>'version')::int,'teacher@test','teacher@test');
 a:=schedule_textbook_reading('00000000-0000-4000-8000-000000000010','2099-12-20 04:59Z','2099-12-19 04:59Z',(a->>'version')::int,'teacher@test','teacher@test');
 if (select status from quiz_assignments where id='00000000-0000-4000-8000-000000000030')<>'published' or (select due_at from quiz_assignments where id='00000000-0000-4000-8000-000000000030') is distinct from '2099-12-20 04:59Z'::timestamptz or not (select active from vocab_tasks where id='00000000-0000-4000-8000-000000000040') or (select due_on from vocab_tasks where id='00000000-0000-4000-8000-000000000040') is distinct from '2099-12-19'::date then raise exception 'Calendar reassignment lost linked status or dates'; end if;
 -- Standalone readings use the same calendar controls without inventing attachments.
 select version into v from textbook_assignments where id='00000000-0000-4000-8000-000000000011';
 a:=unassign_reading_sequence('00000000-0000-4000-8000-000000000011',v,'teacher@test','teacher@test');
 a:=schedule_textbook_reading('00000000-0000-4000-8000-000000000011',null,null,(a->>'version')::int,'teacher@test','teacher@test');
 if a->>'status'<>'published' or exists(select 1 from reading_planner_unassignments) then raise exception 'Standalone restore failed'; end if;
 if saved_quiz_work is distinct from (select jsonb_agg(to_jsonb(w)) from quiz_work w) or saved_reading_work is distinct from (select jsonb_agg(to_jsonb(w)) from textbook_work w) or (select count(*) from textbook_submissions)<>2 or (select count(*) from textbook_reviews)<>2 or (select count(*) from textbook_reading_exemptions)<>1 then raise exception 'Student work or exemption changed'; end if;
 if has_function_privilege('anon','unassign_reading_sequence(uuid,integer,text,text)','EXECUTE') or has_function_privilege('authenticated','unassign_reading_sequence(uuid,integer,text,text)','EXECUTE') or has_table_privilege('anon','reading_planner_unassignments','SELECT') or has_table_privilege('authenticated','reading_planner_unassignments','SELECT') then raise exception 'Unassignment receipt exposed'; end if;
end $$;
`;
const assignMigration=fs.readFileSync(root+'/supabase/migrations/20261014124408_reading_calendar_complete_sequence.sql','utf8');
const assignSql=`
-- New calendar behavior runs after the legacy migration regression checks.
create trigger reading_quiz_work_requires_submission before insert or update of answers on quiz_work for each row execute function guard_reading_quiz_completion();
create trigger reading_quiz_attempt_requires_submission before insert on quiz_submissions for each row execute function guard_reading_quiz_completion();
update textbook_assignments set status='archived' where id='00000000-0000-4000-8000-000000000010';
update quiz_assignments set status=case when id='00000000-0000-4000-8000-000000000030' then 'archived' else 'draft' end where id in ('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000031');
update vocab_tasks set active=false,syllabus_draft=true,student_ids='{}' where id='00000000-0000-4000-8000-000000000040';
do $$ declare a jsonb; v int; saved_work jsonb; saved_reading jsonb; qv int; prior_due timestamptz; begin
 select jsonb_agg(to_jsonb(w)) into saved_work from quiz_work w;
 select jsonb_agg(to_jsonb(w)) into saved_reading from textbook_work w;
 select version,due_at into v,prior_due from textbook_assignments where id='00000000-0000-4000-8000-000000000010';
 begin perform assign_reading_sequence('00000000-0000-4000-8000-000000000010','2099-10-19 03:59Z','2099-10-17 03:59Z',v,'other@test','other@test'); raise exception 'FAILED owner'; exception when raise_exception then if sqlerrm not like '%unavailable%' then raise; end if; end;
 alter table quiz_assignments add constraint fixture_reject_publish check(id<>'00000000-0000-4000-8000-000000000031' or status<>'published');
 begin perform assign_reading_sequence('00000000-0000-4000-8000-000000000010','2099-10-19 03:59Z','2099-10-17 03:59Z',v,'teacher@test','teacher@test'); raise exception 'FAILED publish rejection'; exception when check_violation then null; end;
 if (select status from textbook_assignments where id='00000000-0000-4000-8000-000000000010')<>'archived' or (select active from vocab_tasks where id='00000000-0000-4000-8000-000000000040') or (select status from quiz_assignments where id='00000000-0000-4000-8000-000000000030')<>'archived' or exists(select 1 from reading_planner_assignments) then raise exception 'Partial assignment on child failure'; end if;
 alter table quiz_assignments drop constraint fixture_reject_publish;
 update quiz_assignments set questions='[]' where id='00000000-0000-4000-8000-000000000031';
 begin perform assign_reading_sequence('00000000-0000-4000-8000-000000000010','2099-10-19 03:59Z','2099-10-17 03:59Z',v,'teacher@test','teacher@test'); raise exception 'FAILED question validation'; exception when raise_exception then if sqlerrm not like '%questions before publishing%' then raise; end if; end;
 update quiz_assignments set questions=(select questions from quiz_assignments where id='00000000-0000-4000-8000-000000000030') where id='00000000-0000-4000-8000-000000000031';
 update quiz_assignments set deleted_at=now() where id='00000000-0000-4000-8000-000000000031';
 begin perform assign_reading_sequence('00000000-0000-4000-8000-000000000010','2099-10-19 03:59Z','2099-10-17 03:59Z',v,'teacher@test','teacher@test'); raise exception 'FAILED deleted quiz'; exception when raise_exception then if sqlerrm not like '%Restore the attached quizzes%' then raise; end if; end;
 update quiz_assignments set deleted_at=null where id='00000000-0000-4000-8000-000000000031';
 a:=assign_reading_sequence('00000000-0000-4000-8000-000000000010','2099-10-19 03:59Z','2099-10-17 03:59Z',v,'teacher@test','teacher@test');
 if a->>'status'<>'published' or exists(select 1 from quiz_assignments where id in ('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000031') and status<>'published') or not (select active from vocab_tasks where id='00000000-0000-4000-8000-000000000040') then raise exception 'Not all four pieces assigned'; end if;
 if (select due_at from quiz_assignments where id='00000000-0000-4000-8000-000000000030') is distinct from '2099-10-19 03:59Z'::timestamptz or (select due_on from vocab_tasks where id='00000000-0000-4000-8000-000000000040') is distinct from '2099-10-18'::date or (select due_at from quiz_assignments where id='00000000-0000-4000-8000-000000000031') is distinct from '2099-10-20 03:59Z'::timestamptz then raise exception 'Reading/practice/Sunday-to-Monday vocabulary dates incorrect'; end if;
 if (select student_ids from vocab_tasks where id='00000000-0000-4000-8000-000000000040') is distinct from array['00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000004']::uuid[] then raise exception 'Fresh practice not assigned to class'; end if;
 select version into qv from quiz_assignments where id='00000000-0000-4000-8000-000000000031';
 perform assign_reading_sequence('00000000-0000-4000-8000-000000000010','2099-10-19 03:59Z','2099-10-17 03:59Z',v,'teacher@test','teacher@test');
 if (select version from quiz_assignments where id='00000000-0000-4000-8000-000000000031')<>qv then raise exception 'Retry duplicated publication'; end if;
 begin perform assign_reading_sequence('00000000-0000-4000-8000-000000000010','2099-10-21 03:59Z','2099-10-20 03:59Z',v,'teacher@test','teacher@test'); raise exception 'FAILED stale assign'; exception when raise_exception then if sqlerrm not like '%changed%' then raise; end if; end;
 update quiz_assignments set version=version+1 where id='00000000-0000-4000-8000-000000000031';
 begin perform undo_reading_sequence_assignment('00000000-0000-4000-8000-000000000010',(a->>'version')::int,'teacher@test','teacher@test'); raise exception 'FAILED stale child Undo'; exception when raise_exception then if sqlerrm not like '%quiz changed%' then raise; end if; end;
 if (select status from textbook_assignments where id='00000000-0000-4000-8000-000000000010')<>'published' or not (select active from vocab_tasks where id='00000000-0000-4000-8000-000000000040') then raise exception 'Failed Undo was not atomic'; end if;
 update quiz_assignments set version=version-1 where id='00000000-0000-4000-8000-000000000031';
 a:=undo_reading_sequence_assignment('00000000-0000-4000-8000-000000000010',(a->>'version')::int,'teacher@test','teacher@test');
 if a->>'status'<>'archived' or (a->>'due_at')::timestamptz is distinct from prior_due or (select status from quiz_assignments where id='00000000-0000-4000-8000-000000000030')<>'archived' or (select status from quiz_assignments where id='00000000-0000-4000-8000-000000000031')<>'draft' or (select active from vocab_tasks where id='00000000-0000-4000-8000-000000000040') then raise exception 'Undo did not restore mixed prior states'; end if;
 -- Reassign, then move, then Undo the move: all stay assigned with old offsets.
 a:=assign_reading_sequence('00000000-0000-4000-8000-000000000010','2099-10-19 03:59Z','2099-10-17 03:59Z',(a->>'version')::int,'teacher@test','teacher@test');
 a:=assign_reading_sequence('00000000-0000-4000-8000-000000000010','2099-12-12 04:59Z','2099-12-11 04:59Z',(a->>'version')::int,'teacher@test','teacher@test');
 a:=undo_reading_sequence_assignment('00000000-0000-4000-8000-000000000010',(a->>'version')::int,'teacher@test','teacher@test');
 if a->>'status'<>'published' or (select due_at from quiz_assignments where id='00000000-0000-4000-8000-000000000031') is distinct from '2099-10-20 03:59Z'::timestamptz then raise exception 'Move Undo lost vocabulary offset'; end if;
 a:=unassign_reading_sequence('00000000-0000-4000-8000-000000000010',(a->>'version')::int,'teacher@test','teacher@test');
 a:=assign_reading_sequence('00000000-0000-4000-8000-000000000010','2099-12-12 04:59Z','2099-12-11 04:59Z',(a->>'version')::int,'teacher@test','teacher@test');
 if exists(select 1 from quiz_assignments where id in ('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000031') and status<>'published') then raise exception 'Reassignment omitted quiz'; end if;
 -- Practice due-date edits, null dates, and DST retain next-evening semantics.
 update vocab_tasks set due_on='2026-10-31' where id='00000000-0000-4000-8000-000000000040';
 if (select due_at from quiz_assignments where id='00000000-0000-4000-8000-000000000031') is distinct from '2026-11-02 04:59Z'::timestamptz then raise exception 'Fall DST date incorrect'; end if;
 update vocab_tasks set due_on='2026-03-07' where id='00000000-0000-4000-8000-000000000040';
 if (select due_at from quiz_assignments where id='00000000-0000-4000-8000-000000000031') is distinct from '2026-03-09 03:59Z'::timestamptz then raise exception 'Spring DST date incorrect'; end if;
 update textbook_assignments set due_at=null,opens_at=null where id='00000000-0000-4000-8000-000000000010';
 if exists(select 1 from quiz_assignments where id in ('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000031') and due_at is not null) then raise exception 'Null due date not cleared'; end if;
 if saved_work is distinct from (select jsonb_agg(to_jsonb(w)) from quiz_work w) or saved_reading is distinct from (select jsonb_agg(to_jsonb(w)) from textbook_work w) or (select count(*) from textbook_reading_exemptions)<>1 then raise exception 'Student work or exemptions changed'; end if;
 if has_function_privilege('anon','assign_reading_sequence(uuid,timestamptz,timestamptz,integer,text,text)','EXECUTE') or has_function_privilege('authenticated','undo_reading_sequence_assignment(uuid,integer,text,text)','EXECUTE') or has_table_privilege('authenticated','reading_planner_assignments','SELECT') then raise exception 'Sequence control exposed'; end if;
end $$;
-- A student cannot start their Reading Quiz before completing the reading.
delete from textbook_reading_exemptions where user_id='00000000-0000-4000-8000-000000000004';
do $$ begin
 begin insert into quiz_work(quiz_id,user_id,answers,state) values('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000004','{}','in_progress'); raise exception 'FAILED quiz unlocked early'; exception when raise_exception then if sqlerrm not like 'Complete and submit the reading%' then raise; end if; end;
end $$;
insert into textbook_submissions(id,assignment_id,user_id,answers,snapshot)
select '00000000-0000-4000-8000-000000000095',assignment_id,'00000000-0000-4000-8000-000000000004',answers,snapshot from textbook_submissions limit 1;
insert into quiz_work(quiz_id,user_id,answers,state) values('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000004','{}','in_progress');
`;
script=script.replace('rollback;`',()=>sql+linkedSql+unassignSql+assignMigration+assignSql+'rollback;`');
const Module=require('module');const mod=new Module(__filename,module);mod.filename=__filename;mod.paths=module.paths;mod._compile(script,__filename);
console.log('PASS: complete-sequence assignment, next-day vocabulary quiz dates, DST, guarded completion, precise Undo, atomic scheduling, draft validation, ownership, retry, stale versions, opening enforcement, undo, preserved student work, private RPC, linked quizzes/practice, Eastern dates, linked Undo, all-or-nothing saves, existing sequence release, linked unassignment, atomic Undo, durable reassign, draft preservation, and stale-child protection.');
