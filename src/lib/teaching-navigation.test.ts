import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assessmentScopeHref, assessmentView } from './assessment-center'
import { legacyWorkspaceHref, studentsHref, scopedTeachingHref, studentLessonHref, teachingHref, teachingNavActive } from './teaching-navigation'
const query = (href: string) => new URL(href, 'https://example.test').searchParams

test('Library opens its catalog even when a lesson was previously selected', () => {
  const href = scopedTeachingHref('/admin/dashboard', 'class=c1&unit=unit-2&lesson=old&view=mastery', 'c2')
  assert.equal(href.split('?')[0], '/admin/dashboard')
  assert.equal(query(href).get('class'), 'c1')
  assert.equal(query(href).get('unit'), 'unit-2')
  assert.equal(query(href).has('lesson'), false)
  assert.equal(query(href).has('view'), false)
})
test('Teaching navigation retains scope and clears unrelated lesson details', () => {
  const href = scopedTeachingHref('/admin/control-room?view=live', 'class=c1&unit=unit-2&lesson=old&student=s1&day=3&fromResults=1')
  assert.equal(query(href).get('view'), 'live')
  assert.equal(query(href).get('class'), 'c1')
  assert.equal(query(href).get('day'), '3')
  for (const name of ['lesson', 'student', 'fromResults']) assert.equal(query(href).has(name), false)
  assert.equal(query(scopedTeachingHref('/admin/control-room?view=live', 'unit=all')).get('unit'), 'auto')
  assert.equal(query(scopedTeachingHref('/admin/control-room?view=plan', 'class=', 'remembered')).get('class'), '')
})
test('exactly one Teaching section is active for nested and legacy routes', () => {
  for (const [path, search, expected] of [
    ['/admin/control-room', 'view=guide', 'plan'], ['/admin/teacher/plans', '', 'plan'],
    ['/admin/control-room', 'view=assignments', 'calendar'], ['/admin/lobby/session-1', '', 'live'],
    ['/admin/observe', '', 'live'], ['/admin/command-center', '', 'live'],
    ['/admin/student-preview', '', 'results'], ['/admin/control-room', 'view=mastery', 'results'],
    ['/admin/control-room', 'view=quizzes', 'results'],
  ]) {
    assert.deepEqual(['plan', 'calendar', 'live', 'results'].filter(view => teachingNavActive(path, search, '/admin/control-room?view=' + view)), [expected])
  }
  assert.equal(teachingNavActive('/admin/lessons/l1', '', '/admin/dashboard'), true)
})
test('new views and student lesson links have explicit context; changing scope clears the old day', () => {
  assert.equal(assessmentView('live'), 'live'); assert.equal(assessmentView('guide'), 'guide')
  assert.equal(query(teachingHref('guide', 'c1', 'trades-2', 5)).get('day'), '5')
  const preview = query(studentLessonHref('c1', 's1', 'l1', 'unit-2'))
  assert.equal(preview.get('class'), 'c1'); assert.equal(preview.get('student'), 's1'); assert.equal(preview.get('lesson'), 'l1')
  assert.equal(query(assessmentScopeHref('view=live&class=c1&unit=unit-1&day=3', 'unit', 'unit-2')).has('day'), false)
})

test('Teaching and Students retain the class without opening another student or lesson', () => {
  const href = scopedTeachingHref('/admin/students?view=roster', 'class=c1&unit=unit-2&lesson=old&student=s1&view=results')
  assert.equal(query(href).get('class'), 'c1')
  assert.equal(query(href).get('view'), 'roster')
  assert.equal(query(href).has('lesson'), false)
  assert.equal(query(href).has('student'), false)
  assert.equal(query(scopedTeachingHref('/admin/students?view=activity', '', 'remembered')).get('class'), 'remembered')
  assert.equal(query(scopedTeachingHref('/admin/students?view=activity', 'class=', 'remembered')).get('class'), '')
  assert.equal(query(studentsHref('rewards', 'c1', 'store')).get('section'), 'store')
})

test('moved tools highlight exactly one section in their new home', () => {
  for (const [view, expected] of [['access', 'plan'], ['tasks', 'plan'], ['pacing', 'calendar']]) {
    assert.deepEqual(['plan', 'calendar', 'live', 'results'].filter(section => teachingNavActive('/admin/control-room', 'view=' + view, '/admin/control-room?view=' + section)), [expected])
  }
  for (const view of ['roster', 'activity', 'rewards', 'settings']) {
    assert.deepEqual(['roster', 'activity', 'rewards', 'settings'].filter(section => teachingNavActive('/admin/students', 'view=' + view + '&section=store', '/admin/students?view=' + section)), [view])
  }
})

test('retired cockpit bookmarks and tool URLs redirect with their existing context', () => {
  for (const [route, search, expectedPath, expectedView] of [
    ['/admin/classes', '', '/admin/control-room', 'plan'],
    ['/admin/classes', 'tab=Roster+%26+analytics', '/admin/students', 'roster'],
    ['/admin/classes', 'tab=Engagement', '/admin/students', 'rewards'],
    ['/admin/classes', 'tab=Pacing', '/admin/control-room', 'pacing'],
    ['/admin/classes', 'tab=Plans', '/admin/control-room', 'guide'],
    ['/admin/home', '', '/admin/students', 'activity'],
    ['/admin/roster', '', '/admin/students', 'settings'],
    ['/admin/challenges', '', '/admin/students', 'rewards'],
    ['/admin/store', '', '/admin/students', 'rewards'],
    ['/admin/lesson-access', '', '/admin/control-room', 'access'],
    ['/admin/pacing', '', '/admin/control-room', 'pacing'],
    ['/admin/vocabulary/tasks', 'task_id=t1', '/admin/control-room', 'tasks'],
  ]) {
    const href = legacyWorkspaceHref(route, search + '&class=c1&unit=unit-2')
    assert.equal(href.split('?')[0], expectedPath)
    assert.equal(query(href).get('view'), expectedView)
    assert.equal(query(href).get('class'), 'c1')
    assert.equal(query(href).get('unit'), 'unit-2')
    assert.equal(query(href).has('tab'), false)
  }
  assert.equal(query(legacyWorkspaceHref('/admin/classes', 'class=stale', 'path-class')).get('class'), 'path-class')
  assert.equal(query(legacyWorkspaceHref('/admin/vocabulary/tasks', 'task_id=t1&course_id=c1')).get('task_id'), 't1')
  assert.equal(query(legacyWorkspaceHref('/admin/store', '')).get('section'), 'store')
  assert.equal(query(legacyWorkspaceHref('/admin/classes', '')).has('class'), false)
})

test('switching a class clears vocabulary details from the previous class', () => {
  const params = query(assessmentScopeHref('view=tasks&class=c1&task_id=t1&target_id=g1&set_id=s1', 'class', 'c2'))
  assert.equal(params.get('class'), 'c2')
  for (const key of ['task_id', 'target_id', 'set_id']) assert.equal(params.has(key), false)
})
