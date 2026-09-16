// Real navigation, list, reader page, authorization and window helpers with a
// synthetic database. SELECT columns are checked against the production schema
// so an invented column cannot silently pass through this test double.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os')
const http = require('node:http'), assert = require('node:assert/strict')
const root = path.resolve(__dirname, '..'), pkg = name => require(path.join(root, 'node_modules', name))
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'student-lessons-'))
const lessonColumns = new Set('id title slug content description published created_at updated_at unit lesson_number videos estimated_time objectives lesson_type simulation_id embedded_questions question_timing content_blocks planned_days hero_image unit_id visibility_track transfer_core'.split(' '))
const past = new Date(Date.now() - 86400000).toISOString(), future = new Date(Date.now() + 86400000).toISOString()
const courses = [
  { id: 'cpa', program: 'physics', track: 'cpa' }, { id: 'honors', program: 'physics', track: 'honors' },
  { id: 'trades', program: 'trades', track: 'cpa' }, { id: 'projects', program: 'projects', track: 'cpa' },
  { id: 'other', program: 'physics', track: 'cpa' },
]
function lesson(id, patch = {}) {
  return { id, slug: id, title: id + ' lesson', description: 'Investigate ' + id, unit: 'Motion', unit_id: 'physics-unit',
    published: true, lesson_number: 1, lesson_type: null, visibility_track: null, objectives: [],
    embedded_questions: [{ correctAnswer: 'PRIVATE ANSWER' }],
    content_blocks: { schemaVersion: 1, dayType: 'STANDARD', blocks: [{ id: 'intro', type: 'prose', markdown: 'Measure the cart position twice.' }] }, ...patch }
}
const tables = {
  courses, course_students: courses.map(c => ({ id: 'roster-' + c.id, student_id: 'student-' + c.id, course_id: c.id })),
  units: [{ id: 'physics-unit', program: 'physics' }, { id: 'physics-2', program: 'physics' }, { id: 'trades-unit', program: 'trades' }, { id: 'projects-unit', program: 'projects' }],
  lessons: [lesson('open'), lesson('video', { unit: 'Energy', unit_id: 'physics-2', lesson_type: 'video', lesson_number: 2 }),
    lesson('closed'), lesson('scheduled'), lesson('unreleased'), lesson('unpublished', { published: false }),
    lesson('honors-only', { visibility_track: 'honors' }), lesson('other-class'),
    lesson('trades', { unit_id: 'trades-unit' }), lesson('projects', { unit_id: 'projects-unit' })],
  lesson_class_windows: [], lesson_progress: [{ user_id: 'student-cpa', lesson_id: 'video', progress_percentage: 25, status: 'in_progress' }],
}
function window(course_id, lesson_id, open_at = past, close_at = null) { tables.lesson_class_windows.push({ course_id, lesson_id, open_at, close_at }) }
for (const id of ['open', 'video', 'unpublished', 'honors-only', 'trades', 'projects']) window('cpa', id)
window('cpa', 'closed', past, past); window('cpa', 'scheduled', future)
window('honors', 'open'); window('honors', 'honors-only'); window('other', 'other-class')
window('trades', 'trades'); window('projects', 'projects')
let failList = false, listRequests = 0, browser, server
class Query {
  constructor(table) { this.table = table; this.filters = []; this.cols = '*'; this.orders = [] }
  select(cols, options) { this.cols = cols; this.head = options?.head; return this }
  eq(k, v) { this.filters.push(row => row[k] === v); return this }
  in(k, values) { this.filters.push(row => values.includes(row[k])); return this }
  or(expression) {
    const terms = expression.split(',').map(term => {
      const [key, op, ...rest] = term.split('.'), value = rest.join('.')
      return row => op === 'is' ? row[key] == null : op === 'eq' ? row[key] === value : op === 'ilike' ? String(row[key] ?? '').toLowerCase().includes(value.replaceAll('%', '').toLowerCase()) : false
    })
    this.filters.push(row => terms.some(test => test(row))); return this
  }
  order(k, { ascending }) { this.orders.push({ k, ascending }); return this }
  maybeSingle() { this.one = true; return this }
  then(resolve, reject) {
    try {
      const cols = this.cols.split(',').map(c => c.trim())
      if (this.table === 'lessons' && this.cols !== '*') {
        const missing = cols.find(c => !lessonColumns.has(c))
        if (missing) return Promise.resolve({ data: null, error: { code: '42703', message: 'column lessons.' + missing + ' does not exist' } }).then(resolve, reject)
      }
      let rows = (tables[this.table] ?? []).filter(r => this.filters.every(f => f(r)))
      for (const { k, ascending } of [...this.orders].reverse()) rows.sort((a, b) => String(a[k]).localeCompare(String(b[k])) * (ascending ? 1 : -1))
      const count = rows.length
      rows = rows.map(row => this.cols.includes('courses (') ? { courses: courses.find(c => c.id === row.course_id) } : this.cols === '*' ? structuredClone(row) : Object.fromEntries(cols.map(k => [k, row[k]])))
      return Promise.resolve({ data: this.head ? null : this.one ? rows[0] ?? null : rows, error: null, count }).then(resolve, reject)
    } catch (error) { return Promise.reject(error).then(resolve, reject) }
  }
}
const actor = (id = 'cpa', role = 'student') => ({ userId: 'student-' + id, email: id + '@fixture.test', role, realRole: role })
global.__studentLessons = { from: t => new Query(t), rpc: async () => ({ data: {}, error: null }), actor: actor() }
function plugin(mocks) {
  return { name: 'isolated-fixtures', setup(build) {
    build.onResolve({ filter: /.*/ }, a => mocks[a.path] ? { path: a.path, namespace: 'fixture' } : undefined)
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: mocks[a.path], loader: 'tsx', resolveDir: root }))
  } }
}
const serverMocks = {
  '@/lib/supabase': 'export const supabaseAdmin=global.__studentLessons;',
  'next/server': 'export const NextResponse={json:(data,options)=>Response.json(data,options)};',
  '@/lib/api-auth': 'export const withAuth=fn=>fn;',
  '@/lib/content-access': 'export const canEditArea=async()=>false;',
  '@/lib/auth': 'export const auth=async()=>({user:{id:global.__studentLessons.actor.userId,email:global.__studentLessons.actor.email}});',
  '@/lib/effective-context': 'export const getEffectiveContext=async()=>global.__studentLessons.actor;',
  'next/navigation': 'export const notFound=()=>{throw Object.assign(new Error("Not found"),{status:404})};export const redirect=()=>{throw new Error("Unexpected redirect")};',
  'next/link': 'export default function Link(p){return <a {...p}/>}',
  // Capture the actual RSC's authorized reader props at the server/client boundary.
  '@/components/lessons/BlockLessonViewer': 'export default function Reader(p){global.__studentLessons.reader=p;return null}',
  '@/components/lessons/TradeLessonShell': 'export default function Reader(p){global.__studentLessons.reader=p;return null}',
  '@/components/lessons/LessonActivityTracker': 'export default function Tracker(p){return p.children}',
}
async function load(file, name) {
  const outfile = path.join(out, name + '.cjs')
  await pkg('esbuild').build({ absWorkingDir: root, entryPoints: [file], outfile, bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', plugins: [plugin(serverMocks)], logLevel: 'silent' })
  return require(outfile)
}
;(async () => {
  const list = await load('src/app/api/lessons/published/route.ts', 'list')
  const enrollment = await load('src/app/api/me/enrollment/route.ts', 'enrollment')
  const access = await load('src/lib/lesson-access.ts', 'access')
  const readerPage = await load('src/app/lessons/[slug]/page.tsx', 'reader-page')
  const request = query => new Request('http://fixture/api/lessons/published' + (query || ''))
  async function catalog(who = actor(), query = '') {
    const response = await list.GET(request(query), who)
    assert.equal(response.status, 200, await response.clone().text())
    return response.json()
  }
  assert.equal((await new Query('lessons').select('id, difficulty')).error.code, '42703')
  const cpa = await catalog()
  assert.deepEqual(cpa.lessons.map(l => l.id).sort(), ['closed', 'open', 'video'])
  assert.equal(cpa.lessons.find(l => l.id === 'closed').window.state, 'closed')
  assert.equal(cpa.lessons.find(l => l.id === 'open').lesson_type, 'markdown')
  assert.equal(cpa.progress.video, 25)
  assert.ok(!JSON.stringify(cpa).includes('PRIVATE ANSWER'))
  assert.ok(cpa.lessons.every(l => !('content_blocks' in l) && !('embedded_questions' in l)))
  console.log('PASS schema-checked student list: open lessons and locked history only; metadata contains no bodies or keys')
  for (const [id, expected] of [['honors', ['honors-only', 'open']], ['trades', ['trades']], ['projects', ['projects']], ['other', ['other-class']]]) {
    const result = await catalog(actor(id))
    assert.deepEqual(result.lessons.map(l => l.id).sort(), expected)
    for (const lesson of result.lessons) assert.equal((await access.authorizeLesson(actor(id), lesson.id)).ok, true)
  }
  for (const id of ['open', 'video']) assert.equal((await access.authorizeLesson(actor(), id)).ok, true)
  for (const id of ['closed', 'scheduled', 'unreleased', 'unpublished', 'honors-only', 'other-class', 'trades', 'projects']) assert.equal((await access.authorizeLesson(actor(), id)).ok, false)
  assert.equal((await list.GET(request(), actor('unrostered'))).status, 403)
  assert.equal((await list.GET(request(), actor('observer', 'observer'))).status, 403)
  console.log('PASS real enrollment, class window, curriculum and track gates agree between list and reader')
  assert.deepEqual((await catalog(actor(), '?lesson_type=video')).lessons.map(l => l.id), ['video'])
  assert.deepEqual((await catalog(actor(), '?lesson_type=markdown&unit=Motion&search=open')).lessons.map(l => l.id), ['open'])
  assert.deepEqual((await catalog(actor(), '?difficulty=beginner')).lessons.map(l => l.id).sort(), ['closed', 'open', 'video'])
  const staff = await catalog(actor('teacher', 'teacher'), '?course_id=trades')
  assert.deepEqual(staff.lessons.map(l => l.id), ['trades'])
  console.log('PASS type, unit and search filters; legacy difficulty URL; staff class scope')
  if (process.argv.includes('--api-only')) return

  const clientMocks = {
    'next/link': 'export default function Link({prefetch,...p}){return <a {...p}/>}',
    'next/navigation': 'const router={push:p=>location.assign(p),refresh:()=>location.reload()};export const useRouter=()=>router;export const usePathname=()=>location.pathname;export const useSearchParams=()=>new URLSearchParams(location.search);',
    'next-auth/react': 'export const useSession=()=>({data:{user:{id:"student-cpa",email:"cpa@fixture.test",name:"Student",role:"student"}},status:"authenticated"});export const signIn=()=>{};',
    '@/contexts/ViewModeContext': 'export const useViewMode=()=>({viewMode:"student"});',
    '@/hooks/useViewAwarePermissions': 'export const useViewAwarePermissions=()=>({isAuthenticated:true,canAccessAdmin:false});',
    '@/lib/use-view-as': 'export const useViewAs=()=>({role:"student",viewingAs:false});',
    '@/components/AccountMenu': 'export default function AccountMenu(){return null}',
    '@/components/NotificationBell': 'export default function NotificationBell(){return null}',
    '@/components/ui/theme-toggle': 'export const ThemeToggle=()=>null;',
    '@/components/physics-level-badge': 'export const PhysicsLevelBadge=()=>null;',
  }
  await pkg('esbuild').build({ absWorkingDir: root, stdin: { resolveDir: root, loader: 'tsx', contents:
    'import React from "react";import{createRoot}from"react-dom/client";import Navbar from "./src/components/navbar";import LessonsPage from "./src/app/lessons/page";import Reader from "./src/components/lessons/BlockLessonViewer";createRoot(document.getElementById("root")).render(<><Navbar/>{location.pathname==="/lessons"?<LessonsPage/>:window.readerProps?<Reader {...window.readerProps}/>:<h1>Student home</h1>}</>);' },
    outfile: out + '/app.js', bundle: true, platform: 'browser', format: 'esm', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' }, plugins: [plugin(clientMocks)], logLevel: 'silent' })
  const css = await pkg('postcss')([pkg('@tailwindcss/postcss/dist/index.js')({ base: root })]).process(fs.readFileSync(root + '/src/app/globals.css', 'utf8'), { from: root + '/src/app/globals.css' })
  fs.writeFileSync(out + '/style.css', css.css + '\n' + fs.readFileSync(out + '/app.css', 'utf8'))
  server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://fixture')
    const send = async response => { res.writeHead(response.status, { 'Content-Type': 'application/json' }); res.end(await response.text()) }
    try {
      if (url.pathname === '/api/lessons/published') {
        listRequests++
        if (failList) return send(Response.json({ error: 'Temporary failure' }, { status: 500 }))
        return send(await list.GET(new Request(url), actor()))
      }
      if (url.pathname === '/api/me/enrollment') return send(await enrollment.GET(new Request(url), actor()))
      if (url.pathname.startsWith('/api/')) return send(Response.json({ terms: [], targets: [], responses: {}, drafts: {}, locked: false, xpEarned: 0, profile: null, session: null }))
      if (['/app.js', '/style.css'].includes(url.pathname)) {
        res.setHeader('Content-Type', url.pathname.endsWith('.js') ? 'text/javascript' : 'text/css'); return res.end(fs.readFileSync(out + url.pathname))
      }
      global.__studentLessons.reader = null
      let denied = ''
      if (url.pathname.startsWith('/lessons/')) {
        const tree = await readerPage.default({ params: Promise.resolve({ slug: url.pathname.split('/').at(-1) }) })
        denied = pkg('react-dom/server').renderToStaticMarkup(tree)
      }
      const props = global.__studentLessons.reader
      res.setHeader('Content-Type', 'text/html')
      res.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"><title>Student lessons test</title></head><body><div id="root">' + denied + '</div><script>window.readerProps=' + JSON.stringify(props).replaceAll('<', '\\u003c') + '</script><script type="module" src="/app.js"></script></body></html>')
    } catch (e) { res.writeHead(e.status || 500); res.end(String(e)) }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
  browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  const base = 'http://127.0.0.1:' + server.address().port
  await page.goto(base + '/home')
  await page.getByRole('link', { name: 'Lessons', exact: true }).click()
  await page.getByText('open lesson', { exact: true }).waitFor()
  assert.equal(listRequests, 1)
  assert.equal(await page.getByRole('button', { name: 'Closed', exact: true }).isDisabled(), true)
  for (const id of ['scheduled', 'unreleased', 'unpublished', 'honors-only', 'other-class', 'trades', 'projects']) assert.equal(await page.getByText(id + ' lesson', { exact: true }).count(), 0)
  await page.screenshot({ path: out + '/student-list.png', fullPage: true })
  console.log('PASS actual student navigation → enrollment check → API → open lesson cards and locked history')
  await page.getByPlaceholder('Search lessons...').fill('unmatched')
  await page.getByText('No lessons match your filters.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await page.getByRole('combobox').nth(1).click()
  await page.getByRole('option', { name: '📹 Videos', exact: true }).click()
  assert.equal(await page.getByText('open lesson', { exact: true }).count(), 0)
  await page.getByText('video lesson', { exact: true }).waitFor()
  await page.getByRole('combobox').first().click()
  assert.equal(await page.getByRole('option', { name: 'Motion', exact: true }).count(), 1)
  await page.getByRole('option', { name: 'Motion', exact: true }).click()
  await page.getByText('No lessons match your filters.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  assert.equal(listRequests, 1)
  console.log('PASS search, type/unit filters and clearing filters preserve choices without extra requests')
  await page.getByRole('button', { name: 'Start Lesson', exact: true }).click()
  await page.waitForURL('**/lessons/open')
  await page.getByText('Measure the cart position twice.', { exact: true }).first().waitFor()
  assert.equal(await page.evaluate(() => window.readerProps.staffView), false)
  await page.screenshot({ path: out + '/student-reader.png', fullPage: true })
  console.log('PASS Start Lesson → real server lesson page/authorization → actual student reader content')
  failList = true
  await page.goto(base + '/lessons')
  await page.getByRole('alert').filter({ hasText: 'Couldn’t load lessons.' }).waitFor()
  assert.equal(await page.getByText('No lessons are available yet.', { exact: true }).count(), 0)
  failList = false
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await page.getByText('open lesson', { exact: true }).waitFor()
  console.log('PASS temporary failures are distinct from an empty class and Retry restores lessons')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(base + '/home')
  await page.getByRole('button', { name: /menu/i }).click()
  await page.getByRole('link', { name: 'Lessons', exact: true }).click()
  await page.getByText('open lesson', { exact: true }).waitFor()
  await page.screenshot({ path: out + '/student-mobile.png', fullPage: true })
  assert.deepEqual(errors, [])
  console.log('PASS mobile navigation and no browser runtime errors')
  console.log('Screenshots: ' + out)
})().catch(e => { console.error(e); process.exitCode = 1 }).finally(async () => {
  if (browser) await browser.close()
  if (server) await new Promise(resolve => server.close(resolve))
})
