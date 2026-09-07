import test from 'node:test'
import assert from 'node:assert/strict'
import { skillEvidence, pendingFreshCheck, isRevisionOutcome } from './math-student-view'
import { rungState, pickTargetRung } from './math-spine-picker'
import { buildRecordsByCompetency, strandSeries, strandValue } from '../components/math-spine/math-spine-display'
import type { MathCompetencyRecord } from '@/data/curriculum-types'
const record = (competencyId: string, level: 1|2|3, day: number): MathCompetencyRecord => ({studentId:'s', competencyId, level, observedAt:`2026-09-${String(day).padStart(2,'0')}T12:00:00Z`})
test('unassessed is distinct from a demonstrated difficulty without blocking practice',()=>{
 assert.equal(rungState([]),'unassessed');assert.equal(rungState([1]),'not-yet')
 assert.equal(skillEvidence([]).status,'Not assessed yet')
 assert.equal(pickTargetRung([{id:'a',sequence:1,levels:[],latestObservedAt:null}])?.id,'a')
})
test('one high observation remains initial evidence; support and scores are not invented',()=>{
 const e=skillEvidence([record('a',3,1)]);assert.equal(e.status,'Initial demonstration');assert.equal(e.value,3)
 assert.equal(e.ordered.length,1);assert.equal(skillEvidence([record('a',3,1),record('a',1,2)]).latest?.level,1)
})
test('strand history matches its score despite uneven assessment frequency',()=>{
 const rows=[record('a',3,1),record('b',1,2),record('b',1,3),record('b',1,4)]
 assert.equal(strandSeries(['a','b'],rows).at(-1),2)
 assert.equal(strandSeries(['a','b'],rows).at(-1),strandValue(['a','b'],buildRecordsByCompetency(rows)))
 assert.equal(strandSeries(['a','b'],rows,.4).at(-1),strandValue(['a','b'],buildRecordsByCompetency(rows),.4))
})
test('fresh checks use oldest unresolved request and clear after newer evidence',()=>{
 const f=[{competencyId:'b',acknowledgedAt:'2026-09-03'},{competencyId:'a',acknowledgedAt:'2026-09-02'}]
 assert.equal(pendingFreshCheck(f,['a','b'],new Map()),'a')
 assert.equal(pendingFreshCheck(f,['a','b'],new Map([['a','2026-09-04']])),'b')
 assert.equal(pendingFreshCheck(f,['a'],new Map([['a','2026-09-04']])),null)
 assert.equal(pendingFreshCheck([{competencyId:'a',acknowledgedAt:null}],['a'],new Map()),null)
})
test('only explicit non-rating revision outcomes are accepted',()=>{
 assert.ok(isRevisionOutcome('fresh-check'));assert.ok(isRevisionOutcome('help'));assert.ok(isRevisionOutcome('practice'))
 assert.equal(isRevisionOutcome('mastered'),false);assert.equal(isRevisionOutcome('toString'),false)
})
