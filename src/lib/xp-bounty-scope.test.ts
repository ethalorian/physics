import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { isSameIdentity, ownerEmailsFor } from './identity-aliases'

test('account aliases never include unrelated teachers or blank identities', () => {
  assert.equal(isSameIdentity('craigantocci@gmail.com', 'antoccic@fitchburg.k12.ma.us'), true)
  assert.equal(isSameIdentity('another.teacher@example.com', 'antoccic@fitchburg.k12.ma.us'), false)
  assert.equal(isSameIdentity('', ''), false)
  assert.deepEqual(ownerEmailsFor(' Another.Teacher@example.com '), ['another.teacher@example.com'])
})

test('bounty roster includes linked-account classes and excludes another teacher’s students', async () => {
  const fixtures = {
    courses: [
      { id: 'school', name: 'School class', section: 'A', teacher_email: 'antoccic@fitchburg.k12.ma.us' },
      { id: 'personal', name: 'Personal class', section: 'B', teacher_email: 'craigantocci@gmail.com' },
      { id: 'other', name: 'Other class', section: 'C', teacher_email: 'another.teacher@example.com' },
    ],
    course_students: [
      { course_id: 'school', student_id: 's1', enrollment_state: 'ACTIVE' },
      { course_id: 'personal', student_id: 's2', enrollment_state: 'ACTIVE' },
      { course_id: 'other', student_id: 's3', enrollment_state: 'ACTIVE' },
      { course_id: 'school', student_id: 's4', enrollment_state: 'REMOVED' },
    ],
    students: ['s1', 's2', 's3', 's4'].map(id => ({ id, name: id, email: id + '@example.com' })),
  }
  const result = await build({
    entryPoints: ['src/lib/xp-bounty-data.ts'], bundle: true, platform: 'node', format: 'cjs', write: false,
    plugins: [{ name: 'roster-fixture', setup(builder) {
      builder.onResolve({ filter: /^@\/lib\/supabase$/ }, () => ({ path: 'supabase-fixture', namespace: 'fixture' }))
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: `
        const tables = ${JSON.stringify(fixtures)};
        export const supabaseAdmin = { from(name) {
          let rows = [...tables[name]];
          const query = {
            select() { return query; }, order() { return query; },
            eq(key, value) { rows = rows.filter(row => row[key] === value); return query; },
            in(key, values) { rows = rows.filter(row => values.includes(row[key])); return query; },
            range(from, to) { return Promise.resolve({ data: rows.slice(from, to + 1), error: null }); }
          };
          return query;
        } };
      ` }))
    } }],
  })
  type Roster = { courses: { id: string }[]; students: { id: string; courseIds: string[] }[] }
  const fixtureModule = { exports: {} as { bountyRoster: (email: string) => Promise<Roster> } }
  new Function('module', 'exports', result.outputFiles[0].text)(fixtureModule, fixtureModule.exports)
  const linked = await fixtureModule.exports.bountyRoster('craigantocci@gmail.com')
  assert.deepEqual(linked.courses.map(course => course.id).sort(), ['personal', 'school'])
  assert.deepEqual(linked.students.map(student => student.id).sort(), ['s1', 's2'])
  const unrelated = await fixtureModule.exports.bountyRoster('another.teacher@example.com')
  assert.deepEqual(unrelated.courses.map(course => course.id), ['other'])
  assert.deepEqual(unrelated.students.map(student => student.id), ['s3'])
  const empty = await fixtureModule.exports.bountyRoster('new.teacher@example.com')
  assert.deepEqual(empty.courses, [])
  assert.deepEqual(empty.students, [])
})
