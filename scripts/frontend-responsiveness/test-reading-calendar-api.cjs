const assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path')
const root = path.resolve(__dirname, '../..'), out = fs.mkdtempSync(path.join(os.tmpdir(), 'reading-calendar-api-'))
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const courses = [{ id: id(1), program: 'engineering', name: 'Engineering' }, { id: id(2), program: 'physics', name: 'Physics A', track: 'cpa' }, { id: id(3), program: 'physics', name: 'Physics B', track: 'honors' }]
const assignments = Array.from({ length: 503 }, (_, i) => ({ id: id(1000 + i), course_id: courses[i === 502 ? 2 : 1].id, status: i % 3 === 0 ? 'draft' : i % 3 === 1 ? 'published' : 'archived', version: 7, title: 'Existing reading ' + i, chapter: 2, section_ids: ['2.1'], passage: i === 0 ? 'Legacy authored passage' : null, honors_reading: null, reading: 'Chapter 2', instructions: 'Preserve', questions: [{ id: id(8000), prompt: 'Preserve' }], due_at: '2026-10-29T03:59:00Z', opens_at: null, created_at: '2026-10-01T00:00:00Z' }))
const published = assignments[1], other = assignments[502]
const rows = { textbook_assignments: assignments, course_students: [
  { id: id(40), course_id: courses[1].id, student_id: id(10), enrollment_state: 'ACTIVE' },
  { id: id(41), course_id: courses[1].id, student_id: id(11), enrollment_state: 'ACTIVE' },
  { id: id(42), course_id: courses[1].id, student_id: id(12), enrollment_state: 'INACTIVE' },
  { id: id(43), course_id: courses[2].id, student_id: id(13), enrollment_state: 'ACTIVE' },
], textbook_reading_exemptions: [{ assignment_id: published.id, user_id: id(11) }], textbook_work: [
  ...[10, 11, 12, 13].map(n => ({ assignment_id: published.id, user_id: id(n), state: 'submitted', answers: { saved: 'Do not change' }, version: 4 })),
  { assignment_id: assignments[4].id, user_id: id(10), state: 'rated', answers: { saved: 'Graded work' }, version: 3 },
  { assignment_id: other.id, user_id: id(13), state: 'submitted' },
], learning_targets: [] }
const original = JSON.stringify(rows), queries = [], bundleScopes = []
global.__calendarFixture = { courses, staff: true, userId: id(10), readOnly: false, bundleScopes }
global.__calendarDB = { from(table) {
  const filters = [], orders = []; let columns = '*', start = 0, end = Infinity
  const q = { select(v) { columns = v; return q }, eq(k, v) { filters.push(r => r[k] === v); return q }, in(k, v) { filters.push(r => v.includes(r[k])); return q }, order(k, options) { orders.push([k, options?.ascending !== false]); return q }, range(a, b) { start = a; end = b; return q }, like() { throw Error('Unexpected lesson filter') }, then(resolve, reject) {
    queries.push({ table, columns, start, end })
    const found = (rows[table] ?? []).filter(r => filters.every(test => test(r))).sort((a, b) => { for (const [k, asc] of orders) { const cmp = String(a[k]).localeCompare(String(b[k])); if (cmp) return asc ? cmp : -cmp } return 0 }).slice(start, end + 1)
    const data = found.map(r => columns === '*' ? structuredClone(r) : Object.fromEntries(columns.split(',').map(k => [k, r[k]])))
    return Promise.resolve({ data, error: null }).then(resolve, reject)
  } }; return q
} }
global.fetch = () => { throw Error('Network forbidden in fictional API test') }
const mocks = {
  'server-only': '',
  '@/lib/api-auth': `export const withAuth=fn=>req=>fn(req,{role:global.__calendarFixture.staff?'teacher':'student',userId:global.__calendarFixture.userId,viewingAsTeacher:global.__calendarFixture.readOnly});export const withRole=(_roles,fn)=>withAuth(fn);`,
  '@/lib/supabase': `export const supabaseAdmin=global.__calendarDB;`,
  '@/lib/textbook-assignments-server': `export const readingCourses=async()=>global.__calendarFixture.courses;export const readingStaff=c=>c.role==='teacher';export async function readingRows(fn){const rows=[];for(let a=0;a<50000;a+=500){const r=await fn(a,a+499);if(r.error)throw r.error;rows.push(...r.data);if(r.data.length<500)return rows}throw Error('Page limit')}export const readingJson=(d,status=200)=>Response.json(d,{status});export const readingRpcError=()=>{throw Error('Unexpected write')};`,
  '@/lib/choice-calendar-server': `export const choiceSourceDispositions=async()=>({available:{},exemptions:{}});`,
  '@/lib/reading-syllabus-server': `export const syllabusBundles=async ids=>{global.__calendarFixture.bundleScopes.push(ids);return []};`,
  '@/lib/vocab-scope-server': `export const vocabularyFor=()=>{throw Error('Unexpected write')};`,
}
async function build() {
  await require('esbuild').build({ stdin: { contents: `export {GET as readings} from './src/app/api/readings/route';export {GET as counts} from './src/app/api/readings/review-counts/route';export {GET as syllabus} from './src/app/api/reading-syllabus/route';`, resolveDir: root }, bundle: true, platform: 'node', format: 'cjs', outfile: out + '/api.cjs', plugins: [{ name: 'fictional-data', setup(b) {
    b.onResolve({ filter: /.*/ }, a => { const key = a.path.startsWith('.') && a.importer ? '@/' + path.relative(root + '/src', path.resolve(path.dirname(a.importer), a.path)).replace(/\.(ts|tsx|js)$/, '') : a.path; return Object.hasOwn(mocks, key) ? { path: key, namespace: 'fixture' } : undefined })
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: mocks[a.path], loader: 'js' }))
  } }] })
  return require(out + '/api.cjs')
}
;(async () => {
  const api = await build(), request = query => new Request('http://fixture/api/readings' + (query || ''))
  const full = await (await api.readings(request())).json(); assert.equal(full.assignments.length, 503); assert.equal(full.review_counts[published.id], 1); assert.equal(full.review_counts[other.id], 1); assert(!full.work.length)
  queries.length = 0
  const calendar = await (await api.readings(request('?calendar=1&course_id=' + courses[1].id))).json()
  assert.deepEqual(calendar.assignments, full.assignments.filter(a => a.course_id === courses[1].id)); assert.deepEqual(calendar.courses, full.courses); assert(!('review_counts' in calendar)); assert.deepEqual(calendar.work, [])
  assert(queries.every(q => q.table === 'textbook_assignments')); assert(queries.some(q => q.start === 500)); assert.equal(calendar.assignments.find(a => a.id === assignments[0].id).passage, 'Legacy authored passage')
  console.log('PASS: selected-class calendar preserves every assignment/source/version field and pagination, without querying student work, exemptions, rosters or review counts')
  queries.length = 0
  const counts = await (await api.counts(request('?course_id=' + courses[1].id))).json()
  assert.deepEqual(counts.review_counts, { [published.id]: 1 }); assert(queries.every(q => q.columns !== '*')); assert(queries.filter(q => q.table === 'textbook_work').every(q => q.columns === 'assignment_id,user_id'))
  console.log('PASS: separate counts retain submitted/active/enrolled/not-excused rules and never read answers or grades')
  for (const fn of [api.readings, api.counts, api.syllabus]) {
    queries.length = 0; assert.equal((await fn(request('?calendar=1&course_id=' + id(999)))).status, 403); assert.equal(queries.length, 0)
    global.__calendarFixture.staff = false; assert.equal((await fn(request('?calendar=1&course_id=' + courses[1].id))).status, 403); global.__calendarFixture.staff = true
  }
  console.log('PASS: unauthorized classes and student callers cannot use staff calendar/count reads')
  const defaultReadings = await (await api.readings(request('?calendar=1'))).json(); assert.deepEqual(defaultReadings.assignments, calendar.assignments)
  await api.syllabus(request('?calendar=1')); assert.deepEqual(bundleScopes.at(-1), [courses[1].id])
  const second = await (await api.readings(request('?calendar=1&course_id=' + courses[2].id))).json(); assert.deepEqual(second.assignments, full.assignments.filter(a => a.course_id === courses[2].id))
  await api.syllabus(request('?calendar=1&course_id=' + courses[2].id)); assert.deepEqual(bundleScopes.at(-1), [courses[2].id])
  await api.syllabus(request('?calendar=1&course_id=' + courses[0].id)); assert.deepEqual(bundleScopes.at(-1), [])
  global.__calendarFixture.readOnly = true; const view = await (await api.syllabus(request('?calendar=1'))).json(); assert.equal(view.readOnly, true); global.__calendarFixture.readOnly = false
  console.log('PASS: default Physics class, explicit class, non-Physics chooser and read-only teacher view are preserved')
  await api.syllabus(request()); assert.deepEqual(bundleScopes.at(-1), [courses[1].id, courses[2].id])
  global.__calendarFixture.staff = false; const student = await (await api.readings(request())).json(); assert(student.assignments.every(a => a.status === 'published')); assert(student.work.every(w => w.user_id === id(10))); assert(!('review_counts' in student)); global.__calendarFixture.staff = true
  global.__calendarFixture.courses = []; const empty = await (await api.readings(request('?calendar=1'))).json(); assert.deepEqual(empty.assignments, []); assert.deepEqual((await (await api.counts(request())).json()).review_counts, {})
  assert.equal(JSON.stringify(rows), original)
  console.log('PASS: general dashboard/student reads and empty accounts remain supported; every fictional work/grade/assignment record is byte-identical')
})().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => fs.rmSync(out, { recursive: true, force: true }))
