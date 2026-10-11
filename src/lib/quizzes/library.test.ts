import test from 'node:test'
import assert from 'node:assert/strict'
import {quizLibrary} from './library'
import type {QuizCard,QuizCourse} from './types'
const courses:QuizCourse[]=[{id:'cpa',name:'CPA Physics',section:'F',program:'physics'},{id:'honors',name:'Honors Physics',section:'A',program:'physics'},{id:'engineering',name:'Engineering',section:'E',program:'trades'}]
const quizzes=courses.map(c=>({id:c.id,course_id:c.id,title:'Position & displacement',kind:'mixed',status:'published',questions:[],question_count:3,possible:10})) as unknown as QuizCard[]
test('Honors selection keeps CPA quiz available for reuse',()=>{const library=quizLibrary(quizzes,courses,'honors');assert.deepEqual(library.assignments.map(q=>q.id),['honors']);assert.deepEqual(library.reusable.map(q=>q.id),['cpa'])})
test('CPA selection keeps Honors quiz available for reuse',()=>{assert.deepEqual(quizLibrary(quizzes,courses,'cpa').reusable.map(q=>q.id),['honors'])})
test('a section with no assignments can still find saved quizzes',()=>{const library=quizLibrary([quizzes[0]],courses,'honors');assert.equal(library.assignments.length,0);assert.equal(library.reusable[0].id,'cpa')})
test('unknown selection does not expose another program as reusable',()=>{assert.equal(quizLibrary(quizzes,courses,'missing').reusable.length,0)})
test('all-sections view retains every authorized saved quiz',()=>{assert.deepEqual(quizLibrary(quizzes,courses,'').assignments,quizzes)})
