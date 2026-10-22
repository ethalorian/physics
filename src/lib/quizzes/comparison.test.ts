import {test} from 'node:test'
import assert from 'node:assert/strict'
import {assessmentContent,assessmentResults} from './comparison'
import type {Quiz,QuizReview} from './types'
const quiz:Quiz={id:'a',title:'Motion',course_id:'c1',status:'published',version:1,questions:[{id:'q1',kind:'choice',prompt:'Which?',options:['A','B'],correct_index:0,points:2,target_id:'t',guide:'Guide'},{id:'q2',kind:'written',prompt:'Explain',points:4,target_id:'t',guide:'Guide'}],instructions:'Explain your thinking',kind:'mixed',grade_mode:'numeric',student_ids:null,source_quiz_id:null,created_at:'2026-01-01',due_at:null}
const copy={...quiz,id:'b',course_id:'c2',title:'Another class',questions:quiz.questions.map(q=>({...q,id:q.id+'b'}))}
test('matching content groups across question IDs, titles, and classes; edited assessment stays separate',()=>{assert.equal(assessmentContent(quiz),assessmentContent(copy));for(const changed of [{...quiz,instructions:'Use notes'},{...quiz,questions:quiz.questions.map(q=>({...q,guide:'Different criteria'}))},{...quiz,questions:quiz.questions.map(q=>({...q,points:3}))}])assert.notEqual(assessmentContent(quiz),assessmentContent(changed))})
test('comparisons exclude pending and missing work, use partial credit, and keep target ratings separate',()=>{
 const review={id:'r1',submission_id:'s1',decision:'graded',scores:{q2:2},ratings:{t:3},reviewed_at:'2026-01-02',note:'',question_notes:{},earned:4,possible:6,grade_mode:'numeric',grade_value:null} satisfies QuizReview
 const result=assessmentResults({quizzes:[quiz,copy],courses:[{id:'c1',name:'Physics',section:'A',program:'physics'},{id:'c2',name:'Physics',section:'B',program:'physics'}],enrollments:[{course_id:'c1',student_id:'u1',name:'Alex'},{course_id:'c1',student_id:'u2',name:'Jordan'},{course_id:'c2',student_id:'u3',name:'Casey'}],work:[{quiz_id:'a',user_id:'u1',state:'graded',answers:{},version:2,submission_id:'s1'},{quiz_id:'b',user_id:'u3',state:'submitted',answers:{},version:1,submission_id:'s3'}],submissions:[{id:'s1',quiz_id:'a',user_id:'u1',answers:{q1:'0',q2:'Partial answer'},snapshot:quiz,submitted_at:'2026-01-01'}],reviews:[review]})[0]
 assert.equal(result.students.length,3);assert.equal(result.classes[0].graded,1);assert.equal(result.classes[0].mean,100*4/6);assert.equal(result.classes[1].mean,null);assert.deepEqual(result.classes[0].targets[0].levels,[0,0,1]);assert.equal(result.classes[0].questions[1].meanPercent,50)
})
test('the latest assigned copy replaces the earlier score and drafts never enter denominators',()=>{
 const newer={...quiz,id:'new',created_at:'2026-02-01'},draft={...quiz,id:'draft',status:'draft' as const,created_at:'2026-03-01'}
 const result=assessmentResults({quizzes:[quiz,newer,draft],courses:[{id:'c1',name:'Physics',section:'A',program:'physics'}],enrollments:[{course_id:'c1',student_id:'u1',name:'Alex'}],work:[],submissions:[],reviews:[]})[0]
 assert.equal(result.students.length,1);assert.equal(result.students[0].quiz_id,'new');assert.equal(result.classes[0].graded,0);assert.equal(result.classes[0].assigned,1)
})
test('choice EX and available quizzes leave assigned counts; attempted quizzes always stay in the gradebook',()=>{
 const result=assessmentResults({quizzes:[quiz],courses:[{id:'c1',name:'Physics',section:'A',program:'physics'}],enrollments:['ex','available','working','required'].map(id=>({course_id:'c1',student_id:id,name:id})),work:[{quiz_id:'a',user_id:'working',state:'in_progress',answers:{q1:'0'},version:1,submission_id:null}],submissions:[],reviews:[],choiceExemptions:{a:['ex','working']},choiceAvailable:{a:['available']}})[0]
 assert.equal(result.classes[0].assigned,2)
 assert.equal(result.students.find(s=>s.student_id==='ex')?.choiceExempt,true)
 assert.equal(result.students.find(s=>s.student_id==='available')?.choiceAvailable,true)
 assert.equal(result.students.find(s=>s.student_id==='working')?.choiceExempt,false)
 assert.equal(result.students.find(s=>s.student_id==='required')?.choiceExempt,false)
 assert(result.students.every(s=>s.percent===null))
})
