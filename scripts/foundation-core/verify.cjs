const assert=require('node:assert/strict');require('tsx/cjs')
const {coreQuestions,foundationEdition}=require('../../src/lib/interactive-assignments/foundations/core-questions.ts')
const {ALL_ASSIGNMENTS}=require('../../src/lib/interactive-assignments/catalog.ts')
const {validateVelocityState,emptyVelocityState,missingVelocityAnswers}=require('../../src/lib/interactive-assignments/velocity.ts')
let total=0
for(const lesson of ALL_ASSIGNMENTS.filter(l=>l.foundation)){
 const short=foundationEdition(lesson),ids=short.questions.map(q=>q.id)
 assert.deepEqual(ids,coreQuestions[lesson.foundation]);assert(short.sections.every(s=>s.questions.length));assert(short.questions.some(q=>q.independent))
 const original=validateVelocityState(emptyVelocityState(),lesson.questions)
 assert.equal(foundationEdition(lesson,original),lesson)
 const work=emptyVelocityState();for(const q of short.questions)work.answers[q.id]=q.options?'0':'1'
 const saved=validateVelocityState(work,short.questions);assert.deepEqual(missingVelocityAnswers(saved,short.questions),[]);assert.deepEqual(foundationEdition(lesson,saved).questions,short.questions);total+=ids.length
}
assert.equal(total,46);console.log('9 foundations: all sections, exit tickets, 46 core questions, save/restore and legacy editions verified.')
