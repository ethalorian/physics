import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ALL_ASSIGNMENTS, isLabAssignment } from './interactive-assignments/catalog'
import { TRANSFER_ASSIGNMENTS } from './interactive-assignments/transfer-task'
import { unitFloor, postedFloorAverage, calendarXpBadges, type MasteryXpReport } from './assigned-mastery-xp'
test('four out of five meets the floor; never round down or post an empty unit',()=>{
  assert.deepEqual(unitFloor(3,5), {needed:4,remaining:1,met:false})
  assert.equal(unitFloor(4,5).met,true);assert.equal(unitFloor(4,6).met,false)
  assert.equal(unitFloor(0,0).met,false);assert.equal(unitFloor(1,1).met,true)
})
test('only posted nonempty units affect the term grade; a posted zero really is zero',()=>{
  const report={items:[],posted:[{unitId:'u1',termId:'one',assigned:5,completed:4},{unitId:'u2',termId:'two',assigned:3,completed:2}]}
  assert.equal(postedFloorAverage(report,'one'),100);assert.equal(postedFloorAverage(report,'two'),0)
  assert.equal(postedFloorAverage(report,'all'),50);assert.equal(postedFloorAverage(report,'three'),null)
})
test('SQL catalog matches the authored mastery-only interactives; labs and both transfer formats stay out before any score exists',()=>{
  const file=readFileSync('supabase/migrations/20261103173743_assigned_mastery_xp.sql','utf8')
  const slugs=[...file.matchAll(/^\('([^']+)','unit-\d+',/gm)].map(m=>m[1]).sort()
  const transfers=new Set(TRANSFER_ASSIGNMENTS.map(a=>a.slug))
  const eligible=ALL_ASSIGNMENTS.filter(a=>a.targets.length&&!isLabAssignment(a)&&!a.transferBrief&&!transfers.has(a.slug)).map(a=>a.slug).sort()
  assert.deepEqual(slugs,eligible)
})

test('calendar badges use only eligible work in enabled classes, and a receipt survives revision', () => {
  const report = (enabled: boolean, key: string, submitted: boolean, credited: boolean): MasteryXpReport => ({
    enabled, posted: [], items: [{ key, title: 'Same title', href: '/activity', unitId: 'unit-1', submitted, credited }],
  })
  assert.deepEqual(calendarXpBadges([
    report(true, 'reading:one', false, false), report(true, 'lesson:two', true, false),
    report(true, 'interactive:three', false, true), report(false, 'reading:off', true, true), null,
  ]), { 'reading:one': 'available', 'lesson:two': 'pending', 'interactive:three': 'earned' })
})
