const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto'),{execFileSync}=require('node:child_process')
const root=path.resolve(__dirname,'..'),out='/private/tmp/reading-syllabus-test';fs.mkdirSync(out,{recursive:true})
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,json=v=>`'${JSON.stringify(v).replaceAll("'","''")}'::jsonb`
const targets=JSON.parse(fs.readFileSync(process.env.SYLLABUS_TARGETS||path.join(__dirname,'fixtures/reading-syllabus-targets.json'),'utf8'))
async function main(){
 await require('esbuild').build({stdin:{contents:`export {READING_SYLLABUS} from './src/data/reading-syllabus';export * from './src/lib/reading-syllabus';export {validateReading} from './src/lib/textbook-assignments';export {validateQuiz} from './src/lib/quizzes/validation';export {TEXTBOOK_SECTIONS} from './src/data/textbook-sections';export * from './src/lib/openstax-physics';`,loader:'ts',resolveDir:root},outfile:out+'/content.cjs',bundle:true,platform:'node',format:'cjs',plugins:[{name:'server-marker',setup(b){b.onResolve({filter:/^server-only$/},()=>({path:'server-only',namespace:'empty'}));b.onLoad({filter:/.*/,namespace:'empty'},()=>({contents:''}))}}]})
 const m=require(out+'/content.cjs'),steps=m.READING_SYLLABUS,seen=new Set(),drafts=[]
 assert.equal(m.OPENSTAX_PHYSICS.edition,'college-physics-ap-2e');assert.equal(m.OPENSTAX_PHYSICS.pages,1773);assert.equal(m.honorsPdfPage(20),38);assert.equal(m.honorsPdfPage(42),60)
 assert.equal(new Set(m.OPENSTAX_PHYSICS.sections.map(s=>s.id)).size,244)
 assert(fs.existsSync(root+'/public'+m.OPENSTAX_PDF),'replacement PDF must be bundled')
 m.validateHonorsReading({sections:['34.7'],from:1631,to:1634,focus:'Modern physics extension'})
 assert.throws(()=>m.validateHonorsReading({sections:['34.7'],from:1755,to:1756,focus:'Past the end'}))

 for(const step of steps){
  assert(!seen.has(step.id));assert(step.prerequisites.every(id=>seen.has(id)),`${step.id}: missing or later prerequisite`);seen.add(step.id)
  assert(step.passage||step.sections.length);for(const section of step.sections)assert(m.TEXTBOOK_SECTIONS[step.chapter].sections.some(s=>s.id===section),section)
  assert.equal(new Set(step.words.map(w=>w.term)).size,step.words.length);assert(step.words.every(w=>w.definition));assert(m.HONORS_READING_MAP[step.id],step.id)
  const reading=m.HONORS_READING_MAP[step.id],sections=reading.sections.map(id=>m.OPENSTAX_PHYSICS.sections.find(s=>s.id===id));m.validateHonorsReading(reading);
  assert(reading.from>=sections[0].printedPage,step.id+': starts before cited section');assert(reading.to<=Math.max(...sections.map(s=>s.lastPrintedPage)),step.id+': ends beyond cited sections');
  for(const track of ['cpa','honors']){
   const d=m.buildSyllabusDrafts(step,steps,{id:track==='cpa'?id(1):id(2),name:'Fixture Physics',program:'physics',track,section:null},targets,randomUUID)
   m.validateReading(d.reading);m.validateQuiz(d.readingQuiz);m.validateQuiz(d.vocabularyQuiz)
   assert.equal(d.readingQuiz.questions.length,1+(step.prerequisites.length?1:0)+(track==='honors'?1:0))
   assert.equal(Boolean(d.reading.honors_reading),track==='honors');assert(d.readingQuiz.questions.every(q=>targets.some(t=>t.id===q.target_id)))
   drafts.push(d)
  }
 }
 fs.writeFileSync(out+'/drafts.json',JSON.stringify(drafts));fs.writeFileSync(out+'/steps.json',JSON.stringify(steps.map(s=>({...s,honorsReading:m.HONORS_READING_MAP[s.id]}))))
 console.log(`PASS: ${steps.length} prerequisite-ordered steps, both tracks, real target mappings, section/page references, recall questions, and validation.`)
 if(process.env.SYLLABUS_SKIP_DB==='1')return
 const migration=f=>fs.readFileSync(root+'/supabase/migrations/'+f,'utf8')
 const bad=q=>`begin perform ${q};raise exception 'EXPECTED FAILURE';exception when raise_exception then if sqlerrm='EXPECTED FAILURE' then raise;end if;end;`
 const setup=`begin;
 create table courses(id uuid primary key,name text,teacher_email text,program text,track text,archived_at timestamptz);
 create table students(id uuid primary key,email text,is_active boolean default true);
 create table course_students(id uuid primary key default gen_random_uuid(),course_id uuid,student_id uuid,enrollment_state text);
 create table units(id text primary key,program text);
 create table lessons(id uuid primary key,unit_id text,content_blocks jsonb,visibility_track text);
 create table learning_targets(id uuid primary key,slug text,statement text,unit_id text,domain text,program text,exclude_from_growth boolean default false);
 create table mastery_records(id uuid primary key default gen_random_uuid(),user_id uuid,user_email text,target_id uuid,level smallint,rated_by text,evidence_source text);
 create table vocabulary_sets(id uuid primary key default gen_random_uuid(),name text,description text,unit_id text,published boolean default false,archived boolean default false,created_by text);
 create table vocabulary_terms(id uuid primary key default gen_random_uuid(),vocabulary_set_id uuid references vocabulary_sets(id),term text,definition text,tier integer,order_index integer,archived boolean default false,translations jsonb,definition_es text,cognate text,icon text,example text);
 create table vocab_tasks(id uuid primary key default gen_random_uuid(),course_id uuid references courses(id),target_id uuid,title text,assigned_by text,student_ids uuid[],term_ids uuid[],words jsonb,note text,active boolean,task_kind text,check_mode text,threshold integer,min_checks integer,due_on date,created_at timestamptz default now());
 do $$begin if not exists(select 1 from pg_roles where rolname='anon')then create role anon;end if;if not exists(select 1 from pg_roles where rolname='authenticated')then create role authenticated;end if;if not exists(select 1 from pg_roles where rolname='service_role')then create role service_role;end if;end$$;
 insert into units select 'unit-'||i,'physics' from generate_series(1,8)i;
 insert into courses values('${id(1)}','CPA','teacher@test','physics','cpa',null),('${id(2)}','Honors','teacher@test','physics','honors',null);
 insert into students(id,email) values('${id(3)}','student@test'),('${id(4)}','second-student@test');
 insert into course_students(course_id,student_id,enrollment_state) values('${id(1)}','${id(3)}','ACTIVE'),('${id(2)}','${id(3)}','ACTIVE'),('${id(1)}','${id(4)}','ACTIVE');
 insert into learning_targets select x.*,false from jsonb_to_recordset(${json(targets)}) as x(id uuid,slug text,statement text,unit_id text,domain text,program text);
 ${migration('20260918020727_textbook_reading_assignments.sql')}
 ${migration('20260927010300_lesson_reading_links.sql')}
 ${migration('20260926225821_quiz_grading.sql')}
 ${migration('20260929131317_quiz_language_levels.sql')}
 alter table public.quiz_assignments add column deleted_at timestamptz;
 ${migration('20261007132230_reading_syllabus_bundles.sql')}
 ${migration('20261008162537_reading_sequence_dates.sql')}
 do $$declare b jsonb;a textbook_assignments;ans jsonb;quiz uuid;begin
 ${bad(`create_reading_syllabus_bundle(${json(drafts[0])},'outsider@test','outsider@test')`)}
 ${drafts.map(d=>`perform create_reading_syllabus_bundle(${json(d)},'teacher@test','teacher@test');`).join('\n')}
 perform create_reading_syllabus_bundle(${json(drafts[0])},'teacher@test','teacher@test');
 if (select count(*) from reading_syllabus_bundles)<>${drafts.length} then raise exception 'Duplicate retry';end if;
 if exists(select 1 from textbook_assignments where status<>'draft') or exists(select 1 from quiz_assignments where status<>'draft') or exists(select 1 from vocab_tasks where active) then raise exception 'Drafts released early';end if;
 ${bad(`release_reading_syllabus_step('${id(1)}','quantities','other@test','other@test',1,null)`)}
 ${bad(`release_reading_syllabus_step('${id(1)}','quantities','teacher@test','teacher@test',99,null)`)}
 perform release_reading_syllabus_step('${id(1)}','quantities','teacher@test','teacher@test',1,'2026-10-09T03:59:00Z');
 ${bad(`release_reading_syllabus_step('${id(1)}','quantities','teacher@test','teacher@test',1,'2026-10-10T03:59:00Z')`)}
 if (select count(*) from textbook_assignments where status='published')<>1 or (select count(*) from vocab_tasks where active)<>1 then raise exception 'Release is not scoped or retry safe';end if;
 if (select due_on from vocab_tasks where active)<>'2026-10-08'::date then raise exception 'School date mismatch';end if;
 if (select count(*) from quiz_assignments where status='published')<>1 or exists(select 1 from mastery_records) then raise exception 'Reading quiz not published correctly';end if;
 select reading_quiz_id into quiz from reading_syllabus_bundles where course_id='${id(1)}' and step_id='quantities';
 if (select due_at from quiz_assignments where id=quiz) is distinct from '2026-10-09T03:59:00Z'::timestamptz then raise exception 'New reading quiz lost deadline';end if;
 perform release_reading_syllabus_step('${id(1)}','quantities','teacher@test','teacher@test',2,'2026-10-12T03:59:00Z');
 if (select due_on from vocab_tasks where active) is distinct from '2026-10-11'::date then raise exception 'Published practice date did not change';end if;
 if (select due_at from textbook_assignments where status='published') is distinct from '2026-10-12T03:59:00Z'::timestamptz then raise exception 'Published reading date did not change';end if;
 if (select due_at from quiz_assignments where id=quiz) is distinct from '2026-10-09T03:59:00Z'::timestamptz then raise exception 'Independent quiz date changed';end if;
 perform release_reading_syllabus_step('${id(1)}','quantities','teacher@test','teacher@test',3,null);
 if exists(select 1 from textbook_assignments where status='published' and due_at is not null) or exists(select 1 from vocab_tasks where active and due_on is not null) then raise exception 'Clear date failed';end if;
 ${bad(`quiz_student_action(quiz,'${id(3)}','save','{}',0,gen_random_uuid())`)}

 select t.* into a from textbook_assignments t join reading_syllabus_bundles b on b.reading_id=t.id where b.course_id='${id(1)}' and b.step_id='quantities';
 ans:=jsonb_build_object(a.questions->0->>'id','A value and a unit describe the measured quantity.');
 perform textbook_student_action(a.id,'${id(3)}','save',ans,0,gen_random_uuid());
 ${bad(`quiz_student_action(quiz,'${id(3)}','save','{}',0,gen_random_uuid())`)}
 perform textbook_student_action(a.id,'${id(3)}','submit',ans,1,gen_random_uuid());
 perform quiz_student_action(quiz,'${id(3)}','save','{}',0,gen_random_uuid());
 ${bad(`quiz_student_action(quiz,'${id(4)}','save','{}',0,gen_random_uuid())`)}
 if (select snapshot->>'passage' from textbook_submissions where assignment_id=a.id) is distinct from a.passage then raise exception 'Course reading not in evidence snapshot';end if;
 -- Reproduce separately published reading with still-draft vocabulary practice.
 select t.* into a from textbook_assignments t join reading_syllabus_bundles b on b.reading_id=t.id where b.course_id='${id(2)}' and b.step_id='quantities';
 perform save_textbook_assignment(to_jsonb(a)||jsonb_build_object('status','published'),'teacher@test','teacher@test');
 perform release_reading_syllabus_step('${id(2)}','quantities','teacher@test','teacher@test',2,'2026-10-15T18:00:00Z');
 if (select due_on from vocab_tasks where course_id='${id(2)}' and active) is distinct from '2026-10-15'::date then raise exception 'Partial release lost date';end if;

 select t.* into a from textbook_assignments t join reading_syllabus_bundles b on b.reading_id=t.id where b.course_id='${id(2)}' and b.step_id='quantities';
 if a.honors_reading->>'from'<>'20' then raise exception 'Honors source lost';end if;
 update course_students set enrollment_state='INACTIVE' where course_id='${id(1)}';
 ${bad(`release_reading_syllabus_step('${id(1)}','rates','teacher@test','teacher@test',1,null)`)}
 if exists(select 1 from mastery_records) then raise exception 'Mastery changed';end if;
 if has_table_privilege('anon','reading_syllabus_bundles','SELECT') or has_function_privilege('authenticated','create_reading_syllabus_bundle(jsonb,text,text)','EXECUTE') then raise exception 'Public access exposed';end if;
 end $$;
 rollback;`
 execFileSync(process.env.PSQL_BIN||'/opt/homebrew/opt/postgresql@14/bin/psql',[process.env.SYLLABUS_TEST_DATABASE_URL||'postgresql://syllabus_test@127.0.0.1:55444/reading_syllabus_test','-X','-q','-v','ON_ERROR_STOP=1'],{input:setup,stdio:['pipe','inherit','inherit']})
 console.log('PASS: real Postgres bundle creation, canonical word reuse, teacher ownership, retry safety, staged release, school due dates, per-student quiz unlock only after submission (not a saved draft), course-note snapshots, Honors preservation, no-enrollment denial, and service-only permissions.')
}
main().catch(e=>{console.error(e);process.exitCode=1})
