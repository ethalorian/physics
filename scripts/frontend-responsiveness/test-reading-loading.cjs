const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), vm = require('node:vm'), Module = require('node:module')
const { buildSync, transformSync } = require('esbuild')
const root = path.resolve(__dirname, '../..'), out = fs.mkdtempSync(path.join(os.tmpdir(), 'reading-loading-'))
let active
class Hooks {
  constructor(render) { this.renderFn = render; this.slots = []; this.effects = []; this.dirty = true; this.flush() }
  flush() { let n = 0; do { this.dirty = false; this.index = 0; active = this; this.value = this.renderFn(); active = null; for (const fn of this.effects.splice(0)) fn(); assert(++n < 50) } while (this.dirty); return this.value }
  state(initial) { const i = this.index++; if (!(i in this.slots)) this.slots[i] = initial; return [this.slots[i], value => { const next = typeof value === 'function' ? value(this.slots[i]) : value; if (!Object.is(next, this.slots[i])) { this.slots[i] = next; this.dirty = true } }] }
  memo(fn, deps) { const i = this.index++, old = this.slots[i]; if (!old || deps.some((x,j) => !Object.is(x,old.deps[j]))) this.slots[i] = { value: fn(), deps }; return this.slots[i].value }
  effect(fn, deps) { const i = this.index++, old = this.slots[i]; if (!old || deps.some((x,j) => !Object.is(x,old.deps[j]))) { const slot = {deps}; this.slots[i] = slot; this.effects.push(() => { old?.cleanup?.(); slot.cleanup = fn() }) } }
  unmount() { for (const slot of this.slots) slot?.cleanup?.() }
}
const hooks = { useState: x => active.state(x), useRef: x => active.memo(() => ({current:x}), []), useCallback: (f,d) => active.memo(() => f,d), useMemo: (f,d) => active.memo(f,d), useEffect: (f,d) => active.effect(f,d) }
const shim = path.join(out, 'react.cjs'); fs.writeFileSync(shim, 'module.exports=global.__readingHooks')
const bundle = entry => buildSync({ absWorkingDir: root, entryPoints: [entry], outfile: path.join(out,'bundle.cjs'), bundle: true, write: false, platform: 'node', format: 'cjs', loader: {'.css':'empty'}, alias: {react:shim}, define: {'process.env.NODE_ENV':'"production"'}, logLevel:'silent' }).outputFiles.find(file=>file.path.endsWith('.cjs')).text
const hookSource = bundle('src/components/readings/useReadingDashboardData.ts')
const schemaSandbox = {module:{exports:{}},exports:{},URLSearchParams}; vm.runInNewContext(bundle('src/lib/browser-performance.ts'), schemaSandbox)
const schema = schemaSandbox.module.exports
const clone = value => JSON.parse(JSON.stringify(value))
const data = {
  syllabus: {staff:true,readOnly:false,courses:[{id:'fictional-course',name:'Fictional Physics'}],steps:[],textbookSteps:[],bundles:[]},
  readings: {staff:true,courses:[{id:'fictional-course',name:'Fictional Physics'}],assignments:[],review_counts:{}},
  readingCounts: {review_counts:{'fictional-reading':2}},
  quizzes: {staff:true,readOnly:false,courses:[],quizzes:[],pending:{}}
}
const urls = {syllabus:'/api/reading-syllabus',readings:'/api/readings',quizzes:'/api/quizzes',readingCounts:'/api/readings/review-counts'}
function fixture(options = {}) {
  let now = 0, timerId = 0
  const requests = [], telemetry = [], timers = new Map(), windowListeners = new Map(), documentListeners = new Map()
  const sandbox = {module:{exports:{}},exports:{},global:{__readingHooks:hooks},AbortController,URLSearchParams,performance:{now:()=>now},Date,innerWidth:1400,
    document:{cookie:options.cookie??'',visibilityState:'visible',addEventListener:(k,v)=>documentListeners.set(k,v),removeEventListener:k=>documentListeners.delete(k)},navigator:{doNotTrack:options.dnt,globalPrivacyControl:options.gpc},
    window:{addEventListener:(k,v)=>windowListeners.set(k,v),removeEventListener:k=>windowListeners.delete(k)},
    setInterval:fn=>{timers.set(++timerId,fn);return timerId},clearInterval:id=>timers.delete(id),queueMicrotask:fn=>fn(),
    fetch:(url,init)=>{if(url==='/api/browser-performance'){telemetry.push({url,...init,body:JSON.parse(init.body)});return options.offline?Promise.reject(Error('offline')):Promise.resolve({status:204})}return new Promise(resolve=>requests.push({url,init,resolve}))}
  }
  vm.runInNewContext(hookSource,sandbox)
  const h = new Hooks(()=>sandbox.module.exports.useReadingDashboardData(options.calendar!==false,options.course))
  const settle = async (source, body = data[source], status = 200, request) => { (request??requests.find(r=>r.url.split('?')[0]===urls[source]&&!r.done)).done=true; const r=request??requests.find(r=>r.url.split('?')[0]===urls[source]&&r.done&&!r.resolved);r.resolved=true;r.resolve({ok:status<400,status,json:async()=>body});for(let i=0;i<12;i++)await Promise.resolve();h.flush() }
  return {h,requests,telemetry,timers,windowListeners,documentListeners,sandbox,settle,advance:ms=>{now+=ms},tick:()=>{for(const fn of timers.values())fn()},hook:sandbox.module.exports.useReadingDashboardData}
}
function values(f) { return Object.fromEntries(f.telemetry.flatMap(x=>x.body.metrics).map(m=>[m.name,m.value])) }
const log = text => console.log('PASS: '+text)
;(async()=>{
  const f=fixture();assert.equal(f.requests.length,4);assert(f.h.value.loading&&f.h.value.calendarLoading)
  f.advance(100);await f.settle('syllabus');assert(f.h.value.calendarLoading)
  f.advance(50);await f.settle('readings');assert.equal(f.h.value.calendarLoading,false);assert(f.h.value.loading);assert(f.h.value.calendarUpdated);assert.equal(f.h.value.updated,null)
  f.advance(20);f.h.value.onCalendarReady();f.advance(500);f.h.value.onCalendarReady();await f.settle('readingCounts');assert.equal(f.h.value.readings.review_counts['fictional-reading'],2)
  f.advance(330);await f.settle('quizzes');assert.equal(f.h.value.loading,false);f.tick()
  assert.deepEqual(values(f),{SYLLABUS_LOAD_MS:100,SYLLABUS_LOAD_ERROR:0,READINGS_LOAD_MS:150,READINGS_LOAD_ERROR:0,CALENDAR_DATA_READY_MS:150,CALENDAR_READY_MS:170,READING_COUNTS_LOAD_MS:670,READING_COUNTS_LOAD_ERROR:0,QUIZ_COUNTS_LOAD_MS:1000,QUIZ_COUNTS_LOAD_ERROR:0})
  assert(f.telemetry.every(r=>schema.parseBrowserPerformance(r.body)&&r.credentials==='omit'&&r.referrerPolicy==='no-referrer'&&r.keepalive))
  f.h.unmount();assert.equal(f.timers.size,0);assert.equal(f.windowListeners.size,0);assert.equal(f.documentListeners.size,0)
  log('calendar data ready at 150 ms and ready callback at 170 ms while quiz counts finish at 1000 ms; numeric timings stay separate and first-ready is recorded once')

  for(const first of ['syllabus','readings']){const x=fixture();await x.settle('readingCounts');await x.settle('quizzes');await x.settle(first);assert(x.h.value.calendarLoading);await x.settle(first==='syllabus'?'readings':'syllabus');assert(!x.h.value.calendarLoading&&!x.h.value.loading);x.h.unmount()}
  log('all response orders retain the two required calendar sources')
  const failed=fixture();await failed.settle('syllabus');await failed.settle('readings');await failed.settle('quizzes',{error:'Fictional quiz unavailable'},503);assert.equal(failed.h.value.calendarLoading,false);assert(failed.h.value.syllabus&&failed.h.value.readings);assert.equal(failed.h.value.errors.quizzes,'Fictional quiz unavailable');failed.h.unmount();assert.equal(values(failed).QUIZ_COUNTS_LOAD_ERROR,1)
  const critical=fixture();await critical.settle('syllabus',{error:'Fictional syllabus unavailable'},503);await critical.settle('readings');assert(!critical.h.value.calendarLoading);assert.equal(critical.h.value.syllabus,null);critical.h.unmount();assert(!('CALENDAR_DATA_READY_MS' in values(critical)))
  log('quiz failure leaves the calendar ready with its existing error; required-source failure never claims successful readiness')

  const refresh=fixture();await refresh.settle('syllabus');await refresh.settle('readings');const oldQuiz=refresh.requests[2],saved=refresh.h.value.readings;refresh.h.value.refresh();refresh.h.flush();assert(oldQuiz.init.signal.aborted);assert.equal(refresh.h.value.readings,saved);assert(refresh.h.value.calendarLoading)
  await refresh.settle('quizzes',{...data.quizzes,staff:false},200,oldQuiz);assert.equal(refresh.h.value.quizzes,null)
  await refresh.settle('syllabus');await refresh.settle('readings');await refresh.settle('quizzes');await refresh.settle('readingCounts');const count=refresh.telemetry.length;refresh.tick();assert.equal(refresh.telemetry.length,count)
  refresh.windowListeners.get('focus')();refresh.h.flush();assert.equal(refresh.requests.length,12);refresh.h.unmount();assert(refresh.requests.slice(-4).every(r=>r.init.signal.aborted))
  log('refresh preserves confirmed content, aborts stale requests, ignores late results and records only the first load; focus and unmount cleanup remain intact')

  const scopedOptions={course:'class-a'},scoped=fixture(scopedOptions);
  assert.deepEqual(scoped.requests.map(r=>r.url),['/api/reading-syllabus?calendar=1&course_id=class-a','/api/readings?calendar=1&course_id=class-a','/api/quizzes','/api/readings/review-counts?calendar=1&course_id=class-a']);
  await scoped.settle('syllabus');await scoped.settle('readings');const oldCounts=scoped.requests[3];
  scopedOptions.course='class-b';scoped.h.flush();assert.equal(scoped.h.value.readings,null);assert.equal(scoped.h.value.syllabus,null);assert(scoped.h.value.calendarLoading);assert(oldCounts.init.signal.aborted);
  await scoped.settle('readingCounts',{review_counts:{stale:99}},200,oldCounts);assert.equal(scoped.h.value.readings,null);
  await scoped.settle('syllabus');await scoped.settle('readings');await scoped.settle('readingCounts',{review_counts:{fresh:4}});assert.equal(scoped.h.value.readings.review_counts.fresh,4);assert(!scoped.h.value.readings.review_counts.stale);
  scopedOptions.calendar=false;scoped.h.flush();assert.equal(scoped.h.value.readings,null);assert.deepEqual(scoped.requests.slice(-3).map(r=>r.url),['/api/reading-syllabus','/api/readings','/api/quizzes']);
  await scoped.settle('syllabus');await scoped.settle('readings');await scoped.settle('quizzes');const total=scoped.requests.length;scopedOptions.course='class-c';scoped.h.flush();assert.equal(scoped.requests.length,total);scoped.h.unmount();
  const countsFailure=fixture();await countsFailure.settle('syllabus');await countsFailure.settle('readings');await countsFailure.settle('readingCounts',{error:'Counts unavailable'},500);assert(!countsFailure.h.value.calendarLoading);assert.equal(countsFailure.h.value.errors.readingCounts,'Counts unavailable');countsFailure.h.unmount();
  log('class switches clear prior data, cancel and ignore late counts, return to full dashboard reads, and independent count errors do not block the calendar');

  const experienceSandbox={module:{exports:{}},exports:{}};vm.runInNewContext(bundle('src/lib/experience.ts'),experienceSandbox)
  for(const options of [{calendar:false},{dnt:'1'},{gpc:true},{cookie:experienceSandbox.module.exports.EXPERIENCE_MARKER+'=1'}]){const x=fixture(options);await x.settle('syllabus');await x.settle('readings');await x.settle('quizzes');x.h.value.onCalendarReady();x.tick();x.h.unmount();assert.equal(x.telemetry.length,0)}
  const offline=fixture({offline:true});await offline.settle('syllabus');await offline.settle('readings');await offline.settle('quizzes');offline.h.value.onCalendarReady();offline.tick();assert(!offline.h.value.calendarLoading);offline.h.unmount()
  log('non-calendar entries, DNT, GPC and role previews do not report loading metrics; offline reporting cannot block loading')

  const valid={version:1,scope:'loading',route:'reading-calendar',viewport:'large',metrics:[{name:'READINGS_LOAD_MS',value:150.25},{name:'READINGS_LOAD_ERROR',value:0}]};assert(schema.parseBrowserPerformance(valid))
  for(const invalid of [{...valid,route:'results'},{...valid,scope:'document'},{...valid,scope:'view'},{...valid,student:'secret'},{...valid,metrics:[{name:'READINGS_LOAD_ERROR',value:2}]},{...valid,metrics:[{name:'READINGS_LOAD_ERROR',value:0.5}]},{...valid,metrics:[{name:'READINGS_LOAD_MS',value:-1}]},{...valid,metrics:[{name:'READINGS_LOAD_MS',value:Infinity}]},{...valid,metrics:[{name:'READINGS_LOAD_MS',value:3600001}]},{...valid,metrics:[{name:'LCP',value:1}]},{...valid,metrics:[{name:'READINGS_LOAD_MS',value:1,url:'private'}]}])assert.equal(schema.parseBrowserPerformance(invalid),null)
  log('loading schema rejects mixed scopes, identifiers, unexpected fields and invalid durations/error flags')

  const jsx=(type,props)=>({type,props}), dynamicTypes=[]
  const groupsModule={module:{exports:{}},exports:{},URLSearchParams};vm.runInNewContext(bundle('src/lib/reading-dashboard.ts'),groupsModule)
  function dashboard(hook) {const m=new Module(path.join(out,'dashboard.cjs'),module);m.filename=path.join(out,'dashboard.cjs');m.paths=Module._nodeModulePaths(root);m.require=name=>{
    if(name==='react')return hooks;if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment:'Fragment'};
    if(name==='./ReadingPlanner')return {default:()=>null};if(name==='next/link')return 'Link';if(name==='next/navigation')return {useSearchParams:()=>new URLSearchParams('course_id=fictional-course'),useRouter:()=>({})};
    if(name==='next/dynamic')return ()=>{const type='Dynamic'+dynamicTypes.length;dynamicTypes.push(type);return type};if(name==='lucide-react')return new Proxy({}, {get:(_,k)=>k});
    if(name==='@/components/ui/button')return {Button:'Button'};if(name==='@/components/ui/card')return {Card:'Card'};if(name==='@/components/ui/spinner')return {Spinner:'Spinner'};
    if(name==='@/lib/reading-syllabus')return {SYLLABUS_UNITS:[],nextSyllabusStep:()=>null};if(name==='@/lib/reading-dashboard')return groupsModule.module.exports;
    if(name==='./ReadingShared')return {dueLabel:()=>''};if(name==='./ReadingAssignmentManager')return 'AssignmentManager';if(name==='./useReadingDashboardData')return {useReadingDashboardData:hook};
    if(name.endsWith('.module.css'))return {__esModule:true,default:new Proxy({}, {get:(_,k)=>k})};throw Error(name)
  };m._compile(transformSync(fs.readFileSync(path.join(root,'src/components/readings/ReadingDashboard.tsx'),'utf8'),{loader:'tsx',format:'cjs',jsx:'automatic'}).code,m.filename);return m.exports.default}
  const has=(tree,predicate)=>!tree?false:Array.isArray(tree)?tree.some(x=>has(x,predicate)):typeof tree==='object'&&(predicate(tree)||has(tree.props?.children,predicate))
  const presentation={...data,errors:{},loading:true,calendarLoading:false,updated:null,calendarUpdated:new Date('2026-10-28T12:00:00Z'),refresh(){},onCalendarReady(){}}
  const Dashboard=dashboard(()=>presentation);let view='syllabus';const h=new Hooks(()=>Dashboard({initialView:view}));assert(has(h.value,x=>x.type===dynamicTypes[0]));assert(has(h.value,x=>x.props?.['aria-label']==='Refresh reading dashboard'&&x.props.disabled===false));
  view='assignments';h.flush();assert(!has(h.value,x=>x.type==='AssignmentManager'));assert(has(h.value,x=>x.type==='Spinner'))
  view='syllabus';presentation.syllabus={...data.syllabus,readOnly:true};h.flush();assert(has(h.value,x=>x.type===dynamicTypes[0]&&x.props.readOnly===true))
  presentation.syllabus={...data.syllabus,staff:false};h.flush();assert(!has(h.value,x=>x.type===dynamicTypes[0]));presentation.syllabus=data.syllabus;presentation.quizzes={...data.quizzes,staff:false};h.flush();assert(!has(h.value,x=>x.type===dynamicTypes[0]));h.unmount()
  log('actual dashboard enables calendar refresh before counts, retains other-view loading gates, passes read-only to the planner and rejects nonstaff responses')
  assert.deepEqual(data,clone(data))
  console.log('8 reading-loading groups passed; fictional data and no production requests.')
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>fs.rmSync(out,{recursive:true,force:true}))
