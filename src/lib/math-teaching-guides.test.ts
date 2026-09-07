import test from 'node:test'
import assert from 'node:assert/strict'
import { MATH_TEACHING_GUIDES } from './math-teaching-guides'
import { MINI_LESSONS, resolveMiniLessons, miniLessonForCode } from './math-spine-lessons'
const codes=['NS1','NS2','PR1','PR2','QE1','QE2','QE3','QE4','SM1','SM2','GV1','GV2','GV3']
test('all 13 skills have explicit models, explained steps, repair, hints and formative feedback',()=>{
 assert.deepEqual(Object.keys(MATH_TEACHING_GUIDES).sort(),codes.sort())
 for(const code of codes){const g=MATH_TEACHING_GUIDES[code]
  assert.ok(g.goal && g.idea && g.words.length && g.transfer)
  assert.equal(g.examples.length,2)
  for(const e of g.examples){assert.ok(e.prompt && e.check);assert.ok(e.steps.length>=2);for(const s of e.steps)assert.ok(s.action && s.why)}
  assert.equal(g.hints.length,3);assert.ok(g.misconception.wrong && g.misconception.repair)
  assert.equal(g.practice.choices.length,g.practice.feedback.length)
  assert.ok(g.practice.correctIndex>=0 && g.practice.correctIndex<g.practice.choices.length)
  assert.equal(MINI_LESSONS[code].length,3)
 }
})
test('malformed or empty overrides preserve help while valid teacher notes survive',()=>{
 for(const override of [null,[],{},[null],['wrong'],[{title:'',steps:[]}]])assert.deepEqual(resolveMiniLessons('NS1',override),MINI_LESSONS.NS1)
 const note={title:'Teacher method',steps:['Use a number line.']}
 assert.deepEqual(resolveMiniLessons('NS1',[note])?.[0],note)
 assert.deepEqual(resolveMiniLessons('NS1',[note])?.[1],MINI_LESSONS.NS1[1])
 assert.equal(miniLessonForCode('unknown'),null)
 assert.equal(miniLessonForCode('NS1',-1),MINI_LESSONS.NS1[0])
})
test('critical physics distinctions remain explicit in student-facing content',()=>{
 assert.match(JSON.stringify(MATH_TEACHING_GUIDES.GV1),/Signed area under velocity–time gives displacement/)
 assert.match(JSON.stringify(MATH_TEACHING_GUIDES.GV3),/measured from the positive x-axis/)
 assert.match(JSON.stringify(MATH_TEACHING_GUIDES.QE4),/least precise decimal place, not the fewest significant figures/)
 assert.match(JSON.stringify(MATH_TEACHING_GUIDES.SM1),/both x = 3 and x = −3/)
 assert.match(JSON.stringify(MATH_TEACHING_GUIDES.QE2),/matching units alone do not prove/)
})
test('independent arithmetic checks of the authored examples',()=>{
 assert.equal((8-2)/(4-1),2)
 assert.equal(3*2 + (-2)*2,2);assert.equal(Math.abs(3*2)+Math.abs(-2*2),10)
 assert.equal(36*(2/6)**2,4);assert.equal(72*1000/3600,20)
 assert.equal(2*4 + .5*3*4**2,32)
 assert.equal((2.4*3.12).toPrecision(2),'7.5');assert.equal((12.3+.46).toFixed(1),'12.8')
 assert.equal(Math.hypot(-2,6).toFixed(2),'6.32');assert.equal((Math.atan2(6,-2)*180/Math.PI).toFixed(1),'108.4')
})
