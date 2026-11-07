const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), os = require('node:os')
const { buildSync } = require('esbuild')
const root = path.resolve(__dirname, '../..'), out = fs.mkdtempSync(path.join(os.tmpdir(), 'frontend-hooks-'))
let active
class Hooks {
  constructor(render) { this.renderFn = render; this.slots = []; this.dirty = true; this.effects = []; this.flush() }
  flush() { let loops = 0; do { this.dirty = false; this.index = 0; active = this; this.value = this.renderFn(); active = null; for (const run of this.effects.splice(0)) run(); assert(++loops < 50, 'render loop') } while (this.dirty); return this.value }
  state(initial) { const i = this.index++; if (!(i in this.slots)) this.slots[i] = typeof initial === 'function' ? initial() : initial; return [this.slots[i], value => { const next = typeof value === 'function' ? value(this.slots[i]) : value; if (!Object.is(next, this.slots[i])) { this.slots[i] = next; this.dirty = true } }] }
  memo(fn, deps) { const i = this.index++, old = this.slots[i]; if (!old || deps.some((x,j) => !Object.is(x,old.deps[j]))) this.slots[i] = {value:fn(),deps}; return this.slots[i].value }
  effect(fn, deps) { const i = this.index++, old = this.slots[i]; if (!old || !deps || deps.some((x,j) => !Object.is(x,old.deps[j]))) { const slot = {deps}; this.slots[i] = slot; this.effects.push(() => {old?.cleanup?.(); slot.cleanup = fn()}) } }
  unmount() { for (const s of this.slots) s?.cleanup?.() }
}
global.__hooks = { useState: x => active.state(x), useRef: x => active.memo(() => ({current:x}), []), useMemo: (f,d) => active.memo(f,d), useCallback: (f,d) => active.memo(() => f,d), useEffect: (f,d) => active.effect(f,d), useLayoutEffect: (f,d) => active.effect(f,d) }
let pageReturn
const shim=path.join(out,'react.js'), page=path.join(out,'page-return.js')
fs.writeFileSync(shim,'module.exports=global.__hooks')
fs.writeFileSync(page,'exports.subscribePageReturn=f=>global.__subscribe(f)')
global.__subscribe=f=>{pageReturn=f;return()=>{if(pageReturn===f)pageReturn=null}}
function bundle(entry,name) { const file=path.join(out,name+'.cjs'); buildSync({absWorkingDir:root,entryPoints:[entry],outfile:file,bundle:true,platform:'node',format:'cjs',alias:{react:shim,'@/lib/page-return':page},logLevel:'silent'}); return require(file) }
const {useLearningResource,useLearningWeek}=bundle('src/app/home/useLearningWeek.ts','resources')
const {useCalendarDragPreview}=bundle('src/lib/use-calendar-drag-preview.ts','pointer')
let requests=[]
global.fetch=(url,options)=>new Promise(resolve=>requests.push({url,options,resolve}))
const settle=async(h,request,data,status=200)=>{request.resolve({ok:status<400,status,json:async()=>data});for(let i=0;i<8;i++)await Promise.resolve();h.flush()}
const log=label=>console.log('PASS '+label)
;(async()=>{
  let url='/api/fixture?student=a',scope='account-a',enabled=true
  const h=new Hooks(()=>useLearningResource(url,{scope,enabled}))
  assert.equal(h.value.data,null);assert.equal(h.value.loading,true);assert.equal(requests.length,1)
  await settle(h,requests.at(-1),{work:'saved',grade:0}); assert.deepEqual(h.value.data,{work:'saved',grade:0})
  h.value.refresh();h.flush();assert.equal(h.value.loading,true);assert.equal(h.value.data.work,'saved')
  await settle(h,requests.at(-1),{work:'updated',grade:0});assert.equal(h.value.data.work,'updated');assert.equal(h.value.data.grade,0);log('same-scope refresh keeps confirmed work and real zero grades')
  h.value.refresh();h.flush();await settle(h,requests.at(-1),{},503);assert(h.value.error);assert.equal(h.value.data.work,'updated');log('failed refresh retains same-scope content with an explicit error')
  h.value.refresh();h.flush();await settle(h,requests.at(-1),{},403);assert(h.value.error);assert.equal(h.value.data,null);log('revoked access clears previously loaded data')
  h.value.refresh();h.flush();await settle(h,requests.at(-1),{work:'private-a'});const oldSetter=h.value.setData
  url='/api/fixture?student=b';h.flush();assert.equal(h.value.data,null);assert.equal(h.value.dataUrl,null);assert(h.value.loading);oldSetter({work:'old-writer'});h.flush();assert.equal(h.value.data,null)
  const b=requests.at(-1);scope='account-b';h.flush();assert(b.options.signal.aborted);await settle(h,b,{work:'late-other-account'});assert.equal(h.value.data,null)
  await settle(h,requests.at(-1),{work:'private-b'});assert.equal(h.value.data.work,'private-b');log('URL/account scope changes hide old data, cancel stale reads and ignore old setters')
  enabled=false;h.flush();const count=requests.length;h.value.refresh();h.flush();assert.equal(requests.length,count);assert.equal(h.value.loading,false);assert.equal(pageReturn,null)
  enabled=true;h.flush();assert.equal(requests.length,count+1);assert.equal(h.value.data.work,'private-b');await settle(h,requests.at(-1),{work:'fresh-b'});pageReturn();h.flush();assert.equal(requests.length,count+2);const aborted=requests.at(-1);h.unmount();assert(aborted.options.signal.aborted);log('inactive resources do not fetch or subscribe; reactivation and page return refresh safely')
  requests=[]
  const responses={
    '/api/home':{student:{name:'Fictional'},lessonAssignments:[{id:'lesson:one',kind:'video',due:'2026-10-28',title:'Lesson',complete:false}],homework:[]},
    '/api/review-modules':{staff:false,assignments:[]},'/api/interactive-assignments':{staff:false,assignments:[],work:[],submissions:[],reviews:[]},
    '/api/readings':{staff:false,assignments:[],work:[],courses:[]},'/api/quizzes':{staff:false,quizzes:[],work:[],courses:[]},
    '/api/worksheet-assignments':{staff:false,assignments:[],receipts:[]},'/api/vocab/tasks?view=summary':{tasks:[]},'/api/math-spine/daily':{item:null},
    '/api/home/pace':{warmups:[]},'/api/math-spine/dashboard':{competencies:[],records:[],focus:[]}
  }
  let calendar=false
  const w=new Hooks(()=>useLearningWeek({calendar}))
  assert.equal(requests.length,8);assert(!requests.some(r=>r.url==='/api/home/pace'||r.url==='/api/math-spine/dashboard'))
  for(const r of requests.slice())await settle(w,r,responses[r.url]);assert.equal(w.value.items.length,1)
  w.value.refresh();w.flush();assert.equal(w.value.items.length,1);for(const r of requests.slice(8))await settle(w,r,responses[r.url]);assert.equal(w.value.items.length,1)
  calendar=true;w.flush();assert.equal(requests.length,18);for(const r of requests.slice(16))await settle(w,r,responses[r.url]);w.unmount();log('homepage assignments remain visible throughout refresh; hidden calendar details are deferred')
  let frames=new Map(),nextFrame=0,rectReads=0,targets=[]
  global.requestAnimationFrame=fn=>{frames.set(++nextFrame,fn);return nextFrame};global.cancelAnimationFrame=id=>frames.delete(id)
  const container={current:{getBoundingClientRect:()=>{rectReads++;return {left:20,top:40}}}},element={style:{}}
  const d=new Hooks(()=>useCalendarDragPreview(point=>targets.push(point),container));d.value.ref(element);const initialReads=rectReads
  for(let n=0;n<100;n++)d.value.move({clientX:100+n,clientY:200+n})
  assert.equal(frames.size,1);assert.equal(rectReads,initialReads);for(const [id,fn] of frames){frames.delete(id);fn()}
  assert.deepEqual(targets,[{clientX:199,clientY:299}]);assert.equal(element.style.left,'193px');assert.equal(element.style.top,'273px');assert.equal(rectReads,initialReads+1)
  d.value.move({clientX:1,clientY:2});d.value.cancel();assert.equal(frames.size,0);d.value.move({clientX:3,clientY:4});d.unmount();assert.equal(frames.size,0);log('100 pointer updates coalesce to one frame/geometry read; cancel and unmount stop queued work')
  console.log('7 focused hook groups passed; fictional data only, no production requests.')
})().catch(e=>{console.error(e);process.exitCode=1})
