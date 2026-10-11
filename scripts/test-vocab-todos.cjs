// Isolated application routes and UI; no production database or student accounts.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), http = require('node:http'), crypto = require('node:crypto'), assert = require('node:assert/strict')
const { build } = require('esbuild')
const root = path.resolve(__dirname, '..'), out = fs.mkdtempSync(path.join(os.tmpdir(), 'vocab-todos-'))
const id = n => `70000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const student = id(1), course = id(2), taskId = id(3)
const words = ['Position', 'Displacement'].map((term, i) => ({ id: id(10 + i), term, definition: `Definition of ${term}`, vocabulary_set_id: id(4), tier: 3 }))
const task = { id: taskId, course_id: course, target_id: null, title: 'Motion vocabulary', note: '', due_on: null, term_ids: words.map(w => w.id), words, student_ids: [student], active: true, created_at: '2026-09-01T12:00:00Z', threshold: 80, min_checks: 2, check_mode: 'recognition', task_kind: 'practice' }
let rows, failProgress = false, failSave = false, failArchive = false
function reset() {
  rows = { courses: [{ id: course, name: 'Physics', teacher_email: 'teacher@test', archived_at: null }], course_students: [{ id: id(5), course_id: course, student_id: student, enrollment_state: 'ACTIVE' }], students: [{ id: student, name: 'Sample learner' }], vocab_tasks: [structuredClone(task)], vocab_checks: [], vocab_mastery_reviews: [], mastery_records: [], vocab_attempts: [] }
  failProgress = failSave = failArchive = false
}
reset()
class Query {
  constructor(table) { this.table = table; this.filters = []; this.sorts = []; this.from = 0; this.to = Infinity }
  select() { return this }
  eq(k, v) { this.filters.push(r => r[k] === v); return this }
  in(k, vs) { this.filters.push(r => vs.includes(r[k])); return this }
  is(k, v) { this.filters.push(r => (r[k] ?? null) === v); return this }
  contains(k, vs) { this.filters.push(r => vs.every(v => r[k]?.includes(v))); return this }
  gte(k, v) { this.filters.push(r => r[k] >= v); return this }
  order(k, o = {}) { this.sorts.push([k, o.ascending !== false]); return this }
  range(a, b) { this.from = a; this.to = b; return this }
  limit(n) { this.to = n - 1; return this }
  single() { this.one = true; return this }
  maybeSingle() { this.one = true; return this }
  insert(p) { this.inserted = Array.isArray(p) ? p : [p]; return this }
  update(p) { this.patch = p; return this }
  then(resolve, reject) {
    try {
      let found = (rows[this.table] ?? []).filter(r => this.filters.every(f => f(r)))
      if (this.inserted) { found = this.inserted.map(r => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), completed_at: null, ...structuredClone(r) })); rows[this.table].push(...found) }
      if (this.patch) found.forEach(r => Object.assign(r, structuredClone(this.patch)))
      found = [...found]; for (const [k, asc] of [...this.sorts].reverse()) found.sort((a, b) => String(a[k]).localeCompare(String(b[k])) * (asc ? 1 : -1))
      found = found.slice(this.from, this.to + 1)
      return Promise.resolve({ data: structuredClone(this.one ? found[0] ?? null : found), error: null }).then(resolve, reject)
    } catch (error) { return Promise.reject(error).then(resolve, reject) }
  }
}
global.vocabTodoDb = { from: table => new Query(table) }
const auth = `const ctx=r=>{const role=r.headers.get('x-test-role')||'student';return {role,realRole:role,userId:'${student}',email:'teacher@test',scopeEmail:r.headers.get('x-test-owner')||'teacher@test',viewingAsTeacher:r.headers.get('x-test-viewing')==='true'}};export const withAuth=f=>r=>f(r,ctx(r));export const withRole=(roles,f)=>withAuth((r,c)=>roles.includes(c.role)?f(r,c):Response.json({error:'Forbidden'},{status:403}));export const withContentEditor=(_a,f)=>withRole(['teacher','admin'],f);`
async function main() {
  const mocks = { 'server-only': '', '@/lib/api-auth': auth, '@/lib/supabase': 'export const supabaseAdmin=globalThis.vocabTodoDb;', 'next/server': 'export const NextResponse={json:(d,o)=>Response.json(d,o)};' }
  await build({ stdin: { contents: "export * as tasks from './src/app/api/vocab/tasks/route';export * as checks from './src/app/api/vocab/checks/route'", resolveDir: root }, outfile: path.join(out, 'routes.cjs'), bundle: true, platform: 'node', plugins: [{ name: 'fixture', setup(b) { b.onResolve({ filter: /.*/ }, a => Object.hasOwn(mocks, a.path) ? { path: a.path, namespace: 'fixture' } : undefined); b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: mocks[a.path], loader: 'js' })) } }] })
  const handlers = require(path.join(out, 'routes.cjs'))
  const call = async (route, method = 'GET', body, role = 'student', extra = {}) => {
    const req = new Request(`http://fixture/api/vocab/${route}?task_id=${taskId}`, { method, headers: { 'Content-Type': 'application/json', 'x-test-role': role, ...extra }, ...(body ? { body: JSON.stringify(body) } : {}) })
    const r = await handlers[route][method](req); return { status: r.status, body: await r.json() }
  }
  const round = async () => {
    const start = (await call('checks', 'POST', { task_id: taskId })).body
    const body = { task_id: taskId, check_id: start.check_id, responses: start.items.map(i => ({ id: i.id, response: words.find(w => w.definition === i.prompt).id, supports: [] })) }
    assert.equal((await call('checks', 'POST', body)).status, 200)
    await call('checks', 'POST', body)
  }
  assert.equal((await call('checks')).body.progress.completedChecks, 0)
  await round()
  let p = (await call('checks')).body.progress
  assert.equal(p.completedChecks, 1); assert.equal(p.checksRemaining, 1); assert.equal(p.complete, false)
  await round()
  p = (await call('checks')).body.progress
  assert.equal(p.completedChecks, 2); assert.equal(p.complete, true)
  assert.equal((await call('tasks')).body.tasks[0].progress[0].complete, true)
  const evidence = structuredClone(rows.vocab_checks)
  for (const [role, extra] of [['student', {}], ['teacher', { 'x-test-owner': 'other@test' }], ['teacher', { 'x-test-viewing': 'true' }]]) assert.equal((await call('tasks', 'PATCH', { id: taskId, active: false }, role, extra)).status, 403)
  assert.equal((await call('tasks', 'PATCH', { id: taskId, active: false }, 'teacher')).status, 200)
  assert.equal((await call('tasks')).body.tasks.length, 0)
  assert.equal((await call('checks', 'POST', { task_id: taskId })).status, 403)
  assert.deepEqual(rows.vocab_checks, evidence)
  assert.equal((await call('tasks', 'PATCH', { id: taskId, active: true }, 'teacher')).status, 200)
  assert.equal((await call('tasks')).body.tasks[0].progress[0].complete, true)
  rows.vocab_checks.forEach(c => { c.completed_at = '2026-09-02T12:00:00Z' })
  p = (await call('tasks')).body.tasks[0].progress[0]
  assert.equal(p.complete, true); assert.equal(p.reviewDue, true)
  console.log('PASS: real vocabulary routes: saved progress, remaining checks, idempotent submission, completion, owner/student/preview authorization, removal, evidence preservation, restore, optional stale review.')
  if (!process.argv.includes('--serve')) return
  reset()
  const clientMocks = { 'next/link': "import React from 'react';export default function Link(p){return React.createElement('a',p)}", '@/components/lessons/LanguageProfileProvider': "export const LanguageProfileProvider=({children})=>children;export const useLanguageProfile=()=>({profile:null});" }
  await build({ stdin: { contents: `import React,{useState,useEffect} from 'react';import{createRoot}from'react-dom/client';import Settings from './src/components/vocabulary/VocabAssignmentSettings';import Work from './src/app/vocabulary/work/page';import Cards from './src/components/vocabulary/VocabTaskCards';const nativeFetch=window.fetch;window.fetch=(u,o={})=>nativeFetch(u,{...o,headers:{...o.headers,'x-test-role':location.pathname==='/teacher'?'teacher':'student'}});function Teacher(){const[t,setT]=useState(null);const load=async()=>{const r=await fetch('/api/vocab/tasks');setT((await r.json()).tasks[0])};useEffect(()=>{load()},[]);return t?<main className="mx-auto max-w-3xl p-4"><h1>Vocabulary assignment</h1><Settings task={t} onSaved={load}/></main>:<p>Loading...</p>}function Home(){const[s,setS]=useState(null);return <main className="mx-auto max-w-3xl p-4"><h1>Home</h1><p role="status">{s?.state==='ready'?s.completed+' of '+s.total+' done':'Checking assignments'}</p><Cards compact onStatus={setS}/></main>}createRoot(document.getElementById('root')).render(location.pathname==='/teacher'?<Teacher/>:location.pathname==='/home'?<Home/>:<Work/>);`, resolveDir: root, loader: 'tsx' }, outfile: path.join(out, 'ui.js'), bundle: true, platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'client-fixture', setup(b) { b.onResolve({ filter: /.*/ }, a => Object.hasOwn(clientMocks, a.path) ? { path: a.path, namespace: 'fixture' } : undefined); b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: clientMocks[a.path], loader: 'js', resolveDir: root })) } }] })
  const cssResult = await require('postcss')([require('@tailwindcss/postcss')({ base: root })]).process(fs.readFileSync(path.join(root, 'src/app/globals.css'), 'utf8'), { from: path.join(root, 'src/app/globals.css') })
  const css = cssResult.css
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1:4337')
      if (url.pathname === '/fixture') {
        if (url.searchParams.has('reset')) reset()
        if (url.searchParams.has('stale')) rows.vocab_checks.forEach(c => { c.completed_at = '2026-09-02T12:00:00Z' })
        if (url.searchParams.has('fail-progress')) failProgress = true
        if (url.searchParams.has('fail-save')) failSave = true
        if (url.searchParams.has('fail-archive')) failArchive = true
        res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(rows)); return
      }
      if (url.pathname === '/ui.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(fs.readFileSync(path.join(out, 'ui.js'))); return }
      if (url.pathname === '/style.css') { res.setHeader('Content-Type', 'text/css'); res.end(css); return }
      if (url.pathname.startsWith('/api/')) {
        if (url.pathname === '/api/vocab/sources') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ sets: [] })); return }
        if (url.pathname === '/api/vocab/xp') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ earned: rows.vocab_checks.some(c => c.completed_at) ? 5 : 0 })); return }
        const route = url.pathname.split('/')[3]; let body = ''; for await (const chunk of req) body += chunk
        if (route === 'checks' && req.method === 'GET' && failProgress) { failProgress = false; res.writeHead(503); res.end('{}'); return }
        if (route === 'checks' && req.method === 'POST' && body.includes('check_id') && failSave) { failSave = false; res.writeHead(503); res.end(JSON.stringify({ error: 'Check could not save. Please retry.' })); return }
        if (route === 'tasks' && req.method === 'PATCH' && failArchive) { failArchive = false; res.writeHead(503); res.end(JSON.stringify({ error: 'Could not update the assignment.' })); return }
        const r = await handlers[route][req.method](new Request(url, { method: req.method, headers: req.headers, ...(body ? { body } : {}) }))
        res.writeHead(r.status, { 'Content-Type': 'application/json' }); res.end(await r.text()); return
      }
      if (url.pathname === '/') { res.writeHead(302, { Location: `/vocabulary/work?task_id=${taskId}` }); res.end(); return }
      res.setHeader('Content-Type', 'text/html'); res.end('<html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><title>Vocabulary verification</title></head><body><div id="root"></div><script src="/ui.js"></script></body></html>')
    } catch (error) { console.error(error); res.writeHead(500); res.end(JSON.stringify({ error: error.message })) }
  })
  server.listen(4337, '127.0.0.1', () => console.log('Vocabulary verification: http://127.0.0.1:4337'))
}
main().catch(error => { console.error(error); process.exitCode = 1 })
