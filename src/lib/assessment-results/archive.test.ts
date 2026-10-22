import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { filterResults, notStarted, retainArchivedEvidence } from './model'
import { composeChoiceResults } from './choice-composition'
import type { ResultActivity, ResultCell } from './types'

const students = [{ id: 'never', name: 'Never started' }, { id: 'done', name: 'Submitted' }]
const evidence: ResultCell = { state: 'reviewed', label: '8/10', needsReview: false, submissionId: 'saved-submission', masteryValue: 3, masteryCount: 1 }
const activity = (archived: boolean): ResultActivity => ({ key: 'interactive:a', sourceId: 'a', title: 'Activity', kind: 'interactive', unitIds: ['unit-1'], dueAt: archived ? null : '2026-10-22', archived, cells: { never: notStarted(), done: evidence } })

test('withdrawing removes active requirements while retaining grades and mastery evidence in the archive', () => {
  const source = activity(true), result = retainArchivedEvidence(source)
  assert.deepEqual(filterResults([result], students, {}).activities, [])
  const archived = filterResults([result], students, { archived: true }).activities[0]
  assert.equal(archived.cells.never, undefined)
  assert.equal(archived.cells.done, evidence)
  assert.equal(source.cells.never.state, 'not_started')
})

test('archive retains all attempted states and active assignment restores unattempted cells', () => {
  for (const state of ['draft', 'submitted', 'returned', 'reviewed', 'completed', 'excused'] as const) {
    const source = activity(true)
    source.cells.done = { ...evidence, state }
    assert.equal(retainArchivedEvidence(source).cells.done, source.cells.done)
  }
  const reassigned = retainArchivedEvidence(activity(false))
  assert.equal(filterResults([reassigned], students, {}).activities.length, 1)
  assert.equal(reassigned.cells.never.state, 'not_started')
  assert.equal(reassigned.cells.done, evidence)
})

test('choice evidence is composed before archival cleanup and required lab keeps exactly one zero', () => {
  const source = activity(true)
  source.cells.done = { state: 'submitted', label: 'Needs review', needsReview: true }
  const choice: ResultActivity = { ...activity(false), kind: 'choice', key: 'choice:menu:a', choiceSectionId: 'menu', sourceKeys: [source.key], cells: { done: { ...evidence }, never: { state: 'excused', label: 'EX', needsReview: false } } }
  const lab: ResultActivity = { ...activity(false), kind: 'choice', key: 'choice:menu:lab', sourceId: 'lab', choiceSectionId: 'menu', cells: { never: { state: 'not_started', label: 'Missing', needsReview: false } } }
  const missing: ResultActivity = { ...lab, key: 'choice:menu:missing', sourceId: '', cells: { never: { state: 'not_started', label: '0/10', needsReview: false } } }
  const results = composeChoiceResults([source, choice, lab, missing]).map(retainArchivedEvidence)
  assert.equal(results.length, 3)
  assert.equal(choice.cells.done.needsReview, true)
  assert.equal(choice.cells.never.label, 'EX')
  assert.equal(lab.cells.never.label, 'Missing')
  assert.equal(results.filter(a => a.cells.never?.label === '0/10').length, 1)
  assert.equal(retainArchivedEvidence({ ...missing, archived: true }).cells.never.label, '0/10')
})
