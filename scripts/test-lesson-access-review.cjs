const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), esbuild = require(path.join(root, 'node_modules/esbuild'));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lesson-access-review-'));
let state;
class Query {
  constructor(table) { this.table = table; this.filters = []; this.orderBy = null; this.max = Infinity; this.start = 0; this.one = false; this.action = null; this.head = false; }
  select(_cols, opts) { this.head = Boolean(opts?.head); return this; }
  eq(k,v) { this.filters.push(r => r[k] === v); return this; }
  in(k,values) {
    // Production's gateway rejects the oversized URLs made by large UUID lists.
    if (values.join(',').length > 12000) throw new Error('Bad Request: oversized ID filter');
    this.filters.push(r => values.includes(r[k])); return this;
  }
  is(k,v) { this.filters.push(r => (r[k] ?? null) === v); return this; }
  gt(k,v) { this.filters.push(r => r[k] > v); return this; }
  gte(k,v) { this.filters.push(r => r[k] >= v); return this; }
  lte(k,v) { this.filters.push(r => r[k] <= v); return this; }
  like() { return this; }
  match(values) { for (const [k,v] of Object.entries(values)) this.eq(k,v); return this; }
  order(k,{ascending}={ascending:true}) { this.orderBy = {k,ascending}; return this; }
  limit(n) { this.max=n; return this; }
  range(start,end) { this.start=start; this.max=end-start+1; return this; }
  maybeSingle() { this.one=true; return this; }
  single() { this.one=true; return this; }
  insert(row) { this.action={type:'insert',rows:Array.isArray(row)?row:[row]}; return this; }
  upsert(row) { this.action={type:'upsert',rows:Array.isArray(row)?row:[row]}; return this; }
  delete() { this.action={type:'delete'}; return this; }
  then(resolve,reject) {
    try {
      if(state.failTable===this.table) return Promise.resolve({data:null,error:new Error('unavailable'),count:null}).then(resolve,reject);
      const table=state.tables[this.table] ?? (state.tables[this.table]=[]);
      let rows=table.filter(r => this.filters.every(f => f(r)));
      if(this.action?.type==='delete') { state.tables[this.table]=table.filter(r => !rows.includes(r)); rows=[]; }
      else if(this.action) {
        rows=this.action.rows.map(r => ({id:`new-${state.sequence++}`,created_at:'2026-09-07T10:00:00Z',submitted_at:'2026-09-07T10:00:00Z',...r}));
        state.tables[this.table].push(...rows); state.writes.push({table:this.table,rows});
      }
      if(this.orderBy) { const {k,ascending}=this.orderBy; rows.sort((a,b) => String(a[k]).localeCompare(String(b[k]))*(ascending?1:-1)); }
      const count=rows.length; rows=rows.slice(this.start,this.start+this.max);
      return Promise.resolve({data:this.head?null:this.one?rows[0]??null:rows,error:null,count}).then(resolve,reject);
    } catch(e) { return Promise.reject(e).then(resolve,reject); }
  }
}
function reset() {
  state={tables:{lessons:[{id:'A',slug:'a',title:'A lesson',published:true,unit_id:'unit-1',unit:'Unit 1',embedded_questions:[{correctAnswer:'SECRET'}],content_blocks:{schemaVersion:1,presentation:'physics-path',learningPath:{version:1,kind:'lesson',focus:'Motion',targetSlugs:['target-one']},blocks:[{id:'q',type:'question',capture:true,targetId:'target-one',question:{prompt:'Which?',options:[{id:'a',text:'A'},{id:'b',text:'B'}],correctOptionId:'a'}},{id:'h',type:'exit_ticket',capture:true,visibilityTrack:'honors',prompt:'Honors'}, {id:'deck',type:'deck',src:'/deck',title:'Staff'}]}}],lesson_submissions:[],lesson_reviews:[],lesson_evidence_reviews:[],students:[{id:'s',name:'Student'}],units:[{id:'unit-1',name:'Unit 1',program:'physics'}],learning_targets:[{id:'t1',slug:'target-one',statement:'Explain',unit_id:'unit-1'}]},sequence:0,writes:[],enrolled:true,track:'cpa',program:'physics',open:true,editor:false,own:true};
  global.__lessonReviewTest={from:t=>new Query(t), get state(){return state}};
}
const mocks={
  '@/lib/supabase':`export const supabaseAdmin={from:(t)=>global.__lessonReviewTest.from(t),rpc:async(name)=>{if(name==='lesson_reward_map')return {data:{},error:null};if(name==='lesson_xp_earned')return {data:0,error:null}; throw new Error('Unmocked RPC '+name)}};`,
  'next/server':`export const NextResponse={json:(data,options)=>new Response(JSON.stringify(data),{status:options?.status??200,headers:{'Content-Type':'application/json'}})};`,
  '@/lib/api-auth':`export const withAuth=(f)=>f; export const withEnrolledStudent=(f)=>f; export const withContentEditor=(_,f)=>f;`,
  '@/lib/content-access':`export const canEditArea=async()=>global.__lessonReviewTest.state.editor;`,
  '@/lib/student-enrollment':`export const getEnrollment=async()=>({enrolled:global.__lessonReviewTest.state.enrolled}); export const getStudentTrack=async()=>global.__lessonReviewTest.state.track;`,
  '@/lib/program':`export const getProgramUnitIds=async()=>['unit-1']; export const asProgram=(p)=>p??'physics'; export const PROGRAM_LABEL={physics:'Physics'}; export const getStudentProgram=async()=>global.__lessonReviewTest.state.program; export const getUnitProgramMap=async()=>new Map([['unit-1','physics']]);`,
  '@/lib/lesson-windows':`export const getStudentLessonWindowStatuses=async()=>global.__lessonReviewTest.state.windows??({A:{state:global.__lessonReviewTest.state.open?'open':'closed'}}); export const getStudentLessonGate=async()=>()=>global.__lessonReviewTest.state.open;`,
  '@/lib/teacher-scope':`export const resolveTargetStudent=async(args)=>({ok:global.__lessonReviewTest.state.own,userId:args.requestedUserId??args.selfId}); export const teacherCanAccessStudent=async()=>global.__lessonReviewTest.state.own; export const getTeacherStudentGids=async()=>['s']; export const resolveRosterScope=async()=>({gids:['s']});`,
  '@/lib/present-server':`export const validateLivePoll=async(args)=> args.presentSessionId==='session'&&args.pollRunId==='round'?{ok:true,sessionId:'session',pollRunId:'round'}:{ok:false,error:'Closed poll',status:409};`,
};
const plugin={name:'isolated-server',setup(build){build.onResolve({filter:/.*/},args=>mocks[args.path]?{path:args.path,namespace:'stub'}:undefined);build.onLoad({filter:/.*/,namespace:'stub'},args=>({contents:mocks[args.path],loader:'js'}));}};
async function load(file,name){const out=path.join(temp,name+'.cjs');await esbuild.build({entryPoints:[path.join(root,file)],outfile:out,bundle:true,platform:'node',format:'cjs',plugins:[plugin],logLevel:'silent'});return require(out);}
const student={userId:'s',email:'s@test',scopeEmail:'s@test',role:'student',realRole:'student'};
const teacher={userId:'teacher',email:'t@test',scopeEmail:'t@test',role:'teacher',realRole:'teacher'};
const req=(url,body)=>new Request('http://test'+url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);
let passed=0;async function check(name,fn){reset();await fn();passed++;console.log('PASS '+name);}
(async()=>{
 const storeModule=await load('src/lib/lesson-response-store.ts','response-store');
 const publishedRoute=await load('src/app/api/lessons/published/route.ts','published-route');
 const videoRoute=await load('src/app/api/lessons/[id]/videos/route.ts','video-route');
 const access=await load('src/lib/lesson-access.ts','access');
 const review=await load('src/lib/lesson-review.ts','review');
 const response=await load('src/lib/lesson-response-validation.ts','validation');
 const targets=await load('src/lib/lesson-targets.ts','targets');
 const blockRoute=await load('src/app/api/lessons/blocks/route.ts','blocks');
 const drafts=await load('src/app/api/lessons/drafts/route.ts','drafts');
 const submit=await load('src/app/api/lessons/submit/route.ts','submit');
 const reviewRoute=await load('src/app/api/mastery/lesson-review/route.ts','review-route');
 const workRoute=await load('src/app/api/mastery/student-work/route.ts','work-route');
 const queueRoute=await load('src/app/api/mastery/queue/route.ts','queue-route');
 const notebookAuthoring=await load('src/lib/interactive-notebook-authoring.ts','notebook-authoring');
 const center=await load('src/lib/assessment-center.ts','assessment-center');
 const gridRoute=await load('src/app/api/mastery/grid/route.ts','grid-route');
 const gradingQueue=await load('src/lib/mastery-review-queue.ts','grading-queue');
 await check('center navigation preserves class and unit without carrying another assessment ID',async()=>{
   const url=new URL(center.assessmentCenterHref('readings','reading & 1','class 2','unit=unit-1&id=quiz&block_id=old&view=quizzes'),'http://test');
   assert.equal(url.pathname,'/admin/control-room');assert.equal(url.searchParams.get('id'),'reading & 1');assert.equal(url.searchParams.get('class'),'class 2');assert.equal(url.searchParams.get('unit'),'unit-1');assert.equal(url.searchParams.has('block_id'),false);
   assert.equal(center.assessmentView('anything'),'mastery');
 });
 await check('only current lessons enter catalogs and queues while all mastery ratings remain',async()=>{
   const current=state.tables.lessons[0];
   state.tables.lessons.push({...current,id:'old',slug:'old',title:'Day 1 old lesson',content_blocks:{schemaVersion:1,blocks:current.content_blocks.blocks}});
   state.tables.learning_targets[0].lesson_id='old';
   state.tables.lesson_submissions=['A','old'].map((lesson_id,i)=>({id:'sub-'+lesson_id,user_id:'s',lesson_id,submitted_at:'2026-09-06',response_snapshot:[{lesson_id,block_id:'q',block_type:'question',response:{optionId:'a'},created_at:'2026-09-05'}]}));
   state.tables.block_responses=['A','old'].map(lesson_id=>({id:'answer-'+lesson_id,user_id:'s',lesson_id,target_id:'t1',block_id:'q',block_type:'question',response:{optionId:'a'},created_at:'2026-09-05'}));
   state.tables.mastery_records=[{user_id:'s',target_id:'t1',level:2,observed_at:'2026-09-03',evidence_source:'Earlier work'},{user_id:'s',target_id:'t1',level:3,observed_at:'2026-09-04',evidence_source:'Earlier work'}];
   const before=JSON.stringify(state.tables.mastery_records);
   const grid=await(await gridRoute.GET(req('/api/mastery/grid?unit_id=unit-1'),teacher)).json();
   assert.deepEqual(grid.lessons.map(l=>l.id),['A']);assert.equal(grid.cells.s.t1.count,2);assert(grid.cells.s.t1.value>2);
   assert.deepEqual(grid.reviewQueue.map(x=>x.lessonId),['A']);
   const queue=await(await queueRoute.GET(req('/api/mastery/queue?unit_id=unit-1'),teacher)).json();
   assert.deepEqual(queue.submissions.map(x=>x.lesson_id),['A']);assert.deepEqual(queue.evidence.map(x=>x.lesson_id),['A']);
   const work=await(await workRoute.GET(req('/api/mastery/student-work?unit_id=unit-1&user_id=s&target_id=t1'),teacher)).json();
   assert.deepEqual(work.submissions.map(x=>x.lessonId),['A']);assert(work.work.every(x=>x.lessonId==='A'));assert.equal(work.records.length,2);
   assert.equal((await workRoute.GET(req('/api/mastery/student-work?unit_id=unit-1&user_id=s&lesson_id=old'),teacher)).status,404);
   const published=await(await publishedRoute.GET(req('/api/lessons/published'),teacher)).json();assert.deepEqual(published.lessons.map(l=>l.id),['A']);
   assert.equal(JSON.stringify(state.tables.mastery_records),before);assert.equal(state.writes.length,0);
 });
 await check('pending counts and grading walk preserve distinct lessons sharing one target',async()=>{
   const items=[{studentId:'s',targetId:'t1',lessonId:'A',submissionId:'one'},{studentId:'s',targetId:'t1',lessonId:'B',submissionId:'two'},{studentId:'outside',targetId:'t1',lessonId:'A'}];
   const scope={studentIds:['s'],targetIds:['t1']};assert.equal(gradingQueue.filterReviewQueue(items,scope).length,2);
   assert.deepEqual(gradingQueue.filterReviewQueue(items,{...scope,lessonId:'B'}),[items[1]]);
   assert.equal(gradingQueue.filterReviewQueue(items,{...scope,lessonId:'unopened'}).length,0);
   assert.equal(gradingQueue.filterReviewQueue(items,{...scope,excluded:new Set([gradingQueue.reviewItemKey(items[0])])}).length,1);
 });
 await check('returned lessons retain unrated status and only their exact submission ratings count',async()=>{
   state.tables.lesson_submissions=[{id:'sub',user_id:'s',lesson_id:'A',submitted_at:'2026-09-06'}];
   state.tables.lesson_reviews=[{submission_id:'sub',reviewed_at:'2026-09-07',feedback:'Explain the direction.'}];
   state.tables.mastery_evidence_reviews=[{id:'old',user_id:'s',lesson_id:'A',target_id:'t1',submission_id:'older'}];
   const fetchQueue=async()=>await(await queueRoute.GET(req('/api/mastery/queue?unit_id=unit-1'),teacher)).json();
   let d=await fetchQueue();assert.equal(d.submissions.length,0);assert.equal(d.returned.length,1);assert.equal(d.returned[0].ratingCount,0);assert.equal(d.returned[0].feedback,'Explain the direction.');
   state.tables.mastery_evidence_reviews.push({id:'new',user_id:'s',lesson_id:'A',target_id:'t1',submission_id:'sub'});
   d=await fetchQueue();assert.equal(d.returned[0].ratingCount,1);
   state.tables.lesson_submissions.push({id:'resub',user_id:'s',lesson_id:'A',submitted_at:'2026-09-08'});
   d=await fetchQueue();assert.equal(d.returned.length,0);assert.equal(d.submissions[0].id,'resub');assert.equal(d.submissions[0].ratingCount,0);assert.equal(state.writes.length,0);
 });
 await check('video evidence follows its stable unit and target even when the display name changes',async()=>{
   state.tables.lessons[0].unit='An older unit title';state.tables.lessons[0].content_blocks.blocks=[{id:'q',type:'question',capture:true,targetId:'target-one',question:{prompt:'Which way?',options:[{id:'a',text:'Positive'}],correctOptionId:'a'}}];
   assert.equal((await blockRoute.POST(req('/api/lessons/blocks',{lesson_id:'A',block_id:'q',response:{optionId:'a',explain:'The final position is greater.'}}),student)).status,201);
   const d=await(await workRoute.GET(req('/api/mastery/student-work?unit_id=unit-1&user_id=s&lesson_id=A&target_id=t1'),teacher)).json();
   assert.equal(d.work.length,1);assert.equal(d.work[0].targetLinked,true);assert.match(d.work[0].prompt,/Which way/);assert.equal(d.work[0].response.explain,'The final position is greater.');
 });
 await check('notebook answers use the existing save, snapshot, teacher review and revision pipeline',async()=>{
   const document=notebookAuthoring.createUnitsNotebook('target-one');state.tables.lessons[0].content_blocks=document;
   for(const block of document.blocks.filter(b=>b.type==='question')){
     const res=await blockRoute.POST(req('/api/lessons/blocks',{lesson_id:'A',block_id:block.id,response:{mode:'choice',optionId:'A',autoCheck:'match'}}),student);
     assert.equal(res.status,201);
   }
   assert.equal((await submit.POST(req('/api/lessons/submit',{lesson_id:'A'}),student)).status,422,'Reflection is required');
   await blockRoute.POST(req('/api/lessons/blocks',{lesson_id:'A',block_id:'units-reflection',response:{text:'Velocity uses length divided by time, so m/s describes a rate of change of position.'}}),student);
   const rows=state.tables.block_responses;assert.equal(rows.length,6);assert.equal(rows[0].response.autoCheck,'mismatch');assert.ok(rows.every(r=>r.target_id==='t1'&&['question','exit_ticket'].includes(r.block_type)));
   assert.equal((await submit.POST(req('/api/lessons/submit',{lesson_id:'A'}),student)).status,201);
   const sub=state.tables.lesson_submissions[0];sub.response_snapshot=JSON.parse(JSON.stringify(rows));
   assert.deepEqual(sub.content_snapshot.interactiveNotebook,document.interactiveNotebook);
   const work=await(await workRoute.GET(req('/api/mastery/student-work?unit_id=unit-1&user_id=s&lesson_id=A&submission_id='+sub.id),teacher)).json();
   assert.equal(work.work.length,6);assert.match(work.work.find(w=>w.blockId==='units-check-1').prompt,/Which pair has the same dimensions\?[\s\S]*B: Impulse and momentum/);
   assert.equal((await blockRoute.POST(req('/api/lessons/blocks',{lesson_id:'A',block_id:'units-check-1',response:{optionId:'B'}}),student)).status,409);
   assert.equal((await reviewRoute.POST(req('/api/mastery/lesson-review',{submission_id:sub.id,feedback:'Explain the shared dimensions.'}),teacher)).status,200);
   assert.equal((await blockRoute.POST(req('/api/lessons/blocks',{lesson_id:'A',block_id:'units-check-1',response:{optionId:'B'}}),student)).status,201);
   assert.equal(sub.response_snapshot[0].response.optionId,'A');assert.ok(!state.writes.some(w=>w.table==='mastery_records'));
 });
 await check('notebook drafts remain recoverable and cannot be silently omitted on submission',async()=>{
   state.tables.lessons[0].content_blocks=notebookAuthoring.createUnitsNotebook('target-one');
   const body={lesson_id:'A',drafts:[{block_id:'units-check-1',block_type:'question',response:{mode:'choice',optionId:'B'}}]};
   assert.equal((await drafts.POST(req('/api/lessons/drafts',body),student)).status,200);
   assert.equal((await submit.POST(req('/api/lessons/submit',{lesson_id:'A'}),student)).status,422);
   assert.equal(state.tables.block_drafts[0].response.optionId,'B');assert.equal((state.tables.block_responses??[]).length,0);
   state.open=false;assert.equal((await blockRoute.POST(req('/api/lessons/blocks',{lesson_id:'A',block_id:'units-check-1',response:{optionId:'B'}}),student)).status,403);
 });
 await check('a full review queue preserves submissions, repairs and review state across ID batches',async()=>{
   const id=i=>'00000000-0000-4000-8000-'+String(i).padStart(12,'0');
   state.tables.block_responses=Array.from({length:1000},(_,i)=>({id:id(i),user_id:'s',lesson_id:'A',target_id:null,block_id:'q-'+i,block_type:'question',response:{explain:'Saved answer'},created_at:'2026-09-07',evidence_source:'lesson'}));
   state.tables.lesson_evidence_links=[0,100,999].map(i=>({response_id:id(i),lesson_id:'A',target_id:'t1'}));
   state.tables.lesson_evidence_reviews=[0,100].map(i=>({response_id:id(i)}));
   state.tables.lesson_submissions=Array.from({length:1000},(_,i)=>({id:id(2000+i),user_id:'s',lesson_id:'A',submitted_at:new Date(Date.UTC(2026,8,1,0,0,i)).toISOString()}));
   state.tables.lesson_reviews=[{submission_id:id(2998)}];
   const data=await (await queueRoute.GET(req('/api/mastery/queue?unit_id=unit-1'),teacher)).json();
   assert.equal(data.submissions.length,1);
   assert.equal(data.submissions[0].id,id(2999));
   assert.equal(data.evidence.length,998);
   assert.equal(data.evidence.find(e=>e.id===id(999)).target_id,'t1');
   assert.equal(data.evidenceMayBeTruncated,true);
   assert.equal(state.writes.length,0);
 });
 await check('an evidence-link lookup failure cannot silently omit saved work',async()=>{
   state.tables.block_responses=Array.from({length:150},(_,i)=>({id:'response-'+i,user_id:'s',lesson_id:'A',block_id:'q-'+i,created_at:'2026-09-07'}));
   state.failTable='lesson_evidence_links';
   await assert.rejects(()=>queueRoute.GET(req('/api/mastery/queue?unit_id=unit-1'),teacher));
   assert.equal(state.writes.length,0);
 });
 await check('student reader filters track, teacher deck, answer keys and legacy answers',async()=>{const a=await access.authorizeLesson(student,'A');assert.equal(a.ok,true);assert.deepEqual(a.document.blocks.map(b=>b.id),['q']);assert.equal(a.document.blocks[0].question.correctOptionId,undefined);assert.equal(a.document.blocks[0].question.autoCheckable,true);assert.equal(access.lessonForReader(a.lesson,a.document).embedded_questions,undefined);});
 for(const [name,change,status] of [['unenrolled',()=>state.enrolled=false,403],['closed window',()=>state.open=false,403],['unpublished',()=>state.tables.lessons[0].published=false,404],['wrong program',()=>state.program='trades',404],['wrong whole-lesson track',()=>state.tables.lessons[0].visibility_track='honors',404]]) await check(name+' denied for reads and writes',async()=>{change();for(const write of [false,true]){const a=await access.authorizeLesson(student,'A',write);assert.equal(a.ok,false);assert.equal(a.response.status,status);}});
 await check('observer and staff/editor previews cannot create student evidence',async()=>{assert.equal((await access.authorizeLesson({...student,realRole:'observer'},'A')).ok,true);assert.equal((await access.authorizeLesson({...student,realRole:'observer'},'A',true)).ok,false);assert.equal((await access.authorizeLesson(teacher,'A')).ok,true);assert.equal((await access.authorizeLesson(teacher,'A',true)).ok,false);state.editor=true;assert.equal((await access.authorizeLesson(student,'A',true)).ok,false);});

 const addVideo=()=>state.tables.lessons[0].content_blocks.blocks.unshift({id:'video',type:'instruction_video',youtubeId:'Z1qFlfqlS_E',title:'Units',summary:'Measure consistently.',transcript:'A unit describes a measurement.',xp:10,gate:true});
 await check('unassigned videos can be watched without exposing questions or allowing writes',async()=>{
   addVideo();state.open=false;state.windows={};
   const watched=await access.authorizeLesson(student,'A',false,false,'watch');assert(watched.ok);
   assert.equal(watched.document.blocks.length,1);assert.equal(watched.document.blocks[0].type,'instruction_video');
   const text=JSON.stringify(watched.document);for(const key of ['Which?','correctOptionId','Honors','targetId','xp','gate','learningPath'])assert(!text.includes(key),key);
   assert.equal((await access.authorizeLesson(student,'A')).ok,false);
   assert.equal((await access.authorizeLesson(student,'A',true)).ok,false);
   assert.equal((await access.authorizeLesson(student,'A',true,false,'watch')).ok,false);
   assert.equal((await blockRoute.POST(req('/api/lessons/blocks',{lesson_id:'A',block_id:'q',block_type:'question',response:{optionId:'a'}}),student)).status,403);
   assert.equal((await submit.POST(req('/api/lessons/submit',{lesson_id:'A'}),student)).status,403);
   assert.equal(state.writes.length,0);
 });
 for(const [name,change] of [['unenrolled',()=>state.enrolled=false],['draft',()=>state.tables.lessons[0].published=false],['wrong track',()=>state.tables.lessons[0].visibility_track='honors'],['wrong program',()=>state.program='trades'],['hidden video',()=>state.tables.lessons[0].content_blocks.blocks[0].visibilityTrack='honors']]) await check('watch access still denies '+name,async()=>{addVideo();change();assert.equal((await access.authorizeLesson(student,'A',false,false,'watch')).ok,false);assert.equal(state.writes.length,0)});
 await check('opening calendar work preserves the full question and submission flow',async()=>{
   addVideo();const a=await access.authorizeLesson(student,'A');assert(a.ok);assert(a.document.blocks.some(b=>b.id==='q'));
   const r=await blockRoute.POST(req('/api/lessons/blocks',{lesson_id:'A',block_id:'q',block_type:'question',response:{optionId:'a'}}),student);assert.equal(r.status,201);assert(state.writes.some(w=>w.table==='block_responses'));
 });
 await check('watch route rejects classroom investigations even if they contain a video',async()=>{addVideo();state.tables.lessons[0].content_blocks.learningPath.kind='investigation';assert.equal((await access.authorizeLesson(student,'A',false,false,'watch')).ok,false)});
 await check('observer can browse published lessons and map across programs and tracks without enrollment or release windows',async()=>{
   const observer={...student,userId:'observer',role:'observer',realRole:'observer'};
   state.enrolled=false;state.open=false;state.windows={};state.editor=true;
   const original=state.tables.lessons[0];
   state.tables.lessons.push({...original,id:'honors',slug:'honors',visibility_track:'honors'}, {...original,id:'trades',slug:'trades',unit_id:'trade-1'}, {...original,id:'draft',slug:'draft',published:false});
   state.failTable='lesson_progress'; // Browsing must not load observer/student progress.
   const res=await publishedRoute.GET(req('/api/lessons/published?program=trades&track=cpa'),observer);
   assert.equal(res.status,200);const data=await res.json();
   assert.deepEqual(data.lessons.map(l=>l.id).sort(),['A','honors','trades']);
   assert.deepEqual(data.conceptMap.nodes.map(l=>l.id).sort(),['A','honors','trades']);
   assert(data.conceptMap.nodes.every(n=>n.access==='open'&&n.href&&n.progress===0&&!n.completion));
   assert(data.lessons.every(l=>l.window.state==='open'&&!l.content_blocks&&!l.embedded_questions));
   assert.equal(data.isAdmin,false);assert.deepEqual(data.progress,{});
   for(const id of ['A','honors','trades']) {
     const read=await access.authorizeLesson(observer,id);assert.equal(read.ok,true);assert.equal(read.viewer.role,'admin');
     assert.equal((await videoRoute.GET(req('/api/lessons/'+id+'/videos'),{...observer,params:Promise.resolve({id})})).status,200);
   }
   assert.equal((await access.authorizeLesson(observer,'draft')).response.status,404);
   assert.equal((await videoRoute.GET(req('/api/lessons/draft/videos'),{...observer,params:Promise.resolve({id:'draft'})})).status,404);
   assert.equal(state.writes.length,0);
 });
 await check('observer cannot save drafts, answers, live evidence, or submit lessons',async()=>{
   const observer={...student,role:'observer',realRole:'observer'};
   assert.equal((await drafts.POST(req('/api/lessons/drafts',{lesson_id:'A',drafts:[{block_id:'q',response:{optionId:'a'}}]}),observer)).status,403);
   assert.equal((await blockRoute.POST(req('/api/lessons/blocks',{lesson_id:'A',block_id:'q',response:{optionId:'a'}}),observer)).status,403);
   assert.equal((await access.authorizeLesson(observer,'A',true,true)).response.status,403);
   assert.equal((await submit.POST(req('/api/lessons/submit',{lesson_id:'A'}),observer)).status,403);
   assert.equal(state.writes.length,0);
 });
 await check('reviewing A never clears B even with one shared target',async()=>{const rows=[{id:'a',user_id:'s',lesson_id:'A',submitted_at:'2026-09-06'},{id:'b',user_id:'s',lesson_id:'B',submitted_at:'2026-09-06'},{id:'old',user_id:'s',lesson_id:'A',submitted_at:'2026-09-05'}];assert.deepEqual(review.pendingLessonSubmissions(rows,new Set(['a'])).map(r=>r.id),['b']);});
 await check('all lessons including targetless lessons lock until their exact submission is reviewed',async()=>{state.tables.lesson_submissions=[{id:'sub',user_id:'s',lesson_id:'A',submitted_at:'2026-09-06'}];state.tables.lesson_reviews=[{submission_id:'different'}];assert.equal((await review.submissionStatus('s','A')).locked,true);assert.equal((await access.authorizeLesson(student,'A',true)).response.status,409);state.tables.lesson_reviews.push({submission_id:'sub'});assert.equal((await review.submissionStatus('s','A')).locked,false);});
 await check('review lookup failure fails closed',async()=>{state.tables.lesson_submissions=[{id:'sub',user_id:'s',lesson_id:'A',submitted_at:'2026-09-06'}];state.failTable='lesson_reviews';await assert.rejects(()=>access.authorizeLesson(student,'A',true));});
 await check('plural, UUID and singular target references share one resolver',()=>{assert.deepEqual(targets.targetSlugsInBlocks({blocks:[null,{targetId:'a',targets:['b','a']},{targetIds:['c']}]}),['a','b','c']);assert.deepEqual(targets.lessonsByTarget([{id:'A',content_blocks:{blocks:[{targetId:'uuid'}]}}],[{id:'uuid',slug:'slug',lesson_id:null}]).get('uuid'),['A']);});
 await check('forged autoCheck metadata and invalid choices cannot satisfy a gate',()=>{const b=state.tables.lessons[0].content_blocks.blocks[0];assert.equal(response.checkedLessonResponse(b,{optionId:'b',autoCheck:'match'}).response.autoCheck,'mismatch');assert.equal(response.checkedLessonResponse(b,{autoCheck:'match',explain:'text'}).response.autoCheck,undefined);assert.equal(response.checkedLessonResponse(b,{optionId:'invented',autoCheck:'match'}).ok,false);});
 await check('draft batches reject hidden and deleted blocks atomically',async()=>{const res=await drafts.POST(req('/api/lessons/drafts',{lesson_id:'A',drafts:[{block_id:'q',response:{explain:'yes'}},{block_id:'h',response:{text:'hidden'}}]}),student);assert.equal(res.status,422);assert.equal(state.writes.length,0);});
 await check('explicit intentional-empty drafts persist without evidence',async()=>{const res=await drafts.POST(req('/api/lessons/drafts',{lesson_id:'A',drafts:[{block_id:'q',response:{explain:'',optionId:null}}]}),student);assert.equal(res.status,200);assert.equal(state.tables.block_drafts[0].response.explain,'');assert.equal(state.tables.block_responses?.length??0,0);});
 await check('pending submission freezes direct block and draft writes',async()=>{state.tables.lesson_submissions=[{id:'sub',user_id:'s',lesson_id:'A',submitted_at:'2026-09-06'}];assert.equal((await blockRoute.POST(req('/api/lessons/blocks',{lesson_id:'A',block_id:'q',response:{optionId:'b'}}),student)).status,409);assert.equal((await drafts.POST(req('/api/lessons/drafts',{lesson_id:'A',drafts:[{block_id:'q',response:{explain:'changed'}}]}),student)).status,409);assert.equal(state.writes.length,0);});
 await check('only an exact live poll session/run bypasses homework freeze',async()=>{state.tables.lesson_submissions=[{id:'sub',user_id:'s',lesson_id:'A',submitted_at:'2026-09-06'}];const body={lesson_id:'A',block_id:'q',response:{optionId:'a'},evidence_source:'live_poll'};assert.equal((await blockRoute.POST(req('/api/lessons/blocks',body),student)).status,409);assert.equal((await blockRoute.POST(req('/api/lessons/blocks',{...body,presentSessionId:'session',pollRunId:'round'}),student)).status,201);const saved=state.tables.block_responses[0];assert.equal(saved.present_session_id,'session');assert.equal(saved.poll_run_id,'round');assert.equal(saved.response.autoCheck,'match');});
 await check('physics submission requires visible required responses but accepts a wrong attempt and unfinished optional work',async()=>{
   state.tables.lessons[0].content_blocks.blocks.push({id:'optional',type:'exit_ticket',prompt:'Optional',requiredForCompletion:false});
   let result=await submit.POST(req('/api/lessons/submit',{lesson_id:'A'}),student);assert.equal(result.status,422);assert.deepEqual((await result.json()).missingBlockIds,['q']);assert.equal(state.writes.length,0);
   await blockRoute.POST(req('/api/lessons/blocks',{lesson_id:'A',block_id:'q',response:{optionId:'b'}}),student);
   assert(state.tables.lesson_progress.at(-1).progress_percentage<100);assert.equal(state.tables.lesson_progress.at(-1).status,'in_progress');
   const before=await(await publishedRoute.GET(req('/api/lessons/published'),student)).json();assert.equal(before.lessons[0].completion.state,'ready');assert(before.lessons[0].progress<100);
   result=await submit.POST(req('/api/lessons/submit',{lesson_id:'A'}),student);assert.equal(result.status,201);assert.equal(state.tables.lesson_progress.at(-1).progress_percentage,100);
   const after=await(await publishedRoute.GET(req('/api/lessons/published'),student)).json();assert.equal(after.lessons[0].completion.state,'submitted');assert.equal(after.lessons[0].progress,100);
   assert.equal((await submit.POST(req('/api/lessons/submit',{lesson_id:'A'}),student)).status,409);
 });
 await check('submission does not proceed when required-answer validation cannot load',async()=>{state.failTable='block_responses';await assert.rejects(()=>submit.POST(req('/api/lessons/submit',{lesson_id:'A'}),student));assert.equal(state.writes.length,0)});
 await check('submit rejects unsaved drafts and staff impersonation',async()=>{state.tables.block_drafts=[{user_id:'s',lesson_id:'A',block_id:'q',response:{explain:''}}];assert.equal((await submit.POST(req('/api/lessons/submit',{lesson_id:'A'}),student)).status,422);assert.equal((await submit.POST(req('/api/lessons/submit',{lesson_id:'A'}),teacher)).status,403);assert.equal(state.writes.length,0);});
 await check('explicit review is own-roster only and does not write mastery',async()=>{state.tables.lesson_submissions=[{id:'sub',user_id:'s',lesson_id:'A'}];state.own=false;assert.equal((await reviewRoute.POST(req('/api/mastery/lesson-review',{submission_id:'sub'}),teacher)).status,403);state.own=true;assert.equal((await reviewRoute.POST(req('/api/mastery/lesson-review',{submission_id:'sub'}),teacher)).status,200);assert.deepEqual(state.writes.map(w=>w.table),['lesson_reviews']);});
 await check('teacher sees immutable submitted response after later evidence saves',async()=>{state.tables.lesson_submissions=[{id:'sub',user_id:'s',lesson_id:'A',submitted_at:'2026-09-06',response_snapshot:[{lesson_id:'A',block_id:'q',block_type:'question',response:{optionId:'a'},created_at:'2026-09-05'}],content_snapshot:{schemaVersion:1,blocks:[]}}];state.tables.block_responses=[{id:'later',user_id:'s',lesson_id:'A',block_id:'q',block_type:'question',response:{optionId:'b'},created_at:'2026-09-07'}];const res=await workRoute.GET(req('/api/mastery/student-work?unit_id=unit-1&user_id=s&lesson_id=A&submission_id=sub'),teacher);const data=await res.json();assert.equal(data.work[0].response.optionId,'a');assert.equal(data.work[0].submissionId,'sub');});
 await check('unlinked and untargeted evidence remains visible with source-aware review',async()=>{state.tables.block_responses=[{id:'e',user_id:'s',lesson_id:null,target_id:null,block_id:'lobby:x',block_type:'exit_ticket',response:{text:'Group explanation'},created_at:'2026-09-07',evidence_source:'lobby'}];let res=await queueRoute.GET(req('/api/mastery/queue?unit_id=unit-1&evidence_source=lobby'),teacher);let data=await res.json();assert.equal(data.evidence[0].unlinked,true);assert.equal(data.evidence[0].untargeted,true);assert.equal(data.submissions.length,0);await reviewRoute.POST(req('/api/mastery/lesson-review',{response_id:'e'}),teacher);res=await queueRoute.GET(req('/api/mastery/queue?unit_id=unit-1&evidence_source=lobby'),teacher);assert.equal((await res.json()).evidence.length,0);});
 await check('historical evidence attribution repair overlays context without rewriting evidence',async()=>{state.tables.block_responses=[{id:'e',user_id:'s',lesson_id:null,target_id:null,block_id:'lobby:x',block_type:'exit_ticket',response:{text:'Group explanation'},created_at:'2026-09-07',evidence_source:'lobby'}];const res=await reviewRoute.POST(req('/api/mastery/lesson-review',{action:'link',response_id:'e',lesson_id:'A',target_id:'t1'}),teacher);assert.equal(res.status,200);assert.equal(state.tables.block_responses[0].lesson_id,null);assert.equal(state.tables.block_responses[0].target_id,null);assert.deepEqual(state.writes.map(w=>w.table),['lesson_evidence_links']);const queue=await (await queueRoute.GET(req('/api/mastery/queue?unit_id=unit-1'),teacher)).json();assert.equal(queue.evidence[0].unlinked,false);assert.equal(queue.evidence[0].untargeted,false);const work=await (await workRoute.GET(req('/api/mastery/student-work?unit_id=unit-1&user_id=s&mode=evidence'),teacher)).json();assert.equal(work.work[0].lessonId,'A');});
 await check('evidence repair denies outside-roster work and unrelated target reassignment',async()=>{state.tables.block_responses=[{id:'e',user_id:'s',lesson_id:'A',target_id:null}];state.own=false;assert.equal((await reviewRoute.POST(req('/api/mastery/lesson-review',{action:'link',response_id:'e',target_id:'t1'}),teacher)).status,403);state.own=true;assert.equal((await reviewRoute.POST(req('/api/mastery/lesson-review',{action:'link',response_id:'e',lesson_id:'B',target_id:'t1'}),teacher)).status,422);assert.equal(state.writes.length,0);});
 await check('legacy submissions use a cutoff instead of the newest response',async()=>{state.tables.lesson_submissions=[{id:'old',user_id:'s',lesson_id:'A',submitted_at:'2026-09-06',response_snapshot:null,content_snapshot:null}];state.tables.block_responses=[{id:'before',user_id:'s',lesson_id:'A',block_id:'q',response:{optionId:'a'},created_at:'2026-09-05'},{id:'after',user_id:'s',lesson_id:'A',block_id:'q',response:{optionId:'b'},created_at:'2026-09-07'}];const data=await (await workRoute.GET(req('/api/mastery/student-work?unit_id=unit-1&user_id=s'),teacher)).json();assert.equal(data.work[0].response.optionId,'a');assert.equal(data.submissions[0].legacySnapshot,true);});
 await check('transfer hydration selects the task from the lesson program',async()=>{state.tables.mastery_tasks=[{id:'right',slug:'transfer',program:'physics',prompt:'Physics transfer',rubric:{}},{id:'wrong',slug:'transfer',program:'trades',prompt:'Trades transfer',rubric:{}}];const doc=await access.hydrateLessonDocument({schemaVersion:1,blocks:[{id:'x',type:'transfer_prompt',masteryTaskSlug:'transfer'}]},'unit-1');assert.equal(doc.blocks[0].task.id,'right');assert.equal(doc.blocks[0].task.prompt,'Physics transfer');});
 await check('canonical vocabulary hydrates context into immutable reader and submission content',async()=>{state.tables.vocabulary_terms=[{id:'word',term:'position',definition:'Base definition',cognate:null,archived:false,contexts:{v:{definition:'Location relative to this investigation origin.',cognate:'posición'}}}];const original={schemaVersion:1,presentation:'trades-workshop',blocks:[{id:'v',type:'vocab',terms:[],termIds:['word']}]};const hydrated=await access.hydrateLessonDocument(original,null);assert.equal(hydrated.presentation,'trades-workshop');assert.deepEqual(hydrated.blocks[0].termIds,['word']);assert.deepEqual(hydrated.blocks[0].terms,[{term:'position',definition:'Location relative to this investigation origin.',cognate:'posición'}]);assert.deepEqual(original.blocks[0].terms,[]);state.tables.vocabulary_terms[0].contexts.v.definition='Later edit';assert.equal(hydrated.blocks[0].terms[0].definition,'Location relative to this investigation origin.');state.failTable='vocabulary_terms';await assert.rejects(()=>access.hydrateLessonDocument(original,null));});
 await check('retired local block drafts cannot poison the next valid autosave batch',async()=>{const entries=new Map();const key=storeModule.draftStorageKey('s','A');entries.set(key,JSON.stringify({q:{response:{explain:'valid'},block_type:'question',updated_at:'2026-09-07T10:00:00Z'},hidden:{response:{text:'old track'},block_type:'exit_ticket',updated_at:'2026-09-07T10:00:00Z'}}));const storage={getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)};const sent=[];const store=new storeModule.LessonResponseStore('s','A',()=>true,async(url,options)=>{if(options?.method==='POST'){const body=JSON.parse(options.body);sent.push(body);return {ok:true,json:async()=>({saved:body.drafts.length})};}return {ok:true,json:async()=>url.includes('/blocks?')?{responses:{}}:{drafts:{},valid_block_ids:['q']}};},()=>storage);await store.load();assert.deepEqual(Object.keys(store.getSnapshot().responses),['q']);await store.flush();assert.deepEqual(sent[0].drafts.map(d=>d.block_id),['q']);store.dispose();});
 await check('independent live poll rounds retain separate quick-review entries',async()=>{state.tables.block_responses=['round-1','round-2'].map((round,i)=>({id:'poll-'+i,user_id:'s',lesson_id:'A',target_id:'t1',block_id:'q',block_type:'question',response:{optionId:'a'},created_at:'2026-09-07T10:00:0'+i+'Z',evidence_source:'live_poll',present_session_id:'session',poll_run_id:round}));const data=await (await queueRoute.GET(req('/api/mastery/queue?unit_id=unit-1&evidence_source=live_poll'),teacher)).json();assert.equal(data.evidence.length,2);});
 await check('student published-list history contains no bodies or answer-bearing legacy fields',async()=>{state.open=false;const res=await publishedRoute.GET(req('/api/lessons/published'),student);assert.equal(res.status,200);const lesson=(await res.json()).lessons[0];assert.equal(lesson.id,'A');assert.equal(lesson.window.state,'closed');for(const field of ['content_blocks','embedded_questions','generation_metadata','check_for_understanding','videos'])assert.equal(lesson[field],undefined,field);state.tables.lessons[0].visibility_track='honors';assert.equal((await (await publishedRoute.GET(req('/api/lessons/published'),student)).json()).lessons.length,0);});
 await check('video deep link uses publication and release gates',async()=>{state.tables.lessons[0].published=false;assert.equal((await videoRoute.GET(req('/api/lessons/A/videos'),{...student,params:Promise.resolve({id:'A'})})).status,404);state.tables.lessons[0].published=true;state.open=false;assert.equal((await videoRoute.GET(req('/api/lessons/A/videos'),{...student,params:Promise.resolve({id:'A'})})).status,403);});
 await check('target evidence uses original prompts and excludes explicitly unrelated answers',async()=>{
   state.tables.learning_targets.push({id:'t2',slug:'other',unit_id:'unit-1',lesson_id:'B',statement:'Other target'});
   state.tables.lesson_submissions=[{id:'sub',user_id:'s',lesson_id:'A',submitted_at:'2026-09-06',content_snapshot:{blocks:[{id:'q',type:'question',targetId:'t1',question:{prompt:'Original prompt',options:[{id:'a',text:'Original choice'}]}},{id:'unrelated',targetId:'t2'}]},response_snapshot:[{lesson_id:'A',block_id:'q',response:{optionId:'a'},created_at:'2026-09-05'},{lesson_id:'A',block_id:'unrelated',response:{text:'Unrelated'},created_at:'2026-09-05'}]}];
   const data=await (await workRoute.GET(req('/api/mastery/student-work?unit_id=unit-1&user_id=s&target_id=t1'),teacher)).json();
   assert.equal(data.work.length,1);assert.equal(data.work[0].prompt,'Original prompt\na: Original choice');assert.equal(data.work[0].targetLinked,true);
   const lesson=await (await workRoute.GET(req('/api/mastery/student-work?unit_id=unit-1&user_id=s&lesson_id=A'),teacher)).json();
   assert(lesson.targets.some(t=>t.id==='t1'));assert(lesson.targets.some(t=>t.id==='t2'));
 });

 await check('concept map exposes unreleased current lessons without exposing locked content',async()=>{
   const original=state.tables.lessons[0];
   const doc={...original.content_blocks,presentation:'physics-path',learningPath:{kind:'lesson',focus:'A meaningful measurement'},blocks:[{id:'video',type:'instruction_video',youtubeId:'Z1qFlfqlS_E'},...original.content_blocks.blocks]};
   state.tables.lessons=[{...original,content_blocks:doc},{...original,id:'B',slug:'b',title:'Second lesson',content_blocks:{...doc,blocks:[{id:'video',type:'instruction_video',youtubeId:'vf7X7mmJfsE'},...original.content_blocks.blocks]}},
     {...original,id:'draft',published:false,content_blocks:doc},{...original,id:'honors',visibility_track:'honors',content_blocks:doc},{...original,id:'other-program',unit_id:'trade-1',content_blocks:doc},{...original,id:'legacy',content_blocks:{schemaVersion:1,blocks:original.content_blocks.blocks}}];
   const data=await(await publishedRoute.GET(req('/api/lessons/published'),student)).json();
   assert.deepEqual(data.lessons.map(l=>l.id),['A','B']);
   assert.deepEqual(data.conceptMap.nodes.map(l=>l.id),['A','B']);
   assert.deepEqual(data.conceptMap.nodes.map(l=>l.watchHref),['/lessons/a/watch','/lessons/b/watch']);
   assert.equal(data.conceptMap.nodes[0].href,'/lessons/a');
   assert.equal(data.conceptMap.nodes[1].access,'locked');assert.equal(data.conceptMap.nodes[1].href,undefined);
   assert.deepEqual(data.conceptMap.connections,[{from:'A',to:'B',label:'Give motion its units'}]);
   const safe=JSON.stringify(data.conceptMap);for(const forbidden of ['SECRET','correctOptionId','content_blocks','youtubeId','Z1qFlfqlS_E','embedded_questions','Honors','Which?'])assert(!safe.includes(forbidden),forbidden);
 });
 await check('scheduled and closed map nodes never gain launch links or release another lesson',async()=>{
   const l=state.tables.lessons[0];l.content_blocks={...l.content_blocks,presentation:'physics-path',learningPath:{kind:'lesson'},blocks:[{id:'video',type:'instruction_video',youtubeId:'Z1qFlfqlS_E'}]};
   state.tables.lessons.push({...l,id:'B',slug:'b',content_blocks:{...l.content_blocks,blocks:[{id:'v',type:'instruction_video',youtubeId:'vf7X7mmJfsE'}]}});
   state.windows={A:{state:'closed',closed_at:'2026-09-27'},B:{state:'scheduled',opens_at:'2026-10-01T12:00:00Z'}};
   state.tables.lesson_progress=[{user_id:'s',lesson_id:'A',progress_percentage:30,status:'completed'}];
   let data=await(await publishedRoute.GET(req('/api/lessons/published'),student)).json();
   assert.equal(data.conceptMap.nodes[0].progress,0,'Stale completed cache cannot replace a submission');assert.equal(data.conceptMap.nodes[1].opensAt,'2026-10-01T12:00:00Z');assert(data.conceptMap.nodes.every(n=>!n.href && n.watchHref));assert.deepEqual(data.lessons.map(l=>l.id),['A','B']);
   state.windows.A={state:'open'};data=await(await publishedRoute.GET(req('/api/lessons/published'),student)).json();
   assert.equal(data.conceptMap.nodes[0].href,'/lessons/a');assert.equal(data.conceptMap.nodes[1].href,undefined);assert.equal(state.writes.length,0);
 });
 await check('concept-map access still requires an enrolled student and never trusts URL scope',async()=>{
   state.enrolled=false;assert.equal((await publishedRoute.GET(req('/api/lessons/published'),student)).status,403);
   state.enrolled=true;assert.equal((await publishedRoute.GET(req('/api/lessons/published'),{...student,role:'parent'})).status,403);
   const data=await(await publishedRoute.GET(req('/api/lessons/published'),teacher)).json();assert.equal(data.conceptMap,undefined);
 });
 console.log(`${passed} access/review behavioral tests passed`);
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>fs.rmSync(temp,{recursive:true,force:true}));
