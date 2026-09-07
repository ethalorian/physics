const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), esbuild = require(path.join(root, 'node_modules/esbuild'));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'physics-audit-tests-'));
const tick = () => new Promise((r) => setImmediate(r));
let passed = 0;
async function check(name, fn) { await fn(); passed++; console.log('PASS ' + name); }
async function bundle(entry, name, plugins = []) {
  const out = path.join(temp, name + '.cjs');
  await esbuild.build({ absWorkingDir: root, entryPoints: [path.join(root, entry)], outfile: out, bundle: true, platform: 'node', format: 'cjs', plugins });
  return require(out);
}
(async () => {
  const blocks = await bundle('src/data/content-blocks.ts', 'blocks');
  const registry = await bundle('src/data/block-registry.ts', 'registry');
  const visibility = await bundle('src/lib/track-visibility.ts', 'visibility');
  const { LessonResponseStore, draftStorageKey } = await bundle('src/lib/lesson-response-store.ts', 'responses');
  await check('empty metadata does not complete answer blocks', () => {
    for (const [type, response] of [['exit_ticket',{text:'',mode:'text'}],['sketch',{strokes:[],mode:'sketch'}],['question',{optionId:null,explain:'',mode:'choice'}],['gewa',{equationId:'f-ma',autoCheck:'unknown'}],['observation',{pattern:'one half',interpret:''}]]) assert.equal(blocks.isResponseComplete(type,response),false,type);
  });
  await check('typed answers complete only their intended block', () => {
    assert.equal(blocks.isResponseComplete('exit_ticket',{text:'Momentum is conserved.',mode:'text'}),true);
    assert.equal(blocks.isResponseComplete('marzano',0),true);
    assert.equal(blocks.isResponseComplete('marzano',4),false);
    assert.equal(blocks.isResponseComplete('sketch',{strokes:[{points:[{x:1,y:1}]}]}),true);
    assert.equal(blocks.isResponseComplete('concept_exercise',{submitted:true,answers:{}}),false);
    assert.equal(blocks.isResponseComplete('concept_exercise',{submitted:true,answers:{q:'A'}}),false);
    assert.equal(blocks.isResponseComplete('concept_exercise',{submitted:true,answers:{q:'A'},summary:{answeredCount:1,itemCount:1}}),true);
  });
  await check('question choice and explanation checked against authored block', () => {
    const b={id:'q',type:'question',capture:true,question:{prompt:'Why?',options:[{id:'a',text:'A'}],explain:'Explain'}};
    assert.equal(blocks.isBlockComplete(b,{optionId:'not-a-choice',explain:'why'}),false);
    assert.equal(blocks.isBlockComplete(b,{optionId:'a',explain:''}),false);
    assert.equal(blocks.isBlockComplete(b,{optionId:'a',explain:'because'}),true);
  });
  await check('every renderer block has an authoring definition', () => {
    const source=fs.readFileSync(path.join(root,'src/components/blocks/BlockRenderer.tsx'),'utf8');
    const cases=[...source.matchAll(/case '([^']+)':/g)].map((m)=>m[1]);
    for(const type of cases) assert.ok(registry.DEF_BY_TYPE.has(type),type);
    for(const def of registry.BLOCK_DEFS) {
      assert.ok(cases.includes(def.type), 'No reader for registered ' + def.type);
      const doc={schemaVersion:1,blocks:[registry.createBlock(def.type,'one')]};
      assert.deepEqual(registry.validateBlockDocument(doc),[],def.type);
    }
  });
  await check('published edits retain checks; explicit unpublish allows drafts', () => {
    assert.equal(registry.remainsPublished(true,{}),true);
    assert.equal(registry.remainsPublished(false,{published:true}),true);
    assert.equal(registry.remainsPublished(true,{published:false}),false);
    const doc={schemaVersion:1,blocks:[registry.createBlock('question','q')]};
    assert.ok(registry.validateBlockDocument(doc,true).length>0);
    assert.equal(registry.validateBlockDocument(doc,false).length,0);
  });
  await check('track preview uses student filtering and excludes obsolete draft blockers', () => {
    const doc={schemaVersion:1,blocks:[{id:'cpa',type:'exit_ticket',capture:true,visibilityTrack:'cpa',prompt:'CPA'},{id:'honors',type:'exit_ticket',capture:true,visibilityTrack:'honors',prompt:'Honors'},{id:'deck',type:'deck',src:'/deck',title:'Deck'}]};
    const visible=visibility.filterDocumentForViewer(doc,{role:'student',track:'cpa'});
    assert.deepEqual(visible.blocks.map((b)=>b.id),['cpa']);
    assert.deepEqual(registry.blockingDrafts(visible.blocks,{honors:{draft:true},deleted:{draft:true}}),[]);
    assert.deepEqual(registry.blockingDrafts(visible.blocks,{cpa:{draft:true}}).map((b)=>b.id),['cpa']);
  });
  function memory() { const map=new Map(); return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}; }
  const response=(body={},ok=true)=>({ok,json:async()=>body});
  const emptyLoad=(url)=>response(url.includes('/blocks?')?{responses:{}}:{drafts:{}});
  await check('failed load prevents editing and retry restores stored work', async () => {
    let fail=true;const storage=memory();
    const store=new LessonResponseStore('alice','lesson',()=>true,async(url)=>fail?response({},false):emptyLoad(url),()=>storage);
    await store.load();assert.equal(store.getSnapshot().loaded,false);assert.ok(store.getSnapshot().loadError);
    store.draft('q','exit_ticket',{text:'must not write'});assert.equal(storage.getItem(draftStorageKey('alice','lesson')),null);
    fail=false;await store.load();assert.equal(store.getSnapshot().loaded,true);store.dispose();
  });
  await check('student drafts never restore another account or legacy unowned key', async () => {
    const storage=memory(),draft={q:{response:{text:'Alice'},block_type:'exit_ticket',updated_at:'2026-09-07T12:00:00Z'}};
    storage.setItem(draftStorageKey('alice','lesson'),JSON.stringify(draft));storage.setItem('lesson-drafts:lesson',JSON.stringify(draft));
    const bob=new LessonResponseStore('bob','lesson',()=>true,async(url)=>emptyLoad(url),()=>storage);
    await bob.load();assert.deepEqual(bob.getSnapshot().responses,{});bob.dispose();
    const alice=new LessonResponseStore('alice','lesson',()=>true,async(url)=>emptyLoad(url),()=>storage);
    await alice.load();assert.equal(alice.getSnapshot().responses.q.response.text,'Alice');alice.dispose();
  });
  await check('failed save retains current answer and successful retry clears it', async () => {
    const storage=memory();let ok=false;
    const store=new LessonResponseStore('alice','lesson',()=>true,async(url,opts)=>opts?.method==='POST'?response({},ok):emptyLoad(url),()=>storage);
    await store.load();assert.equal(await store.save('q','exit_ticket',{text:'first'}),false);
    assert.equal(store.getSnapshot().responses.q.draft,true);
    store.draft('q','exit_ticket',{text:'revised'});ok=true;
    assert.equal(await store.save('q','exit_ticket',{text:'revised'}),true);assert.equal(store.getSnapshot().responses.q.response.text,'revised');assert.equal(storage.getItem(draftStorageKey('alice','lesson')),null);store.dispose();
  });
  await check('in-flight draft cannot pass explicit save or erase newer edit', async () => {
    const storage=memory();let resolveDraft;const calls=[];
    const store=new LessonResponseStore('alice','lesson',()=>true,async(url,opts)=>{if(!opts?.method)return emptyLoad(url);calls.push(JSON.parse(opts.body));if(url.endsWith('drafts'))return new Promise(r=>resolveDraft=r);return response({});},()=>storage);
    await store.load();store.draft('q','exit_ticket',{text:'old'});const flush=store.flush();await tick();
    const save=store.save('q','exit_ticket',{text:'new'});await tick();assert.equal(calls.length,1);
    resolveDraft(response({saved:1}));await flush;assert.equal(await save,true);assert.equal(calls[1].response.text,'new');store.dispose();
  });
  await check('account switch cancels queued saves and keeps prior account recovery', async () => {
    let actor='alice',resolveDraft;const storage=memory(),calls=[];
    const store=new LessonResponseStore('alice','lesson',()=>actor==='alice',async(url,opts)=>{if(!opts?.method)return emptyLoad(url);calls.push(JSON.parse(opts.body));return new Promise(r=>resolveDraft=r);},()=>storage);
    await store.load();store.draft('q','exit_ticket',{text:'Alice'});const flush=store.flush();await tick();
    const save=store.save('q','exit_ticket',{text:'Alice revision'});actor='bob';store.dispose();resolveDraft(response({saved:1}));await flush;
    assert.equal(await save,false);assert.equal(calls.length,1);assert.ok(storage.getItem(draftStorageKey('alice','lesson')));
  });
  await check('server-confirmed older save does not clear newer typed answer',async()=>{
    let resolveSave;const store=new LessonResponseStore('alice','lesson',()=>true,async(url,opts)=>opts?.method?new Promise(r=>resolveSave=r):emptyLoad(url),()=>memory());
    await store.load();const save=store.save('q','exit_ticket',{text:'old'});await tick();store.draft('q','exit_ticket',{text:'new'});resolveSave(response({}));assert.equal(await save,false);assert.equal(store.getSnapshot().responses.q.response.text,'new');assert.equal(store.getSnapshot().responses.q.draft,true);store.dispose();
  });
  const routePlugin={name:'route-fixtures',setup(build){
    const mocks={
      'next/server':`exports.NextResponse={json:(body,options)=>new Response(JSON.stringify(body),{status:options?.status??200})};`,
      '@/lib/api-auth':`exports.withAuth=(fn)=>fn;exports.withContentEditor=(_table,fn)=>fn;`,
      '@/lib/supabase':`exports.supabaseAdmin={from:(table)=>{let updated=false;const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:table==='lessons'?global.__route.current:null}),single:async()=>({data:{id:'lesson'}}),update:(patch)=>{global.__route.writes.push(patch);updated=true;return q}};return q;}};`,
      '@/lib/lesson-targets':`exports.targetIdsForLesson=async(_id,doc)=>{global.__route.checkedDoc=doc;return global.__route.targets;};`,
      '@/lib/sei':`exports.seiLint=()=>global.__route.sei;`,
    };
    build.onResolve({filter:/^(next\/server|@\/lib\/(api-auth|supabase|lesson-targets|sei))$/},a=>({path:a.path,namespace:'fixture'}));
    build.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path]}));
  }};
  const route=await bundle('src/app/api/lessons/[id]/route.ts','lesson-route',[routePlugin]);
  const validDoc={schemaVersion:1,blocks:[{id:'exit',type:'exit_ticket',capture:true,prompt:'Explain.'}]};
  const resetRoute=()=>global.__route={current:{published:true,unit_id:null,content_blocks:validDoc},targets:['target'],sei:[],writes:[]};
  const put=body=>route.PUT(new Request('http://local/api/lessons/lesson',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),{params:Promise.resolve({id:'lesson'})});
  await check('published content-only PUT rejects invalid blocks before writing',async()=>{
    resetRoute();const r=await put({content_blocks:{schemaVersion:1,blocks:[registry.createBlock('question','q')]}});assert.equal(r.status,422);assert.equal(global.__route.writes.length,0);
  });
  await check('published content-only PUT runs language-support publishing rules',async()=>{
    resetRoute();global.__route.sei=[{severity:'error',message:'Missing frame'}];assert.equal((await put({content_blocks:validDoc})).status,422);assert.equal(global.__route.writes.length,0);
  });
  await check('publication target check uses replacement document, not old block references',async()=>{
    resetRoute();global.__route.targets=[];const r=await put({content_blocks:validDoc});assert.equal(r.status,422);assert.deepEqual(global.__route.checkedDoc,validDoc);assert.equal(global.__route.writes.length,0);
  });
  await check('unpublishing permits incomplete drafts while keeping structural checks',async()=>{
    resetRoute();assert.equal((await put({published:false,content_blocks:{schemaVersion:1,blocks:[registry.createBlock('question','q')]}})).status,200);assert.equal(global.__route.writes.length,1);
  });
  console.log(`\n${passed} lesson audit regression scenarios passed.`);
})().catch((e)=>{console.error(e);process.exitCode=1}).finally(()=>fs.rmSync(temp,{recursive:true,force:true}));
