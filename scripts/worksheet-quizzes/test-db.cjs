const fs=require('node:fs'),{execFileSync}=require('node:child_process');
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,j=x=>`'${JSON.stringify(x).replaceAll("'","''")}'::jsonb`;
const q={id:id(11),course_id:id(1),title:'Day 3 · Motion · Paired quiz',kind:'understanding',instructions:'Choose one.',grade_mode:'numeric',questions:Array.from({length:6},(_,i)=>({id:id(20+i),kind:'choice',points:1,prompt:'Model question '+i,guide:'Independent solution.',target_id:id(3),options:['A','B','C','D'],correct_index:i%4})),due_at:'2026-10-26T16:00:00Z',status:'published',version:0,student_ids:null,source_quiz_id:null,language_level:'cpa',sei_supports:false};
const migrate=f=>fs.readFileSync('supabase/migrations/'+f,'utf8');
const pair=(quiz=q,owner='teacher@test',pid=id(10),due='2026-10-23T16:00:00Z')=>`assign_worksheet_pair('${pid}','unit-1',3,'cpa','${due}',repeat('a',64),${j(quiz)},'${owner}','${owner}')`;
const expect=(sql,msg)=>`begin perform ${sql};raise exception 'TEST expected rejection';exception when others then if sqlerrm='TEST expected rejection' or position('${msg}' in sqlerrm)=0 then raise;end if;end;`;
const sql=`begin;
do $$ begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon;end if;if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated;end if;if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role;end if;end $$;
create table courses(id uuid primary key,teacher_email text,program text,archived_at timestamptz);
create table units(id text primary key);
create table students(id uuid primary key,email text,is_active boolean default true);
create table course_students(id uuid primary key default gen_random_uuid(),course_id uuid,student_id uuid,enrollment_state text);
create table learning_targets(id uuid primary key,program text,unit_id text,exclude_from_growth boolean default false);
create table mastery_records(id uuid primary key default gen_random_uuid(),user_id uuid,user_email text,target_id uuid,level smallint,rated_by text,evidence_source text);
insert into courses values('${id(1)}','teacher@test','physics',null);
insert into units values('unit-1');
insert into students(id,email) values('${id(2)}','learner@test'),('${id(4)}','outsider@test');
insert into course_students(course_id,student_id,enrollment_state) values('${id(1)}','${id(2)}','ACTIVE');
insert into learning_targets(id,program,unit_id) values('${id(3)}','physics','unit-1');
${migrate('20260926225821_quiz_grading.sql')}
${migrate('20260926230039_quiz_evidence_validation_fix.sql')}
${migrate('20260929131317_quiz_language_levels.sql')}
alter table quiz_assignments add deleted_at timestamptz;
${migrate('20261024125156_worksheet_quiz_pairs.sql')}
do $$ declare a jsonb;r jsonb;answer jsonb;g jsonb;begin
 ${expect(pair(q,'other@test'),'own active')}
 ${expect(pair({...q,questions:q.questions.map(x=>({...x,kind:'written'}))}),'multiple-choice')}
 ${expect(pair(q,'teacher@test',id(10),'2026-10-28T16:00Z'),'before or at')}
 perform ${pair()};perform ${pair()};
 if (select count(*) from worksheet_assignments)<>1 or (select count(*) from quiz_assignments)<>1 then raise exception 'Duplicate pair';end if;
 ${expect(pair({...q,due_at:'2026-10-28T16:00Z'}),'already exists')}
 if exists(select 1 from mastery_records) or exists(select 1 from quiz_reviews) then raise exception 'Assignment manufactured evidence';end if;
 ${expect(`record_worksheet_receipt('${id(10)}','${id(4)}','received',0,'teacher@test','teacher@test')`,'active student')}
 ${expect(`record_worksheet_receipt('${id(10)}','${id(2)}','received',0,'other@test','other@test')`,'unavailable')}
 r:=record_worksheet_receipt('${id(10)}','${id(2)}','received',0,'teacher@test','teacher@test');
 perform record_worksheet_receipt('${id(10)}','${id(2)}','received',0,'teacher@test','teacher@test');
 if (select count(*) from worksheet_receipt_history)<>1 or exists(select 1 from mastery_records) or exists(select 1 from quiz_reviews) then raise exception 'Receipt retry or evidence isolation failed';end if;
 ${expect(`record_worksheet_receipt('${id(10)}','${id(2)}','excused',0,'teacher@test','teacher@test')`,'changed')}
 perform record_worksheet_receipt('${id(10)}','${id(2)}','not_received',1,'teacher@test','teacher@test');
 select jsonb_object_agg(value->>'id',to_jsonb(case when ordinality<=4 then value->>'correct_index' else '9' end)) into answer from jsonb_array_elements(${j(q.questions)}) with ordinality;
 ${expect(`quiz_student_action('${id(11)}','${id(4)}','submit','{}',0,'${id(50)}')`,'unavailable')}
 answer:=jsonb_set(jsonb_set(answer,array['${id(24)}'],'"1"'),array['${id(25)}'],'"2"');
 perform quiz_student_action('${id(11)}','${id(2)}','submit',answer,0,'${id(50)}');
 if exists(select 1 from mastery_records) or exists(select 1 from quiz_reviews) then raise exception 'Submission auto-released';end if;
 g:=review_quiz_submission('${id(50)}','${id(60)}','teacher@test','teacher@test','graded','{}',jsonb_build_object('${id(3)}',2),'Use slope and direction together.','{}',null,0);
 perform review_quiz_submission('${id(50)}','${id(60)}','teacher@test','teacher@test','graded','{}',jsonb_build_object('${id(3)}',2),'Use slope and direction together.','{}',null,0);
 if (g->>'earned')::numeric<>4 or (g->>'possible')::numeric<>6 or (select count(*) from mastery_records)<>1 or (select count(*) from quiz_reviews)<>1 then raise exception 'Native quiz grade, mastery, or retry failed';end if;
 a:=update_worksheet_pair('${id(10)}',1,'2026-10-23T16:00Z','2026-10-26T16:00Z','archived','teacher@test','teacher@test');
 perform update_worksheet_pair('${id(10)}',1,'2026-10-23T16:00Z','2026-10-26T16:00Z','archived','teacher@test','teacher@test');
 if (select version from worksheet_assignments)<>2 or (select status from quiz_assignments)<>'archived' then raise exception 'Pair archive/retry failed';end if;
 ${expect(`record_worksheet_receipt('${id(10)}','${id(2)}','received',2,'teacher@test','teacher@test')`,'Restore')}
 ${expect(`update_worksheet_pair('${id(10)}',1,'2026-10-23T16:00Z','2026-10-26T16:00Z','published','teacher@test','teacher@test')`,'changed')}
 perform update_worksheet_pair('${id(10)}',2,'2026-10-23T16:00Z','2026-10-26T16:00Z','published','teacher@test','teacher@test');
 if (select count(*) from quiz_submissions)<>1 or (select count(*) from mastery_records)<>1 or (select count(*) from worksheet_receipt_history)<>2 then raise exception 'Lifecycle lost evidence';end if;
 if has_table_privilege('anon','worksheet_assignments','SELECT') or has_table_privilege('authenticated','worksheet_receipts','INSERT') or has_table_privilege('service_role','worksheet_receipt_history','UPDATE') or has_function_privilege('authenticated','record_worksheet_receipt(uuid,uuid,text,integer,text,text)','EXECUTE') then raise exception 'Direct access exposed';end if;
end $$;
rollback;`;
if(process.env.WORKSHEET_SQL_ONLY)fs.writeFileSync(process.env.WORKSHEET_SQL_ONLY,sql);else execFileSync('/opt/homebrew/opt/postgresql@14/bin/psql',[process.env.WORKSHEET_TEST_DATABASE_URL||'postgresql://craigantocci@127.0.0.1:55479/postgres','-X','-v','ON_ERROR_STOP=1','-q'],{input:sql,stdio:['pipe','inherit','inherit']});
console.log('PASS: atomic pairs, ownership, enrollment, receipt conflicts/history, native quiz submission, released 4/6 grade, exactly one teacher mastery record, archive/restore, and restricted privileges.');
