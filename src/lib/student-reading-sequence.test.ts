import assert from 'node:assert/strict'
import test from 'node:test'
import { studentReadingGroups } from './student-reading-sequence'
import type { SyllabusBundleView } from './reading-syllabus'
const resource={id:'',title:'',status:'draft' as const}
const bundle=(step_id:string,course_id='class',id='reading'): SyllabusBundleView=>({course_id,step_id,reading_id:id,practice_id:'',reading_quiz_id:'',vocabulary_quiz_id:'',created_at:'',reading:{id,title:'Assigned textbook section',status:'published'},practice:resource,readingQuiz:resource,vocabularyQuiz:resource})
test('published textbook bundles remain visible without staff-only textbook templates',()=>{
 const groups=studentReadingGroups([{id:'course-step',title:'Course title',focus:'Course focus'}],[bundle('textbook-hewitt-4-2'),bundle('course-step'),bundle('textbook-openstax-2-3'),bundle('hidden','class','')])
 assert.equal(groups.length,3);assert.equal(groups[0].position,1);assert.equal(groups[0].title,'Course title')
 assert.equal(groups[1].position,null);assert.equal(groups[1].title,'Assigned textbook section')
 assert.equal(groups[2].bundle.step_id,'textbook-openstax-2-3')
})
test('the same step assigned in separate enrolled classes is retained for both classes',()=>{
 assert.equal(studentReadingGroups([],[bundle('step','class-a'),bundle('step','class-b')]).length,2)
})
