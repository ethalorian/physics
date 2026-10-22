import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assignmentExempt, canRemoveChoice, optionProgress, sectionProgress, suggestMasteryGroups, validateSection, type ChoiceOption, type ChoiceSection, type ChoiceSelection } from './choice-calendar'
const option = (id: string, lab = false) => ({ id, title: id, category: lab ? 'lab' : 'independent', lab, targetIds: [], steps: [{ id, kind: 'reading' as const, sourceId: id, title: id, href: '/readings/' + id, followUp: false }, { id: id + '-quiz', kind: 'quiz' as const, sourceId: id + '-quiz', title: 'Quiz', href: '/quizzes/' + id, followUp: true }] })
const section: ChoiceSection = { id: 's', course_id: 'c', title: 'Motion', opens_at: '2026-11-02T12:00:00Z', due_at: '2026-11-06T22:00:00Z', required_count: 3, category_minimums: { lab: 1 }, points_per_choice: 10, options: [option('a'), option('b'), option('c'), option('d', true), option('e')], published: true, version: 1 }
const select = (id: string): ChoiceSelection => ({ section_id: 's', option_id: id, user_id: 'student', planned_on: '2026-11-03', selected: true, lab_completed_at: id === 'd' ? '2026-11-03T14:00:00Z' : null, swap_requested: false })
const submitted = { attempted: true, submitted: true, earned: null, possible: null }
const before = Date.parse('2026-11-03T15:00:00Z'), after = Date.parse('2026-11-07T15:00:00Z')
test('submitted activities complete choices independently of their attached quizzes', () => {
  const progress = sectionProgress(section, ['a', 'b', 'd'].map(select), { 'reading:a': submitted, 'reading:b': submitted, 'reading:d': submitted }, before)
  assert.equal(progress.complete, true); assert.equal(progress.completed, 3); assert.equal(progress.pendingQuizzes, 3)
  assert.equal(progress.options.find(o => o.option.id === 'c')?.grade, 'EX')
  assert.equal(progress.missingEntries.length, 0)
})
test('lab reservation alone does not complete a choice', () => {
  assert.equal(optionProgress(option('d', true), { ...select('d'), lab_completed_at: null }, { 'reading:d': submitted }, false).completed, false)
})
test('missing category and missing count do not double-charge the same obligation', () => {
  const progress = sectionProgress(section, ['a', 'b'].map(select), { 'reading:a': submitted, 'reading:b': submitted }, after)
  assert.equal(progress.missing, 1); assert.equal(progress.missingEntries.length, 1)
  assert.deepEqual(progress.missingEntries[0], { id: 's:missing:1', title: 'Missing required choice 1', earned: 0, possible: 10, reason: '1 lab' })
})
test('three independent activities do not satisfy the lab requirement', () => {
  const p = sectionProgress(section, ['a', 'b', 'c'].map(select), { 'reading:a': submitted, 'reading:b': submitted, 'reading:c': submitted }, after)
  assert.equal(p.complete, false); assert.equal(p.missingEntries.length, 1)
  assert.equal(p.options.find(o => o.option.id === 'd')?.grade, 'missing')
  assert.equal(p.options.find(o => o.option.id === 'd')?.requiredRemaining, 1)
  assert.equal(p.options.find(o => o.option.id === 'e')?.grade, 'EX')
  assert.deepEqual(p.missingEntries.map(e => e.earned), [0])
})
test('a skipped lab and a missing third choice share one zero', () => {
  const p = sectionProgress(section, ['a', 'b'].map(select), { 'reading:a': submitted, 'reading:b': submitted }, after)
  assert.equal(p.options.find(o => o.option.id === 'd')?.grade, 'missing')
  assert.equal(p.complete, false)
  assert.equal(p.missingEntries.length, 1)
  assert.equal(p.missingEntries[0].possible, 10)
})
test('booking a lab or awarding partial credit does not waive its requirement', () => {
  const p = sectionProgress(section, ['a', 'b', 'c'].map(select).concat({ ...select('d'), lab_completed_at: null }), { 'reading:a': submitted, 'reading:b': submitted, 'reading:c': submitted, 'reading:d': { ...submitted, submitted: false, earned: 4, possible: 10 } }, after)
  const lab = p.options.find(o => o.option.id === 'd')!
  assert.equal(lab.grade, 'missing'); assert.equal(lab.attempted, true)
  assert.equal(lab.completed, false); assert.equal(p.missingEntries.length, 1)
})
test('an unmet lab is not overdue before the deadline and clears on late completion', () => {
  const selections = ['a', 'b', 'c'].map(select), evidence = { 'reading:a': submitted, 'reading:b': submitted, 'reading:c': submitted }
  const early = sectionProgress(section, selections, evidence, before)
  assert.equal(early.options.find(o => o.option.id === 'd')?.grade, 'available')
  assert.equal(early.complete, false); assert.equal(early.missingEntries.length, 0)
  const late = sectionProgress(section, [...selections, select('d')], { ...evidence, 'reading:d': submitted }, after)
  assert.equal(late.complete, true); assert.equal(late.missingEntries.length, 0)
  assert.equal(late.options.find(o => o.option.id === 'd')?.grade, 'submitted')
})
test('lab alternatives share the category requirement and do not multiply zeros', () => {
  const menu = { ...section, options: [...section.options, option('f', true)] }
  const selections = ['a', 'b', 'c'].map(select), evidence = { 'reading:a': submitted, 'reading:b': submitted, 'reading:c': submitted }
  const missing = sectionProgress(menu, selections, evidence, after)
  assert.equal(missing.options.filter(o => o.grade === 'missing').length, 2)
  assert.equal(missing.missingEntries.length, 1)
  const done = sectionProgress(menu, [...selections, select('d')], { ...evidence, 'reading:d': submitted }, after)
  assert.equal(done.options.find(o => o.option.id === 'f')?.grade, 'EX')
  assert.equal(done.complete, true); assert.equal(done.missingEntries.length, 0)
})
test('late completion clears the derived missing zero and extras remain graded', () => {
  const p = sectionProgress(section, ['a', 'b', 'c', 'd'].map(select), Object.fromEntries(['a', 'b', 'c', 'd'].map(id => ['reading:' + id, submitted])), after)
  assert.equal(p.completed, 4); assert.equal(p.complete, true); assert.equal(p.missingEntries.length, 0)
  assert.equal(p.options.filter(o => o.grade === 'submitted').length, 4)
})
test('attempts survive an approved removal and never become EX', () => {
  const selection = { ...select('a'), selected: false }
  const evidence = { 'reading:a': { ...submitted, submitted: false } }
  assert.equal(optionProgress(option('a'), selection, evidence, true).grade, 'working')
  assert.equal(canRemoveChoice(option('a'), selection, evidence), false)
  assert.equal(canRemoveChoice(option('a'), selection, evidence, true), true)
})
test('choice EX never erases a direct requirement, another selection, or attempted work', () => {
  const base = { directRequired: false, chosenInAnySection: false, attempted: false, choiceExempt: true }
  assert.equal(assignmentExempt(base), true)
  for (const key of ['directRequired', 'chosenInAnySection', 'attempted']) assert.equal(assignmentExempt({ ...base, [key]: true }), false)
})
test('invalid category totals and duplicate source assignments cannot publish', () => {
  assert.equal(validateSection(section), null)
  assert.match(validateSection({ ...section, category_minimums: { lab: 2 } })!, /Category requirements/)
  assert.match(validateSection({ ...section, options: [option('a'), { ...option('a'), id: 'other' }] })!, /required count/)
  assert.match(validateSection({ ...section, required_count: 1, category_minimums: {}, options: [option('a'), { ...option('a'), id: 'other' }] })!, /only one choice/)
})
test('group suggestions cap groups at four and keep missing evidence separate', () => {
  const candidates = Array.from({ length: 9 }, (_, i) => ({ id: String(i), name: 'Student ' + i, mastery: i === 8 ? null : 1 + i / 4 }))
  for (const strategy of ['similar', 'mixed'] as const) {
    const p = suggestMasteryGroups(candidates, strategy)
    assert.equal(p.groups.length, 2); assert.equal(p.unscored.length, 1)
    assert.equal(new Set(p.groups.flatMap(g => g.members.map(m => m.id))).size, 8)
    assert(p.groups.every(g => g.members.length <= 4))
  }
  const similar = suggestMasteryGroups(candidates, 'similar'), mixed = suggestMasteryGroups(candidates, 'mixed')
  assert(Math.abs(mixed.groups[0].mean - mixed.groups[1].mean) < Math.abs(similar.groups[0].mean - similar.groups[1].mean))
})
test('five scored students form groups of three and two, not four and one', () => {
  const p = suggestMasteryGroups(Array.from({ length: 5 }, (_, i) => ({ id: String(i), name: String(i), mastery: 2 })), 'similar')
  assert.deepEqual(p.groups.map(g => g.members.length), [3, 2])
  assert.deepEqual(suggestMasteryGroups([], 'mixed'), { groups: [], unscored: [] })
  assert.throws(() => suggestMasteryGroups([], 'similar', 5), /at most four/)
})

test('a lab artifact and teacher-observed session are both required; no automatic mastery', () => {
  const option: ChoiceOption = {id:'problem-lab',title:'Problem lab',category:'Lab',lab:true,labType:'problem-solving',problem:'Plan a safe stop.',artifactInstructions:'Your worked solution.',targetIds:[],steps:[]}
  const selected: ChoiceSelection = {section_id:'s',option_id:option.id,user_id:'u',selected:true,planned_on:null,lab_completed_at:null,swap_requested:false}
  assert(!optionProgress(option,selected,{},false).completed)
  assert(!optionProgress(option,{...selected,lab_completed_at:new Date().toISOString()},{},false).completed)
  assert(!optionProgress(option,{...selected,artifact_version:1,artifact_submitted_at:new Date().toISOString()},{},false).completed)
  const both: ChoiceSelection={...selected,artifact_version:2,artifact_submitted_at:new Date().toISOString(),lab_completed_at:new Date().toISOString()}
  assert(optionProgress(option,both,{},false).completed)
  assert.equal(both.artifact_ratings,undefined)
  assert(!canRemoveChoice(option,{...selected,artifact_version:1},{},false))
})
