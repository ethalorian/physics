// End-to-end local fixture: actual review/progress routes, Results reader, SQL release,
// and React views. No production credentials, external AI calls, or real students.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),assert=require('node:assert/strict');
const {execFileSync}=require('child_process'),{randomUUID}=require('crypto');
const root=path.resolve(__dirname,'..'),pkg=n=>require(root+'/node_modules/'+n);
const out=process.env.LAB_TEST_OUTPUT||fs.mkdtempSync('/private/tmp/four-dimension-labs-test-');fs.mkdirSync(out,{recursive:true});
const database='lab_rubric_'+process.pid,pg=['-h','/private/tmp','-p','55439','-U','postgres','-v','ON_ERROR_STOP=1','-At'];
const sql=(text,db=database)=>execFileSync('/opt/homebrew/bin/psql',[...pg,'-d',db],{input:text,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const q=v=>"'"+String(v).replaceAll("'","''")+"'", json=v=>q(JSON.stringify(v))+'::jsonb';
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const course=id(1),student=id(2),assignment=id(5),original=id(6),revision=id(7);
const state=global.labFixture={role:'teacher',user:student,scopeEmail:'teacher@example.test',preview:false,failSave:false,failReads:false,requests:0};
let lesson,targets,server,browser,created=false;
function rows(table){
  if(!sql(`select to_regclass(${q('public.'+table)}) is not null`).endsWith('t'))return [];
  const data=JSON.parse(sql(`select coalesce(json_agg(t),'[]') from public.${table} t`));
  if(table==='course_students')for(const r of data)r.students={name:r.student_id===student?'Alex Example':'Other Private Student',is_active:true};
  return data;
}
global.labDB={from(table){
  const filters=[],orders=[];let start=0,end=Infinity,single=false;
  const query={select(){return query},eq(k,v){filters.push(r=>r[k]===v);return query},neq(k,v){filters.push(r=>r[k]!==v);return query},ilike(k,v){filters.push(r=>r[k]?.toLowerCase()===v.toLowerCase());return query},is(k,v){filters.push(r=>(r[k]??null)===v);return query},in(k,v){filters.push(r=>v.includes(r[k]));return query},contains(k,v){filters.push(r=>v.every(x=>r[k]?.includes(x)));return query},or(){assert.equal(rows(table).length,0);return query},order(k,o){orders.push([k,o?.ascending!==false]);return query},range(a,b){start=a;end=b;return query},limit(n){end=n-1;return query},maybeSingle(){single=true;return query},then(resolve,reject){
    if(state.failReads&&table==='simulation_lab_grades')return Promise.resolve({data:null,error:new Error('Injected lab read failure')}).then(resolve,reject);
    const result=rows(table).filter(r=>filters.every(f=>f(r))).sort((a,b)=>{for(const[k,asc]of orders)if(a[k]!==b[k])return(a[k]<b[k]?-1:1)*(asc?1:-1);return 0}).slice(start,end+1);
    return Promise.resolve({data:single?result[0]??null:result,error:null}).then(resolve,reject);
  }};return query;
},async rpc(name,p){
  assert.equal(name,'release_simulation_lab_grade');if(state.failSave)return {data:null,error:{code:'offline'}};
  try{return {data:release(p),error:null}}catch(e){return {data:null,error:{code:'P0001',message:String(e.stderr).split('\n')[0].replace(/^ERROR: */,'')}}}
}};
function release(p){return JSON.parse(sql(`select release_simulation_lab_grade(${q(p.p_submission)},${q(p.p_request)},${p.p_revision},${q(p.p_reviewer)},${!!p.p_admin},${q(p.p_rubric)},${json(p.p_items)},${json(p.p_mastery)},${q(p.p_feedback)})`))}
function plugin(mocks){return {name:'fixture',setup(build){build.onResolve({filter:/.*/},args=>{const key=/(?:^|\/)supabase$/.test(args.path)?'@/lib/supabase':args.path;return Object.hasOwn(mocks,key)?{path:key,namespace:'fixture'}:undefined});build.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:mocks[args.path],loader:'tsx',resolveDir:root}))}}}
const dimensions=(lowest=4)=>['science','reasoning','communication','transfer'].map((id,i)=>({id,earned:i===3?lowest:4,possible:4,feedback:'Evidence supports this score.'}));
const rubric='lab-four-dimensions-v1';
(async()=>{
  sql('create database '+database,'postgres');created=true;
  sql(`do $$ begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon;end if;if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated;end if;if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role bypassrls;end if;end $$;
  create table courses(id uuid primary key,name text,section text,program text,track text,teacher_email text,archived_at timestamptz);
  create table course_students(id uuid default gen_random_uuid(),course_id uuid,student_id uuid,enrollment_state text);
  create table units(id text primary key,name text,program text);
  create table learning_targets(id uuid primary key,slug text unique,unit_id text,statement text,program text,lesson_id uuid);
  create table interactive_assignment_templates(slug text primary key,title text,target_slugs text[]);
  create table interactive_assignments(id uuid primary key,course_id uuid,slug text,target_id uuid,created_at timestamptz default now(),due_on text);
  create table interactive_assignment_work(assignment_id uuid,user_id uuid,state jsonb,version integer,status text,updated_at timestamptz default now(),primary key(assignment_id,user_id));
  create table interactive_assignment_submissions(id uuid primary key,assignment_id uuid,user_id uuid,state jsonb,version integer,submitted_at timestamptz default now());
  create table mastery_records(id uuid primary key default gen_random_uuid(),user_id uuid,target_id uuid,level smallint,rated_by text,evidence_source text,observed_at timestamptz default now());
  create table interactive_assignment_reviews(id uuid primary key,submission_id uuid,target_id uuid,level smallint,feedback text,reviewer_email text,record_id uuid,unique(submission_id,target_id));
  create table interactive_assignment_ai_reviews(submission_id uuid primary key,status text,result jsonb,rubric_version text,attempts integer default 0,lock_id uuid,locked_until timestamptz,error text,updated_at timestamptz);
  `);
  sql(fs.readFileSync(root+'/supabase/migrations/20261023023704_simulation_lab_grades.sql','utf8'));
  sql(fs.readFileSync(root+'/supabase/migrations/20261025170102_four_dimension_lab_grades.sql','utf8'));
  sql(fs.readFileSync(root+'/supabase/migrations/20261024160706_course_grading_terms.sql','utf8'));
  await pkg('esbuild').build({stdin:{contents:`export {POST as release} from './src/app/api/interactive-assignments/lab-grade/route';export {GET as progress} from './src/app/api/student-progress/route';export {assignmentBySlug} from './src/lib/interactive-assignments/catalog';`,resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:out+'/api.cjs',plugins:[plugin({
    'server-only':'', '@/lib/supabase':'export const supabaseAdmin=global.labDB;',
    '@/lib/api-auth':`export const withAuth=handler=>(request)=>{const s=global.labFixture;return s.role==='anonymous'?Response.json({}, {status:401}):handler(request,{role:s.role,realRole:s.role,userId:s.user,scopeEmail:s.scopeEmail,email:s.scopeEmail,viewingAsTeacher:s.preview})};`,
    '@/lib/interactive-assignments/grading-server':`export const processVelocitySubmission=async()=>({processed:false});`,
    'next/server':`export const NextResponse={json:(data,options)=>Response.json(data,options)};`,
  })]});
  const api=require(out+'/api.cjs');lesson=api.assignmentBySlug('simulation-race-track');targets=lesson.targets.map((slug,i)=>({id:id(30+i),slug,statement:'Target '+slug}));
  sql(`insert into courses values(${q(course)},'Physics','CPA','physics','cpa','teacher@example.test',null);insert into course_students(course_id,student_id,enrollment_state) values(${q(course)},${q(student)},'ACTIVE'),(${q(course)},${q(id(99))},'ACTIVE');insert into units values(${q(lesson.unit)},'Motion','physics');
  ${targets.map(t=>`insert into learning_targets(id,slug,unit_id,statement,program) values(${q(t.id)},${q(t.slug)},${q(lesson.unit)},${q(t.statement)},'physics');`).join('\n')}
  insert into interactive_assignment_templates values(${q(lesson.slug)},${q(lesson.title)},array[${lesson.targets.map(q)}]);
  insert into interactive_assignments(id,course_id,slug,target_id,due_on) values(${q(assignment)},${q(course)},${q(lesson.slug)},${q(targets[0].id)},'2026-10-20');
  insert into interactive_assignment_work(assignment_id,user_id,state,version,status) values(${q(assignment)},${q(student)},'{"answers":{},"attempts":{}}',1,'submitted');
  insert into interactive_assignment_submissions select ${q(original)},assignment_id,user_id,state,version,'2026-10-20T12:00Z' from interactive_assignment_work;
  insert into course_grading_settings(course_id,terms,placements,revision,updated_by) values(${q(course)},'[{"id":"fall","name":"Fall","start":"2026-09-01","end":"2026-11-01"},{"id":"winter","name":"Winter","start":"2026-11-02","end":"2027-01-30"}]','{}',1,'teacher@example.test');`);
  const mastery=targets.map((t,i)=>({target_id:t.id,level:i===0?2:null,feedback:i===0?'Independent evidence.':'Need individual evidence.'}));
  const base={action:'release',submissionId:original,requestId:randomUUID(),revision:0,items:dimensions(2),mastery,feedback:'Connect your evidence to a new situation.'};
  const call=async(body=base)=>api.release(new Request('http://fixture/api/interactive-assignments/lab-grade',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
  state.role='student';assert.equal((await call()).status,403);state.role='teacher';state.preview=true;assert.equal((await call()).status,403);state.preview=false;state.scopeEmail='other@example.test';assert.equal((await call()).status,404);state.scopeEmail='teacher@example.test';
  assert.equal((await call({...base,items:dimensions().slice(1)})).status,422);
  const params=b=>({p_submission:b.submissionId,p_request:b.requestId,p_revision:b.revision,p_reviewer:'teacher@example.test',p_admin:false,p_rubric:rubric,p_items:b.items,p_mastery:b.mastery,p_feedback:b.feedback});
  assert.throws(()=>release({...params(base),p_items:[...dimensions().slice(0,3),dimensions()[0]]}),/Invalid score items/);
  assert.throws(()=>release({...params(base),p_reviewer:'other@example.test'}),/Only the teacher/);
  const result=await call();assert.equal(result.status,201);assert.equal((await result.json()).grade.earned,85);
  assert.equal((await call()).status,201);assert.equal(sql('select count(*) from simulation_lab_grades'),'1');assert.equal(sql('select count(*) from mastery_records'),'1');
  assert.equal((await call({...base,feedback:'Changed payload'})).status,409);
  assert.equal((await call({...base,requestId:randomUUID()})).status,409);
  for(const[lowest,earned]of [[0,50],[1,75],[2,85],[3,89],[4,96]]){
    const current=rows('simulation_lab_grades')[0];const corrected=await call({...base,requestId:randomUUID(),revision:current.revision,items:dimensions(lowest)});assert.equal(corrected.status,201);assert.equal((await corrected.json()).grade.earned,earned);
  }
  // Keep an 85% original, then open a distinct student revision.
  await call({...base,requestId:randomUUID(),revision:rows('simulation_lab_grades')[0].revision,items:dimensions(2)});
  const prior=rows('simulation_lab_grades')[0];
  // Simulate reviewing an earlier point grade; rollback keeps the fixture original unchanged.
  const converted=sql(`begin;update simulation_lab_grades set rubric_version='lab-response-v1',items='[{"id":"q1","earned":1,"possible":1,"feedback":"Earlier evidence"}]',earned=1,possible=1;
    insert into interactive_assignment_ai_reviews(submission_id,status,result) values(${q(original)},'ready','{"lab_scores":[]}');
    select claim_interactive_assignment_ai(${q(original)},true)->>'slug';
    select (release_simulation_lab_grade(${q(original)},${q(randomUUID())},${prior.revision},'teacher@example.test',false,${q(rubric)},${json(dimensions(2))},${json(mastery)},'Reassessed four dimensions.'))->>'rubric_version';rollback;`);
  assert(converted.includes(lesson.slug),'earlier suggestions can be refreshed');assert(converted.includes(rubric),'explicit reassessment updates rubric version');
  assert.equal(rows('simulation_lab_grades')[0].earned,85);assert.equal(sql('select count(*) from mastery_records'),'1');
  assert.throws(()=>release({...params(base),p_revision:prior.revision,p_request:randomUUID(),p_rubric:'lab-response-v1'}),/Use the four-dimension rubric/);
  sql(`update interactive_assignment_work set version=2,status='draft';`);
  state.role='student';let progress=await(await api.progress(new Request('http://fixture/api/student-progress?class='+course+'&student='+id(99)))).json();
  assert(Array.isArray(progress.labEntries),JSON.stringify(progress));assert.equal(progress.labEntries.length,1);assert.equal(progress.labEntries[0].percent,85);assert.equal(progress.rows[0].grade,null);assert.equal(progress.student.id,student);assert(!JSON.stringify(progress).includes('request_id'));assert(!JSON.stringify(progress).includes('reviewer_email'));assert(!JSON.stringify(progress).includes('Other Private Student'));
  assert.deepEqual(progress.warnings,[]);state.role='teacher';assert.equal((await call({...base,requestId:randomUUID(),revision:7})).status,409);
  sql(`update interactive_assignment_work set status='submitted';insert into interactive_assignment_submissions select ${q(revision)},assignment_id,user_id,state,version,'2026-10-23T12:00Z' from interactive_assignment_work;`);
  assert.equal(sql(`select has_function_privilege('anon','release_simulation_lab_grade(uuid,uuid,integer,text,boolean,text,jsonb,jsonb,text)','EXECUTE')`),'f');
  assert.equal(sql(`select has_table_privilege('authenticated','simulation_lab_grades','SELECT')`),'f');
  assert.equal(sql(`select prosecdef from pg_proc where proname='release_simulation_lab_grade'`),'f');
  assert.equal(sql('select count(*) from mastery_records'),'1');
  await pkg('esbuild').build({stdin:{contents:`import React,{useEffect,useState} from 'react';import {createRoot} from 'react-dom/client';import LabGradeReview from './src/components/interactive-assignments/LabGradeReview';import StudentProgress from './src/components/student/StudentProgress';import StudentBannerProgress from './src/components/student/StudentBannerProgress';import {StudentProgressProvider} from './src/components/student/StudentProgressContext';const q=new URLSearchParams(location.search);function App(){const [review,setReview]=useState(null);const load=()=>fetch('/fixture-review').then(r=>r.json()).then(setReview);useEffect(()=>{if(location.pathname==='/review')load()},[]);return location.pathname==='/review'?review&&<LabGradeReview key={review.grade?.revision??0} {...review} onSaved={load}/>:<StudentProgressProvider classId=${JSON.stringify(course)} initialTerm={q.get('term')||'fall'}><div style={{padding:20,borderRadius:16,background:'var(--card)','--banner-ink':'var(--foreground)','--banner-muted':'var(--muted-foreground)'}}><StudentBannerProgress/></div><StudentProgress mode="gradebook" initialTab={q.get('tab')||undefined}/></StudentProgressProvider>}createRoot(document.getElementById('root')).render(<App/>);`,resolveDir:root,loader:'tsx'},bundle:true,format:'esm',jsx:'automatic',outfile:out+'/app.js',define:{'process.env.NODE_ENV':'"development"'},plugins:[plugin({
    'next/link':`import React from 'react';export default function Link({prefetch,...props}){return <a {...props}/>}`,
    'next-auth/react':`export const useSession=()=>({data:{user:{email:'teacher@example.test'}}});`,
    'next/navigation':`export const useSearchParams=()=>new URLSearchParams(location.search);export const useRouter=()=>({replace:url=>location.assign(url),push:url=>location.assign(url)});`,
  })]});
  const css=await pkg('postcss')([pkg('@tailwindcss/postcss/dist/index.js')({base:root})]).process(fs.readFileSync(root+'/src/app/globals.css','utf8'),{from:root+'/src/app/globals.css'});fs.writeFileSync(out+'/style.css',css.css+'\n'+fs.readFileSync(out+'/app.css','utf8'));
  server=http.createServer(async(req,res)=>{try{
    const url=new URL(req.url,'http://fixture');if(url.pathname==='/fixture-review'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({lesson,state:{answers:{},attempts:{}},submissionId:revision,targets,reviews:rows('interactive_assignment_reviews').filter(r=>r.submission_id===revision),grade:rows('simulation_lab_grades').find(r=>r.submission_id===revision)}))}
    if(url.pathname.startsWith('/api/')){let response;if(url.pathname==='/api/student-progress'){state.role='student';state.requests++;response=await api.progress(new Request('http://fixture'+url.pathname+url.search))}else{state.role='teacher';const chunks=[];for await(const c of req)chunks.push(c);response=await call(JSON.parse(Buffer.concat(chunks)))}res.writeHead(response.status,Object.fromEntries(response.headers));return res.end(await response.text())}
    if(['/app.js','/style.css'].includes(url.pathname)){res.setHeader('Content-Type',url.pathname.endsWith('.js')?'text/javascript':'text/css');return res.end(fs.readFileSync(out+url.pathname))}
    res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en" class="dark"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body style="background:var(--background);padding:16px"><main id="root" style="max-width:1100px;margin:auto"></main><script type="module" src="/app.js"></script></body></html>');
  }catch(e){console.error(e);res.writeHead(500);res.end('{}')}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
  const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));browser=await chromium.launch({headless:true,channel:'chrome'});
  const page=await browser.newPage({viewport:{width:1366,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url+'/review');
  const releaseButton=page.getByRole('button',{name:'Release grade & mastery',exact:true});await releaseButton.waitFor();assert(await releaseButton.isDisabled());
  for(const d of ['Science','Reasoning','Communication','Transfer'])await page.getByLabel('Score for '+d,{exact:true}).fill('4');
  for(let i=0;i<targets.length;i++){await page.getByLabel('Your mastery decision').nth(i).selectOption(i===0?'3':'none');await page.getByLabel('Evidence and feedback',{exact:true}).nth(i).fill(i===0?'Independent transfer explanation.':'Individual follow-up needed.')}
  await page.getByLabel('Overall student feedback').fill('Apply this evidence to the next investigation.');assert(!await releaseButton.isDisabled());
  state.failSave=true;await releaseButton.click();await page.getByText('Could not release this lab. Your draft is still available.').waitFor();assert.equal(await page.getByLabel('Score for Transfer',{exact:true}).inputValue(),'4');state.failSave=false;await releaseButton.click();await page.getByRole('region',{name:'Released lab grade'}).waitFor();assert.equal(rows('simulation_lab_grades').length,2);assert.equal(sql('select count(*) from mastery_records'),'2');
  await page.screenshot({path:out+'/teacher-release.png',fullPage:true});
  await page.goto(url+'/home/gradebook?tab=labs&term=fall');await page.getByRole('region',{name:'Grade breakdown',exact:true}).getByText('90.5%').waitFor();assert.equal(state.requests,1,'header and gradebook share one request');await page.getByRole('region',{name:'Lab grade history'}).getByText('2 released rubric entries.',{exact:false}).waitFor();
  await page.screenshot({path:out+'/student-labs-desktop.png',fullPage:true});
  await page.getByLabel('Banner grading term').selectOption('winter');await page.getByText('No released lab grades in this term.').waitFor();assert.equal(state.requests,1,'changing term does not refetch');await page.getByLabel('Banner grading term').selectOption('fall');
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/student-labs-mobile.png',fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.evaluate(()=>document.documentElement.classList.remove('dark'));await page.screenshot({path:out+'/student-labs-light.png',fullPage:true});
  state.failReads=true;await page.getByRole('button',{name:'Refresh progress'}).click();await page.getByRole('region',{name:'Overall average',exact:true}).getByText('Grade unavailable',{exact:true}).waitFor();state.failReads=false;await page.getByRole('button',{name:'Refresh progress'}).click();await page.getByRole('region',{name:'Grade breakdown',exact:true}).getByText('90.5%').waitFor();
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/verification.json',JSON.stringify({passed:true,checks:['four-dimension SQL conversion','authorization and private data','idempotent retry and stale release conflict','independent mastery','original and revision retained','real browser release with failed-save draft retention','gradebook and header average','term filtering without refetch','390px and light/dark layout','source error recovery'],screenshots:out},null,2));console.log('PASS: four-dimension lab release → SQL → student progress → header/history. Evidence: '+out);
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));if(created)sql('drop database '+database,'postgres')});
