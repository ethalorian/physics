import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assessmentView, assessmentCenterHref, assessmentScopeHref } from './assessment-center'
const query = (href: string) => new URL(href, 'https://example.test').searchParams

test('gradebook is the landing view and lesson inbox has a distinct route', () => {
  assert.equal(assessmentView(null), 'mastery')
  assert.equal(assessmentView('legacy'), 'mastery')
  assert.equal(assessmentView('lessons'), 'lessons')
})
test('moving between tools retains scope and filters but cannot open the previous assessment detail', () => {
  const p = query(assessmentCenterHref('quizzes', null, 'class-a', 'unit=unit-2&lesson=motion&q=Sam&id=reading-1&student=s1&lesson_id=l1&block_id=b1&generate=1&quizTab=gradebook'))
  assert.equal(p.get('class'), 'class-a'); assert.equal(p.get('unit'), 'unit-2')
  assert.equal(p.get('q'), 'Sam'); assert.equal(p.get('lesson'), 'motion'); assert.equal(p.get('quizTab'), 'gradebook')
  for (const key of ['id', 'student', 'lesson_id', 'block_id', 'generate']) assert.equal(p.has(key), false)
})
test('all classes is explicit so a stored class cannot silently replace it', () => {
  const p = query(assessmentCenterHref('readings', null, null, 'class=old&unit=unit-1'))
  assert.equal(p.has('class'), true); assert.equal(p.get('class'), '')
})
test('changing class clears hidden filters and details and resolves that class’s unit', () => {
  const p = query(assessmentScopeHref('view=quizzes&class=old&unit=unit-4&id=q1&q=Sam&lesson=l1&target=t1&teacher=t&inbox=returned&older=1&source=exit_ticket', 'class', 'new'))
  assert.equal(p.get('class'), 'new'); assert.equal(p.get('unit'), 'auto'); assert.equal(p.get('view'), 'quizzes'); assert.equal(p.get('teacher'), 't')
  for (const key of ['id', 'q', 'lesson', 'target', 'inbox', 'older', 'source']) assert.equal(p.has(key), false)
})
test('changing unit keeps the student search and class but drops stale lesson selections', () => {
  const p = query(assessmentScopeHref('view=mastery&class=c&q=Sam&lesson=l1&target=t1&id=q1&submission=sub1', 'unit', 'unit-2'))
  assert.equal(p.get('unit'), 'unit-2'); assert.equal(p.get('class'), 'c'); assert.equal(p.get('q'), 'Sam')
  for (const key of ['id', 'lesson', 'target', 'submission']) assert.equal(p.has(key), false)
})
