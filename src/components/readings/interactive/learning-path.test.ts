import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import type { SyllabusBundleView } from '@/lib/reading-syllabus'
import { learningPathItems } from './learning-path'

const bundle: SyllabusBundleView = {
  course_id:'class', step_id:'forces', reading_id:'reading', practice_id:'practice', reading_quiz_id:'', vocabulary_quiz_id:'', created_at:'',
  reading:{id:'reading',title:'Forces',status:'published'}, practice:{id:'practice',title:'Words',status:'published'},
  readingQuiz:{id:'',title:'Complete reading',status:'locked'}, vocabularyQuiz:{id:'',title:'Not assigned yet',status:'draft'},
}
test('the learning path preserves server gating and hides unpublished quiz links',()=>{
 const items=learningPathItems(bundle,'in_progress',{id:null,locked:true})
 assert.equal(items[1].href,'/vocabulary/work?task_id=practice')
 assert.equal(items[2].href,undefined); assert.equal(items[2].status,'Submit the reading to unlock')
 assert.equal(items[3].href,undefined); assert.equal(items[3].status,'Not assigned yet')
 // Reading completion alone cannot manufacture a quiz ID or unlock access.
 assert.equal(learningPathItems(bundle,'submitted',null)[2].href,undefined)
})
test('the submit response unlocks the quiz even while the initial course list is stale',()=>{
 const items=learningPathItems(bundle,'submitted',{id:'quiz-1',locked:false,state:'not_started',needsCompletion:true})
 assert.equal(items[0].status,'Submitted for review');assert.equal(items[2].href,'/quizzes/quiz-1');assert.equal(items[2].status,'Needs completion')
 const returned=learningPathItems(bundle,'returned',{id:'quiz-1',locked:false,state:'submitted'})
 assert.equal(returned[0].status,'Revise & resubmit');assert.equal(returned[2].status,'Submitted');assert.equal(returned[2].href,'/quizzes/quiz-1')
})
test('reviewed reading and graded quizzes are distinguished from assigned practice',()=>{
 const items=learningPathItems({...bundle,vocabularyQuiz:{id:'vocab-1',title:'Vocabulary',status:'published',state:'graded'}},'rated',{id:'quiz-1',locked:false,state:'graded'})
 assert.equal(items[0].status,'Mastery review recorded');assert.equal(items[1].status,'Assigned');assert.equal(items[2].status,'Reviewed');assert.equal(items[3].status,'Reviewed')
})

test('returned reading and vocabulary quizzes ask for revision without hiding their links',()=>{
 const items=learningPathItems({...bundle,vocabularyQuiz:{id:'vocab',title:'Vocabulary',status:'published',state:'returned'}},'rated',{id:'quiz',locked:false,state:'returned'})
 assert.equal(items[2].status,'Revise & resubmit');assert.equal(items[2].href,'/quizzes/quiz')
 assert.equal(items[3].status,'Revise & resubmit');assert.equal(items[3].href,'/quizzes/vocab')
})
