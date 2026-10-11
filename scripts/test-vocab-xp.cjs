/* Isolated API/browser regression fixture. No real student records or credentials. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const http = require('node:http')
const { randomUUID } = require('node:crypto')
const { build } = require('esbuild')
const root = path.resolve(__dirname, '..')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vocab-xp-'))
const student = '10000000-0000-4000-8000-000000000001'
const other = '10000000-0000-4000-8000-000000000002'
const set = '10000000-0000-4000-8000-000000000003'
const words = ['motion', 'speed', 'distance', 'time'].map((term, i) => ({ id: `20000000-0000-4000-8000-00000000000${i}`, term, definition: `Definition of ${term}` }))
let rows = [], insertFailure = false, totalsFailure = false, postCount = 0
const totals = user => Math.min(5, rows.filter(r => r.user_id === user).reduce((n, r) => n + Math.min(25, Math.round(r.score / 10)), 0))
class Query {
  constructor(data) { this.data = data; this.filters = [] }
  select() { return this }
  eq(k, v) { this.filters.push(r => r[k] === v); return this }
  gte(k, v) { this.filters.push(r => r[k] >= v); return this }
  lt(k, v) { this.filters.push(r => r[k] < v); return this }
  order() { return this }
  limit() { return this }
  insert(row) { this.row = row; return this }
  single() { this.one = true; return this }
  maybeSingle() { this.one = true; return this }
  then(resolve, reject) {
    if (this.row) {
      if (insertFailure) { insertFailure = false; return Promise.resolve({ data: null, error: { message: 'Fixture save failure' } }).then(resolve, reject) }
      if (rows.some(r => r.id === this.row.id)) return Promise.resolve({ data: null, error: { code: '23505' } }).then(resolve, reject)
      const record = { ...this.row, created_at: new Date().toISOString() }
      rows.push(record)
      return Promise.resolve({ data: record, error: null }).then(resolve, reject)
    }
    const data = this.data().filter(r => this.filters.every(f => f(r)))
    return Promise.resolve({ data: this.one ? data[0] ?? null : data, error: null }).then(resolve, reject)
  }
}
globalThis.__vocabXpDb = {
  from: () => new Query(() => rows),
  rpc: (name, args) => {
    if (name === 'economy_totals') {
      if (totalsFailure) { totalsFailure = false; return Promise.resolve({ data: null, error: new Error('Fixture total failure') }) }
      return Promise.resolve({ data: { lifetimeEarned: 100 + totals(args.p_user_id), spent: 0, balance: 100 + totals(args.p_user_id) }, error: null })
    }
    assert.equal(name, 'economy_earning_events')
    const midnight = new Date(); midnight.setUTCHours(0, 0, 0, 0)
    return new Query(() => [...new Set(rows.map(r => r.user_id))].map(user => ({ user_id: user, source: 'vocabulary', points: totals(user), earned_at: midnight.toISOString() })))
  },
}
const auth = `export const withAuth=fn=>async req=>{try{return await fn(req,{userId:req.headers.get('x-student')||'${student}',email:'test@example.invalid'})}catch{return new Response('{}',{status:500})}};export const withEnrolledStudent=withAuth;`
async function main() {
  const apiBuild = await build({ entryPoints: ['src/app/api/student-progress/game-scores/route.ts'], absWorkingDir: root, bundle: true, write: false, platform: 'node', format: 'cjs', plugins: [{ name: 'fixture', setup(b) {
    b.onResolve({ filter: /^@\/lib\/(api-auth|supabase|teacher-scope|user-db)$/ }, a => ({ path: a.path, namespace: 'stub' }))
    b.onLoad({ filter: /.*/, namespace: 'stub' }, a => ({ contents: a.path.endsWith('api-auth') ? auth : a.path.endsWith('supabase') ? 'export const supabaseAdmin=globalThis.__vocabXpDb' : a.path.endsWith('user-db') ? 'export const getScopedDb=()=>globalThis.__vocabXpDb' : 'export const resolveTargetStudent=async c=>({ok:true,userId:c.selfId})', loader: 'js' }))
    b.onResolve({ filter: /^next\/server$/ }, () => ({ path: require.resolve('next/server'), external: true }))
  } }] })
  const apiPath = path.join(tmp, 'route.cjs'); fs.writeFileSync(apiPath, apiBuild.outputFiles[0].text)
  const api = require(apiPath)
  const payload = score => ({ event_id: randomUUID(), vocabulary_set_id: set, game_type: 'matching', score })
  const post = (body, who = student) => api.POST(new Request('http://fixture/api/student-progress/game-scores', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-student': who }, body: JSON.stringify(body) }))
  let first = payload(15)
  let response = await post({ ...first, accuracy: 0, time_spent: 0 })
  assert.equal(response.status, 201)
  const saved = await response.json()
  assert.deepEqual(saved.xp, { dailyEarned: 2, dailyCap: 5, lifetimeEarned: 102 })
  assert.equal(saved.accuracy, 0); assert.equal(saved.time_spent, 0)
  assert.equal((await post(first)).status, 200); assert.equal(rows.length, 1)
  assert.equal((await post({ ...first, score: 90 })).status, 409)
  assert.equal((await post(first, other)).status, 409)
  for (const score of [-1, 1.5, '151', 2147483648]) assert.equal((await post(payload(score))).status, 400)
  assert.equal((await post({ ...payload(2), event_id: 'invalid' })).status, 400)
  const large = await (await post(payload(151))).json()
  assert.equal(large.xp.dailyEarned, 5); assert.equal(large.xp.lifetimeEarned, 105)
  const capped = await (await post(payload(1000))).json()
  assert.equal(capped.xp.lifetimeEarned, 105)
  totalsFailure = true
  const lost = payload(100)
  assert.equal((await post(lost)).status, 500)
  const count = rows.length
  assert.equal((await post(lost)).status, 200); assert.equal(rows.length, count)
  const simultaneous = payload(100)
  const concurrent = await Promise.all([post(simultaneous), post(simultaneous)])
  assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 201])
  assert.equal(rows.filter(r => r.id === simultaneous.event_id).length, 1)
  console.log('PASS: authoritative XP, cap, rounding, zero metrics, save retry, response loss, ownership, immutable IDs, concurrent duplicate and invalid input.')
  if (!process.argv.includes('--serve')) return

  rows = []
  const client = await build({ stdin: { contents: `import React from 'react';import{createRoot}from'react-dom/client';import End from './src/components/vocabulary/arcade/ArcadeEndScreen';import Matching from './src/app/vocabulary/matching/page';function App(){const[n,setN]=React.useState(0);return location.pathname==='/matching'?<Matching/>:<End key={n} gameType="matching" gameTitle="Matching" vocabularySetId={location.search.includes('missing')?null:'${set}'} score={151} onPlayAgain={()=>setN(n+1)}/>};createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);`, resolveDir: root, loader: 'tsx' }, bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' }, plugins: [{ name: 'browser-fixture', setup(b) {
    b.onResolve({ filter: /^next\/link$/ }, () => ({ path: 'link', namespace: 'stub' }))
    b.onResolve({ filter: /^next-auth\/react$/ }, () => ({ path: 'session', namespace: 'stub' }))
    b.onResolve({ filter: /LanguageProfileProvider$/ }, () => ({ path: 'language', namespace: 'stub' }))
    b.onLoad({ filter: /.*/, namespace: 'stub' }, a => ({ contents: a.path === 'link' ? `import React from 'react';export default function Link(p){return React.createElement('a',p)}` : a.path === 'session' ? `export const useSession=()=>({status:'authenticated',data:{user:{id:'${student}'}}})` : `export const LanguageProfileProvider=({children})=>children;export const LanguageDial=()=>null;export const useLanguageProfile=()=>({profile:null,dial:'bare',showL1:false});`, loader: 'js', resolveDir: root }))
  } }] })
  const cssDir = path.join(root, '.next/static/css')
  const css = fs.existsSync(cssDir) ? fs.readdirSync(cssDir).filter(f => f.endsWith('.css')).map(f => fs.readFileSync(path.join(cssDir, f), 'utf8')).join('\n') : ''
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1:3126')
    if (url.pathname === '/ui.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(client.outputFiles[0].text) }
    if (url.pathname === '/style.css') { res.setHeader('Content-Type', 'text/css'); return res.end(css) }
    if (url.pathname === '/fixture') {
      if (url.searchParams.has('reset')) { rows = []; postCount = 0 }
      if (url.searchParams.has('fail-save')) insertFailure = true
      if (url.searchParams.has('fail-total')) totalsFailure = true
      res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ rows, postCount }))
    }
    if (url.pathname === '/api/student-progress/game-scores') {
      let body = ''; for await (const chunk of req) body += chunk
      if (req.method === 'POST') postCount++
      const response = await api[req.method](new Request(url, { method: req.method, headers: req.headers, ...(body ? { body } : {}) }))
      res.writeHead(response.status, { 'Content-Type': 'application/json' }); return res.end(await response.text())
    }
    if (url.pathname === '/api/vocab/sources') return res.end(JSON.stringify({ units: [], assigned: [], lessons: [{ id: 'motion', title: 'Motion words', unit: 'unit1' }] }))
    if (url.pathname === '/api/vocab/play') return res.end(JSON.stringify({ terms: words, scoreSetId: set, label: 'Motion words' }))
    if (url.pathname === '/api/vocab/attempts') { let body = ''; for await (const c of req) body += c; return res.end(JSON.stringify({ recorded: JSON.parse(body).attempts.length })) }
    if (url.pathname === '/home') return res.end(`<h1>Home XP total: ${100 + totals(student)}</h1>`)
    res.setHeader('Content-Type', 'text/html')
    res.end('<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root" class="p-6"></div><script src="/ui.js"></script></body></html>')
  })
  server.listen(3126, '127.0.0.1', () => console.log('Vocabulary XP fixture: http://127.0.0.1:3126/ and /matching (Strict Mode, isolated database)'))
}
main().catch(e => { console.error(e); process.exitCode = 1 })
