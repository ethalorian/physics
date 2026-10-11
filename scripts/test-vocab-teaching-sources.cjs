const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.cwd();
async function fixture(){
 const out=fs.mkdtempSync('/private/tmp/vocab-connections-api-');
 const mocks={
  'server-only':'',
  'next/server':`export const NextResponse={json:(body,init)=>({body,status:init?.status??200})}`,
  '@/lib/api-auth':`export const withAuth=h=>h;export const withContentEditor=(_s,h)=>h;export const withRole=(_r,h)=>h`,
  '@/lib/supabase':`export const supabaseAdmin={from:t=>globalThis.vocabTestDb(t),rpc:(n,p)=>globalThis.vocabTestRpc(n,p)}`,
  '@/lib/vocab-scope-server':`export const vocabularyFor=async()=>({sets:[],words:[]})`,
  '@/lib/vocab-terms':`export const saveVocabTerms=async()=>{throw Error('Connection changes must not rewrite words')}`,
 };
 mocks['./supabase']=mocks['@/lib/supabase'];
 const build=async(file,name)=>{await require(root+'/node_modules/esbuild').build({entryPoints:[root+'/'+file],outfile:out+'/'+name+'.cjs',bundle:true,platform:'node',format:'cjs',packages:'external',plugins:[{name:'fixture-dependencies',setup(b){b.onResolve({filter:/.*/},a=>a.path in mocks?{path:a.path,namespace:'mock'}:undefined);b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'js'}))}}]});return require(out+'/'+name+'.cjs')};
 const sources=await build('src/app/api/vocab/teaching-sources/route.ts','sources'),vocabulary=await build('src/app/api/vocabulary/route.ts','vocabulary'),{scopeVocabulary}=await build('src/lib/vocab-scope.ts','scope');
 const ctx={role:'teacher',realRole:'teacher',email:'teacher@example.com',scopeEmail:'teacher@example.com',userId:'teacher'};
 const units=[{id:'unit-1',name:'Unit 1 · Motion',program:'physics'},{id:'trades-etf-1',name:'Foreign program',program:'trades'}];
 const courses=[{id:'cpa',name:'Physics CPA',section:'A',program:'physics',track:'cpa',teacher_email:ctx.email,archived_at:null},{id:'honors',name:'Physics Honors',section:'B',program:'physics',track:'honors',teacher_email:ctx.email,archived_at:null},{id:'foreign',name:'Other class',program:'trades',track:'cpa',teacher_email:'other@example.com',archived_at:null}];
 const videos=[1,2,3,4].map((n)=>({id:`00000000-0000-0000-0000-00000000000${n}`,title:['Position and displacement','Velocity and speed','Retired video','Foreign class video'][n-1],slug:'video-'+n,lesson_number:n,lesson_type:'video',unit_id:n===4?'trades-etf-1':'unit-1',visibility_track:'all',presentation:n===3?null:'physics-path',learning_path:n===3?null:{kind:'lesson'},published:true,current:n!==3,target_ids:['target']}));
 let sets=[{id:'set-motion',name:'Motion words',description:'Describe how motion changes.',unit_id:'unit-1',lesson_id:videos[0].id,published:true,created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z',archived:false,vocabulary_terms:[{id:'word-position',term:'position',definition:'Where an object is compared with a reference point.',tier:3,difficulty:'easy',archived:false},{id:'word-displacement',term:'displacement',definition:'The change from starting position to ending position.',tier:3,difficulty:'medium',archived:false}]}];
 const state={sets,courses,units,videos,writes:[],rpc:[],conflict:false};
 global.vocabTestDb=table=>{const filters=[];let verb='select',value,one=false,from=0,to=99999;const q=new Proxy({}, {get(_t,key){if(key==='then')return(resolve,reject)=>Promise.resolve().then(()=>{let rows=table==='units'?units:table==='lessons'?videos:table==='courses'?courses:table==='vocabulary_sets'?sets:[];rows=rows.filter(r=>filters.every(([op,k,v])=>op==='in'?v.includes(r[k]):r[k]===v));if(verb==='insert'){rows=value.map(v=>({id:'set-'+(sets.length+1),created_at:new Date().toISOString(),updated_at:new Date().toISOString(),archived:false,vocabulary_terms:[],...v}));sets.push(...rows);state.writes.push({table,value})}return {data:one?rows[0]??null:rows.slice(from,to+1),error:null}}).then(resolve,reject);return(...args)=>{if(['eq','in','is'].includes(key))filters.push([key,...args]);if(key==='range')[from,to]=args;if(key==='insert'){verb=key;value=args[0]}if(['single','maybeSingle'].includes(key))one=true;return q}}});return q};
 global.vocabTestRpc=async(name,p)=>{state.rpc.push({name,p});const s=sets.find(s=>s.id===p.p_set);if(state.conflict||s.updated_at!==p.p_expected)return {error:{code:'40001',message:'Vocabulary changed in another editor. Reload before saving; your edits are still here.'}};Object.assign(s,p.p_patch,{updated_at:new Date().toISOString()});return {data:s,error:null}};
 const request=(body)=>new Request('http://test/api/vocabulary',body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);
 const choices=async()=>(await sources.GET(request(),ctx)).body.sources;
 const list=async()=>(await vocabulary.GET(request(),ctx)).body;
 const scoped=(extra={})=>scopeVocabulary({courses:courses.filter(c=>c.teacher_email===ctx.email),units,lessons:videos,sets,words:sets.flatMap(s=>s.vocabulary_terms.map(t=>({...t,vocabulary_set_id:s.id}))),windows:[],tasks:[],assignments:[],...extra});
 return {state,ctx,sources,vocabulary,request,choices,list,scoped};
}
async function test(){
 const f=await fixture(),{state,ctx,vocabulary,request}=f,choices=await f.choices();
 assert.equal(choices.filter(c=>c.source.kind==='video').length,2,'Only current videos in the teacher program');
 const u1=choices.filter(c=>c.source.kind==='deck'&&c.unit_id==='unit-1');assert.equal(u1.length,44);for(const track of ['cpa','honors'])assert.deepEqual(u1.filter(c=>c.source.track===track).map(c=>c.source.day),Array.from({length:22},(_,i)=>i+1));
 assert.equal((await f.sources.GET(request(),{...ctx,scopeEmail:'nobody@example.com'})).body.sources.length,0);
 for(const teachingSource of [{kind:'deck',unit_id:'unit-1',day:99,track:'cpa'},{kind:'deck',unit_id:'unit-3',day:1,track:'honors'},{kind:'video',lesson_id:state.videos[2].id},{kind:'video',lesson_id:state.videos[3].id},{kind:'video',lesson_id:'arbitrary'},{kind:'deck',unit_id:'unit-1',day:1.5,track:'cpa'},{kind:'none',extra:1},null])assert.equal((await vocabulary.POST(request({name:'Invalid',teachingSource}),ctx)).status,422);
 assert.equal(state.writes.length,0);
 const originalWords=structuredClone(state.sets[0].vocabulary_terms),originalLesson=state.sets[0].lesson_id;
 const deck={kind:'deck',unit_id:'unit-1',day:13,track:'cpa'};
 let r=await vocabulary.PUT(request({id:'set-motion',expected_updated_at:state.sets[0].updated_at,teachingSource:deck}),ctx);assert.equal(r.status,200);assert.equal(state.sets[0].lesson_id,originalLesson);assert.equal(state.rpc[0].p.p_terms,null);assert.deepEqual(state.sets[0].vocabulary_terms,originalWords);assert.match((await f.list())[0].teachingConnection.href,/unit-1-cpa\/day-13.html/);
 let scoped=f.scoped({authoring:true});assert.equal(scoped[0].teachingConnection.label,(await f.list())[0].teachingConnection.label);assert.deepEqual(scoped[0].course_ids,['cpa']);assert.equal(scoped[0].lesson_id,null);assert.equal(f.scoped({studentId:'student'}).length,0,'Deck connection alone cannot grant access');
 const task={course_id:'cpa',title:'Motion practice',active:true,student_ids:['student'],term_ids:['word-position'],task_kind:'practice',target_id:'target'};
 assert.deepEqual(f.scoped({studentId:'student',tasks:[task]})[0].term_ids,['word-position']);assert.equal(f.scoped({studentId:'other',tasks:[task]}).length,0);assert.equal(f.scoped({studentId:'student',tasks:[{...task,task_kind:'quiz'}]}).length,0);
 assert.equal((await vocabulary.PUT(request({id:'set-motion',expected_updated_at:'stale',teachingSource:deck}),ctx)).status,409);
 assert.equal((await vocabulary.PUT(request({id:'set-motion',teachingSource:deck}),ctx)).status,428);
 r=await vocabulary.PUT(request({id:'set-motion',expected_updated_at:state.sets[0].updated_at,teachingSource:{kind:'video',lesson_id:state.videos[1].id}}),ctx);assert.equal(r.status,200);assert.equal(state.sets[0].lesson_id,originalLesson);
 assert.equal(f.scoped({studentId:'student',windows:[{course_id:'cpa',lesson_id:originalLesson,open_at:null,close_at:null}]}).length,0,'Old canonical lesson is not the new teaching source');
 scoped=f.scoped({studentId:'student',windows:[{course_id:'cpa',lesson_id:state.videos[1].id,open_at:null,close_at:null}]});assert.deepEqual(scoped[0].term_ids,originalWords.map(w=>w.id));assert.equal(scoped[0].lesson_id,state.videos[1].id);
 state.videos[1].visibility_track='honors';assert.deepEqual(f.scoped({authoring:true})[0].course_ids,['honors']);state.videos[1].visibility_track='all';
 r=await vocabulary.POST(request({name:'Honors day 21',unit:'wrong-unit',teachingSource:{...deck,day:21,track:'honors'},terms:[]}),ctx);assert.equal(r.status,200);assert.equal(r.body.lesson_id,null);assert.equal(r.body.unit_id,'unit-1');assert.equal(r.body.published,false);
 r=await vocabulary.PUT(request({id:'set-motion',expected_updated_at:state.sets[0].updated_at,teachingSource:{kind:'none'}}),ctx);assert.equal(r.status,200);assert.equal((await f.list())[0].teachingConnection,null);assert.equal(f.scoped({studentId:'student',windows:[{course_id:'cpa',lesson_id:originalLesson,open_at:null,close_at:null}]}).length,0);
 assert.deepEqual(state.sets[0].vocabulary_terms,originalWords);assert.equal(state.sets[0].lesson_id,originalLesson);
 console.log('PASS current-video/owned-class catalog; all 44 Unit 1 decks; invalid sources; create/reconnect/remove; unchanged word IDs and canonical binding; optimistic conflict; CPA/Honors and publication/assignment/quiz access gates.');
}
module.exports={fixture};if(require.main===module)test().catch(e=>{console.error(e);process.exitCode=1});
