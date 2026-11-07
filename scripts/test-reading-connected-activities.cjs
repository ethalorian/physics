/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS regression harness. */
// Actual route, auth wrapper, enrollment/ownership lookup and bundle projection.
// Only authentication providers and the database transport use fictional data.
const assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path')
const root = path.resolve(__dirname, '..'), out = fs.mkdtempSync(path.join(os.tmpdir(), 'reading-connections-'))
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const student = { role: 'student', realRole: 'student', scopeEmail: 'student@example.test', viewingAsTeacher: false }
const fixture = global.__readingConnections = {
  session: { user: { id: id(10), email: student.scopeEmail } }, context: student,
  queries: [], rows: {
    courses: [
      { id: id(1), name: 'MVP Engineering', program: 'trades', teacher_email: 'teacher@example.test', archived_at: null },
      { id: id(2), name: 'Physics', program: 'physics', track: 'cpa', teacher_email: 'teacher@example.test', archived_at: null },
      { id: id(3), name: 'Other Engineering', program: 'trades', teacher_email: 'other@example.test', archived_at: null },
    ],
    course_students: [1, 2].map(n => ({ id: id(50 + n), course_id: id(n), student_id: id(10), enrollment_state: 'ACTIVE' })),
    reading_syllabus_bundles: [{ course_id: id(2), step_id: 'quantities', reading_id: id(20), practice_id: id(21), reading_quiz_id: id(22), vocabulary_quiz_id: id(23) }],
    textbook_assignments: [{ id: id(20), title: 'Physics reading', status: 'published', due_at: '2026-11-01T23:59:00Z', opens_at: null }],
    textbook_work: [{ assignment_id: id(20), user_id: id(10), state: 'in_progress' }, { assignment_id: id(20), user_id: id(11), state: 'rated', answers: 'PRIVATE OTHER WORK' }],
  },
}
global.__readingConnectionsDB = { from(table) {
  const filters = []; let columns = '*', start = 0, end = 499, single = false
  const q = { select(v) { columns = v; return q }, eq(k, v) { filters.push(r => r[k] === v); return q },
    in(k, values) { filters.push(r => values.includes(r[k])); return q }, is(k, v) { filters.push(r => r[k] === v); return q },
    order() { return q }, range(a, b) { start = a; end = b; return q }, maybeSingle() { single = true; return q },
    then(resolve, reject) {
      fixture.queries.push(table)
      const rows = (fixture.rows[table] || []).filter(r => filters.every(fn => fn(r))).slice(start, end + 1)
      const data = rows.map(r => columns === '*' || columns.includes('(') ? structuredClone(r) : Object.fromEntries(columns.split(',').map(k => [k, r[k]])))
      return Promise.resolve({ data: single ? data[0] ?? null : data, error: null }).then(resolve, reject)
    },
  }; return q
}, rpc() { throw Error('No database writes permitted in this test') } }
const mocks = {
  'server-only': '', 'next/server': `export const NextResponse={json:(data,options)=>Response.json(data,options)};`,
  '@/lib/auth': `export const auth=async()=>global.__readingConnections.session;`,
  '@/lib/effective-context': `export const getEffectiveContext=async()=>global.__readingConnections.context;`,
  '@/lib/student-enrollment': `export const requireEnrolledStudent=async()=>null;`,
  '@/lib/content-access': `export const canEditArea=async()=>false;`,
  '@/lib/supabase': `export const supabaseAdmin=global.__readingConnectionsDB;`,
  '@/lib/lookup-database': `export const lookupDatabase=global.__readingConnectionsDB;`,
  '@/lib/vocab-scope-server': `export const vocabularyFor=()=>{throw Error('Unexpected authoring')};`,
}
;(async () => {
  await require('esbuild').build({ entryPoints: [root + '/src/app/api/reading-syllabus/route.ts'], outfile: out + '/api.cjs', bundle: true, platform: 'node', format: 'cjs', plugins: [{ name: 'fictional-transport', setup(b) {
    b.onResolve({ filter: /.*/ }, a => Object.hasOwn(mocks, a.path) ? { path: a.path, namespace: 'fixture' } : undefined)
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: mocks[a.path], loader: 'js' }))
  } }] })
  const api = require(out + '/api.cjs')
  const get = (n = 1, suffix = '') => api.GET(new Request(`http://fixture/api/reading-syllabus?course_id=${id(n)}${suffix}`))
  const post = () => api.POST(new Request('http://fixture/api/reading-syllabus', { method: 'POST', body: JSON.stringify({ action: 'prepare', course_id: id(1), step_id: 'quantities' }) }))
  let response = await get(), body = await response.json()
  assert.equal(response.status, 200, JSON.stringify(body)); assert.deepEqual(body.bundles, []); assert.equal(body.staff, false)
  assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.deepEqual(body.targets, [])
  assert(!fixture.queries.includes('textbook_work'), 'Standalone readings need no student-work lookup')
  console.log('PASS enrolled Engineering reader: valid empty optional connections, no work lookup')
  fixture.session.experience = { readOnly: true }
  assert.equal((await get()).status, 200); assert.equal((await post()).status, 403)
  delete fixture.session.experience
  assert.equal((await get(3)).status, 403); assert.equal((await post()).status, 403)
  fixture.rows.course_students[0].enrollment_state = 'INACTIVE'; assert.equal((await get()).status, 403)
  fixture.rows.course_students[0].enrollment_state = 'ACTIVE'; fixture.rows.courses[0].archived_at = new Date().toISOString(); assert.equal((await get()).status, 403)
  fixture.rows.courses[0].archived_at = null
  const session = fixture.session; fixture.session = null; assert.equal((await get()).status, 401); fixture.session = session
  console.log('PASS read-only walkthrough, active enrollment, archive, unrelated class and authentication boundaries')
  body = await (await get(2)).json(); assert.equal(body.bundles.length, 1); assert.equal(body.bundles[0].reading.state, 'in_progress')
  assert.equal(body.bundles[0].reading_quiz_id, ''); assert(!JSON.stringify(body).includes('PRIVATE OTHER WORK'))
  assert.equal((await get(1, '&calendar=1')).status, 403)
  console.log('PASS Physics connections and private student projection unchanged; student teacher-calendar access denied')
  fixture.context = { role: 'teacher', realRole: 'teacher', scopeEmail: 'teacher@example.test', viewingAsTeacher: false }
  fixture.session = { user: { id: id(90), email: fixture.context.scopeEmail } }
  assert.equal((await get()).status, 200); assert.equal((await get(3)).status, 403)
  body = await (await get(1, '&calendar=1')).json(); assert.deepEqual(body.bundles, []); assert.deepEqual(body.targets, [])
  assert.equal((await post()).status, 403, 'Engineering must not enable Physics syllabus authoring')
  console.log('PASS teacher ownership, empty Engineering calendar and Physics-only authoring retained')
})().catch(e => { console.error(e); process.exitCode = 1 })
