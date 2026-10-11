const fs=require('node:fs'),assert=require('node:assert/strict'),root=process.cwd();
(async()=>{
 const out=fs.mkdtempSync('/private/tmp/vocab-multi-api-'),uuid=n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
 const courses=[{id:uuid(1),name:'CPA Physics',section:'A',program:'physics',track:'cpa'}],units=[{id:'unit-1',name:'Motion',program:'physics'}];
 const lessons=[{id:uuid(11),title:'Position',unit_id:'unit-1',published:true,current:true,target_ids:[uuid(100)]},{id:uuid(12),title:'Velocity',unit_id:'unit-1',published:true,current:true,target_ids:[uuid(100)]}];
 const sets=lessons.map((l,i)=>({id:uuid(21+i),name:l.title+' words',lesson_id:l.id,unit_id:'unit-1',published:true,archived:false}));sets.push({id:uuid(23),name:'Force deck words',lesson_id:null,unit_id:'unit-1',teaching_source:{kind:'deck',unit_id:'unit-1',day:13,track:'cpa'},published:true,archived:false});
 const words=sets.map((s,i)=>({id:uuid(31+i),vocabulary_set_id:s.id,term:['position','velocity','force'][i],definition:'Fixture definition '+i,tier:3,archived:false}));
 let tasks=[];
 const mocks={
  'server-only':'',
  'next/server':`export const NextResponse={json:(body,init)=>({body,status:init?.status??200})}`,
  '@/lib/api-auth':`export const withAuth=h=>h;export const withRole=(_r,h)=>h`,
  '@/lib/supabase':`export const supabaseAdmin={from:t=>globalThis.multiDb(t)}`,
  '@/lib/vocab-access':`export const vocabCourses=async()=>globalThis.multiCourses;export const accessVocabTask=async()=>null`,
  '@/lib/vocab-scope-server':`export const vocabularyFor=async()=>globalThis.multiAvailable()`,
 };
 const build=async(file,name)=>{await require(root+'/node_modules/esbuild').build({entryPoints:[root+'/'+file],outfile:out+'/'+name+'.cjs',bundle:true,platform:'node',format:'cjs',packages:'external',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>a.path in mocks?{path:a.path,namespace:'mock'}:undefined);b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'js'}))}}]});return require(out+'/'+name+'.cjs')};
 const {scopeVocabulary}=await build('src/lib/vocab-scope.ts','scope'),{POST}=await build('src/app/api/vocab/tasks/route.ts','tasks');
 global.multiCourses=courses;global.multiAvailable=()=>({sets:scopeVocabulary({courses,units,lessons,sets,words,windows:[],tasks:[],assignments:[],authoring:true})});
 global.multiDb=table=>{let one=false,insert=null;const filters=[];const q=new Proxy({}, {get(_t,key){if(key==='then')return(resolve,reject)=>Promise.resolve().then(()=>{let data=table==='learning_targets'?[{id:uuid(100),domain:'knowledge',program:'physics'}]:table==='vocab_tasks'?tasks:table==='course_students'?[{course_id:uuid(1),student_id:uuid(2),enrollment_state:'ACTIVE'}]:table==='vocabulary_terms'?words:table==='vocabulary_sets'?sets:[];data=data.filter(r=>filters.every(([op,k,v])=>op==='in'?v.includes(r[k]):r[k]===v));if(insert){data=insert.map((r,i)=>({id:uuid(200+tasks.length+i),active:true,...r}));tasks.push(...data)}return {data:one?data[0]??null:data,error:null}}).then(resolve,reject);return(...args)=>{if(['eq','in'].includes(key))filters.push([key,...args]);if(key==='insert')insert=args[0];if(key==='maybeSingle')one=true;return q}}});return q};
 const ctx={role:'teacher',email:'teacher@example.com',userId:uuid(9)},body={course_ids:[uuid(1)],student_ids:[],term_ids:[uuid(31),uuid(32)],target_id:uuid(100),title:'Vocabulary from two lessons',threshold:80,min_checks:2,check_mode:'recognition',task_kind:'practice'};
 const post=b=>POST(new Request('http://test/api/vocab/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}),ctx);
 let r=await post(body);assert.equal(r.status,200);assert.equal(r.body.created,1);assert.equal(tasks.length,1);assert.deepEqual(tasks[0].term_ids,body.term_ids);assert.deepEqual(tasks[0].words.map(w=>w.vocabulary_set_id),[uuid(21),uuid(22)]);assert.deepEqual(tasks[0].student_ids,[uuid(2)]);
 assert.equal((await post(body)).status,409);assert.equal(tasks.length,1,'Duplicate detection covers the combined word selection');
 tasks=[];r=await post({...body,title:'Videos and presentation deck',term_ids:words.map(w=>w.id)});assert.equal(r.status,200);assert.equal(tasks.length,1);assert.equal(tasks[0].words.length,3);assert.equal(tasks[0].words[2].vocabulary_set_id,uuid(23));
 tasks=[];sets[2].teaching_source.track='honors';assert.equal((await post({...body,term_ids:words.map(w=>w.id)})).status,400);assert.equal(tasks.length,0,'Wrong-track source cannot leak into a combined task');sets[2].teaching_source.track='cpa';
 assert.equal((await post({...body,course_ids:[uuid(99)]})).status,403);assert.equal(tasks.length,0);
 sets[1].published=false;assert.equal((await post(body)).status,400);assert.equal(tasks.length,0);sets[1].published=true;
 assert.equal((await post({...body,term_ids:Array.from({length:61},(_,i)=>uuid(1000+i))})).status,400);assert.equal(tasks.length,0);
 console.log('PASS real assignment POST saves two lessons or mixed video/deck words as one task, snapshots each source set, preserves roster, blocks duplicate combinations, wrong-class/track/unpublished words and the 60-word limit.');
})().catch(e=>{console.error(e);process.exitCode=1});
