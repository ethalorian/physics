const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')

;(async () => {
  const root = path.resolve(__dirname, '..'), outfile = path.resolve(root, '../calendar-access-test.cjs')
  await require('esbuild').build({ stdin: { contents: `export { accessReading } from './src/lib/textbook-assignments-server'; export { accessQuiz } from './src/lib/quizzes/server'; export * as list from './src/app/api/interactive-assignments/route'; export * as detail from './src/app/api/interactive-assignments/[id]/route'; export { assignmentByDay } from './src/lib/interactive-assignments/catalog';`, resolveDir: root }, bundle: true, platform: 'node', format: 'cjs', outfile, plugins: [{ name: 'fixtures', setup(build) {
    const mocks = {
      'server-only': '',
      'next/server': `export const NextResponse={json:(data,init={})=>new Response(JSON.stringify(data),{...init,headers:{'Content-Type':'application/json',...init.headers}})}; export const after=()=>{};`,
      '@/lib/reading-quiz-access': 'export const lockedReadingQuizIds=async()=>new Set();',
      '@/lib/api-auth': 'export const withAuth=fn=>(req)=>fn(req,globalThis.actor);',
      '@/lib/supabase': 'export const supabaseAdmin={from:table=>globalThis.query(table),rpc:()=>{globalThis.rpcCalls++;throw Error("Unexpected student write")}};',
      '@/lib/interactive-assignments/grading-server': 'export const assignmentModel=()=>"test";export const processVelocitySubmission=async()=>{};',
    }
    build.onResolve({ filter: /.*/ }, a => a.path in mocks ? { path: a.path, namespace: 'fixture' } : undefined)
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: mocks[a.path], loader: 'js' }))
  } }] })
  const { list, detail, assignmentByDay, accessReading, accessQuiz } = require(outfile)
  const id = '10000000-0000-4000-8000-000000000001', course = '20000000-0000-4000-8000-000000000001', user = '30000000-0000-4000-8000-000000000001'
  const lesson = assignmentByDay(2), teacher = 'teacher@example.test'
  const tables = {
    textbook_assignments: [{ id, course_id: course, status: 'archived', due_at: '2026-10-16T20:00:00Z' }],
    quiz_assignments: [{ id, course_id: course, status: 'archived', due_at: '2026-10-16T20:00:00Z', deleted_at: null }],
    courses: [{ id: course, teacher_email: teacher, program: 'physics', archived_at: null, name: 'Fixture class' }],
    course_students: [{ course_id: course, student_id: user, enrollment_state: 'ACTIVE' }],
    interactive_assignments: [{ id, course_id: course, slug: lesson.slug, target_id: 'target-0', created_at: '2026-10-01T12:00:00Z', due_on: null }],
    learning_targets: lesson.targets.map((slug, i) => ({ id: 'target-' + i, slug, unit_id: lesson.unit, statement: slug })),
    interactive_assignment_work: [{ assignment_id: id, user_id: user, state: { saved: 'Keep this answer' }, version: 7, status: 'draft' }],
    interactive_assignment_submissions: [], interactive_assignment_reviews: [], interactive_assignment_ai_reviews: [],
  }
  let writes = []
  globalThis.rpcCalls = 0
  globalThis.query = table => {
    assert.ok(table in tables, 'Unexpected table ' + table)
    let filters = [], single = false, patch, insert
    const q = {
      select() { return q }, range() { return q }, order() { return q }, limit() { return q },
      eq(k, v) { filters.push(r => r[k] === v); return q },
      is(k, v) { filters.push(r => r[k] === v); return q },
      in(k, values) { filters.push(r => values.includes(r[k])); return q },
      ilike(k, v) { filters.push(r => r[k]?.toLowerCase() === v.toLowerCase()); return q },
      maybeSingle() { single = true; return q },
      update(value) { patch = value; return q },
      upsert(value) { insert = value; return q },
      then(resolve, reject) {
        try {
          if (insert && !tables[table].some(r => r.course_id === insert.course_id && r.slug === insert.slug)) {
            tables[table].push({ id: '40000000-0000-4000-8000-000000000001', ...insert }); writes.push({ table, insert })
          }
          const rows = tables[table].filter(r => filters.every(f => f(r)))
          if (patch) { rows.forEach(r => Object.assign(r, patch)); writes.push({ table, patch }) }
          return Promise.resolve({ data: single ? rows[0] ?? null : rows, error: null }).then(resolve, reject)
        } catch (e) { return Promise.reject(e).then(resolve, reject) }
      },
    }
    return q
  }
  const actor = role => { globalThis.actor = { role, realRole: role, userId: user, email: teacher, scopeEmail: teacher, viewingAsTeacher: false, params: Promise.resolve({ id }) } }
  const request = (body, query = '') => new Request('http://fixture/api/interactive-assignments' + (query || '?slug=' + lesson.slug), body ? { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : undefined)
  const evidence = JSON.stringify(tables.interactive_assignment_work)
  actor('student')
  assert.equal(await accessReading(id, globalThis.actor), null, 'unassigned readings cannot reopen by URL')
  assert.equal(await accessQuiz(id, globalThis.actor), null, 'unassigned quizzes cannot reopen by URL')
  actor('teacher')
  assert.ok(await accessReading(id, globalThis.actor), 'teacher retains archived reading evidence access')
  assert.ok(await accessQuiz(id, globalThis.actor), 'teacher retains archived quiz evidence access')
  actor('student')
  assert.deepEqual((await (await list.GET(request())).json()).assignments, [], 'undated records must not appear as assignments')
  assert.equal((await detail.GET(request())).status, 404, 'unassigned deep links are denied')
  assert.equal((await detail.POST(request({ version: 7, state: {} }))).status, 404, 'unassigned saves are denied')
  assert.equal((await detail.POST(request({ version: 7, state: {}, submitId: id }))).status, 404, 'unassigned submissions are denied')
  assert.equal(globalThis.rpcCalls, 0)
  assert.equal((await list.POST(request({ course_id: course, slug: lesson.slug, due_on: '2026-10-25' }))).status, 403)
  actor('teacher')
  assert.equal((await (await list.GET(request())).json()).assignments[0].id, id, 'teacher evidence remains accessible')
  assert.equal((await list.POST(request({ course_id: course, slug: lesson.slug, due_on: null }))).status, 422, 'assigning requires a calendar date')
  assert.equal((await list.POST(request({ action: 'calendar', course_id: course, slug: lesson.slug, due_on: '2026-02-30' }))).status, 422)
  const scheduled = await (await list.POST(request({ action: 'calendar', course_id: course, slug: lesson.slug, due_on: '2026-10-25' }))).json()
  assert.equal(scheduled.assignment.id, id, 'reassigning retains identity')
  actor('student')
  assert.equal((await (await list.GET(request())).json()).assignments.length, 1)
  assert.equal((await detail.GET(request())).status, 200)
  tables.course_students[0].enrollment_state = 'INACTIVE'
  assert.equal((await detail.GET(request())).status, 404, 'calendar date never bypasses enrollment')
  tables.course_students[0].enrollment_state = 'ACTIVE'
  actor('teacher')
  await list.POST(request({ action: 'calendar', course_id: course, slug: lesson.slug, due_on: null }))
  actor('student')
  const cleared = await (await list.GET(request())).json()
  assert.deepEqual(cleared.assignments, [])
  assert.deepEqual(cleared.work, [], 'unassigned answers are not exposed in student lists')
  assert.equal((await detail.GET(request())).status, 404)
  assert.equal(JSON.stringify(tables.interactive_assignment_work), evidence, 'unassigning and reassigning preserve student evidence')
  assert.ok(writes.every(w => w.table === 'interactive_assignments' && !w.insert && Object.keys(w.patch).join() === 'due_on'))
  actor('teacher'); globalThis.actor.viewingAsTeacher = true
  assert.equal((await list.POST(request({ action: 'calendar', course_id: course, slug: lesson.slug, due_on: '2026-10-25' }))).status, 403)
  console.log('PASS: unassigned list/read/save/submit gates; dated reassignments retain identity and work; calendar removal unassigns; enrollment and teacher preview guards.')
})().catch(error => { console.error(error); process.exitCode = 1 })
