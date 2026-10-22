import {test} from 'node:test'
import assert from 'node:assert/strict'
import {assessmentResults,type AssessmentComparison} from './comparison'
import {defaultQuizFilters,filterQuizzes,matchedGrowth,questionSignals,quizCsv,resultGrade} from './insights'
import type {Quiz,QuizCard,QuizReview} from './types'
const quiz:Quiz={id:'a',course_id:'c',title:'Motion',kind:'mixed',instructions:'Explain',grade_mode:'numeric',questions:[{id:'q',kind:'written',prompt:'Explain motion',points:4,target_id:'t'},{id:'r',kind:'written',prompt:'Compare',points:6,target_id:'t'}],due_at:null,status:'published',version:1,student_ids:null,source_quiz_id:null,created_at:'2026-10-01'}
const course={id:'c',name:'Physics',section:'A',program:'physics'}
const row=(id:string,level:1|2|3|null,at='2026-10-01',course_id='c')=>({course_id,student_id:id,name:id,quiz_id:'a',state:'graded',choiceExempt:false,choiceAvailable:false,earned:5,possible:10,percent:50,questionScores:[2,3],ratings:{t:level},gradeMode:'numeric' as const,gradeValue:null,submittedAt:at})
const assessment=(students:AssessmentComparison['students']):AssessmentComparison=>({id:'a',title:'Motion',created_at:'2026-10-01',due_at:null,question_count:2,possible:10,copies:[{id:'a',course_id:'c',status:'published'}],classes:[],students,questions:quiz.questions})
test('gradebook preserves earlier assignments while comparison view uses the latest copy',()=>{
 const copy={...quiz,id:'b',created_at:'2026-10-02'},review:QuizReview={id:'rev',submission_id:'s',decision:'graded',scores:{q:2,r:3},ratings:{t:2},note:'',question_notes:{},earned:5,possible:10,grade_mode:'numeric',grade_value:null,reviewed_at:'2026-10-01'}
 const input={quizzes:[quiz,copy],courses:[course],enrollments:[{course_id:'c',student_id:'u',name:'Student'}],work:[{quiz_id:'a',user_id:'u',state:'graded' as const,answers:{},version:1,submission_id:'s'}],submissions:[{id:'s',quiz_id:'a',user_id:'u',answers:{},snapshot:quiz,submitted_at:'2026-10-01'}],reviews:[review]}
 assert.equal(assessmentResults(input)[0].students[0].percent,null)
 const individual=assessmentResults({...input,groupCopies:false});assert.equal(individual.length,2);assert.equal(individual.find(a=>a.id==='a')!.students[0].percent,50);assert.equal(individual.find(a=>a.id==='b')!.students[0].percent,null)
})
test('matched growth excludes missing ratings, pending work, other sections and reversed dates',()=>{
 const before=assessment([row('up',1),row('same',3),row('down',3),row('missing',null),row('pending',1),row('later',1,'2026-10-04'),row('other',1,'2026-10-01','other')])
 const after=assessment([row('up',3,'2026-10-03'),row('same',3,'2026-10-03'),row('down',2,'2026-10-03'),row('missing',3,'2026-10-03'),{...row('pending',3,'2026-10-03'),state:'submitted'},row('later',3,'2026-10-03'),row('other',3,'2026-10-03')])
 const g=matchedGrowth(before,after,'c')[0];assert.equal(g.count,3);assert.equal(g.improved,1);assert.equal(g.stable,1);assert.equal(g.declined,1);assert.equal(g.beforeSecure,2);assert.equal(g.afterSecure,2);assert.equal(g.secureGain,0)
 assert.equal(matchedGrowth(before,assessment([]))[0].secureGain,null)
})
test('growth reports percentage points among matched students only and needs shared targets',()=>{
 const before=assessment([row('u',1),row('v',2)]),after=assessment([row('u',3,'2026-10-03'),row('v',2,'2026-10-03'),row('new',3,'2026-10-03')]);assert.equal(matchedGrowth(before,after)[0].secureGain,50)
 assert.deepEqual(matchedGrowth(before,{...after,questions:[{...after.questions[0],target_id:'different'}]}),[])
})
test('question signals handle small samples, no variation, incomplete scoring and negative item-rest correlation',()=>{
 const rows=Array.from({length:10},(_,i)=>({...row(String(i),2),questionScores:[i<5?0:4,i<5?6:0]}))
 assert.equal(questionSignals(assessment(rows))[0].itemRest,-1)
 assert.equal(questionSignals(assessment(rows.slice(0,9)))[0].itemRest,null)
 assert.equal(questionSignals(assessment(rows.map(r=>({...r,questionScores:[4,6]}))))[0].itemRest,null)
 const signals=questionSignals(assessment([...rows,{...row('pending',null),questionScores:[null,null],percent:null}]))
 assert.equal(signals[0].count,10);assert.equal(signals[0].mean,50)
})
test('active filter hides archive, review filter includes archived pending work, filters intersect and null dates sort last',()=>{
 const cards=[{...quiz,question_count:2,possible:10,target_ids:['t'],id:'a',status:'archived'},{...quiz,question_count:2,possible:10,target_ids:['t'],id:'b',due_at:'2026-10-05'},{...quiz,question_count:2,possible:10,target_ids:['x'],id:'c',title:'Force',status:'draft'}] as QuizCard[]
 assert.deepEqual(filterQuizzes(cards,defaultQuizFilters,{}).map(q=>q.id),['b','c'])
 assert.deepEqual(filterQuizzes(cards,{...defaultQuizFilters,status:'review'},{a:2}).map(q=>q.id),['a'])
 assert.deepEqual(filterQuizzes(cards,{...defaultQuizFilters,query:' MOTION ',target:'t'},{}).map(q=>q.id),['b'])
 assert.deepEqual(filterQuizzes(cards,{...defaultQuizFilters,status:'all',sort:'due'},{}).map(q=>q.id),['b','a','c'])
})
test('gradebook retains teacher letter and credit choices and never supplies a pending score',()=>{
 assert.equal(resultGrade({...row('u',2),gradeMode:'letter',gradeValue:'B+'}),'B+')
 assert.equal(resultGrade({...row('u',2),gradeMode:'credit',gradeValue:'no_credit'}),'No credit')
 assert.equal(resultGrade({...row('u',2),state:'submitted'}),'Needs review')
 assert.equal(resultGrade({...row('u',2),percent:0}),'0%')
})
test('CSV escapes quotes and formula prefixes including leading whitespace',()=>{
 const csv=quizCsv([['A "quote"','=1+1','  +SUM(A1)','@SUM(A1)','-1','Normal']]);assert(csv.includes('"A ""quote"""'));assert(csv.includes('"\'=1+1"'));assert(csv.includes('"\'  +SUM(A1)"'))
})
test('inventory intersects units, activity, grading and dates without treating unknown usage as unused',()=>{
 const base={...quiz,question_count:2,possible:10,unit_ids:['unit-1'],work_count:0,created_at:'2026-10-07T10:00:00',due_at:'2026-10-09T12:00:00Z'}
 const cards:QuizCard[]=[{...base,id:'new'},{...base,id:'used',work_count:4},{...base,id:'unknown',work_count:undefined},{...base,id:'old',created_at:'2025-10-07'},{...base,id:'removed',status:'draft',deleted_at:'2026-10-07'}]
 assert.deepEqual(filterQuizzes(cards,{...defaultQuizFilters,unit:'unit-1',usage:'unused',gradeMode:'numeric',from:'2026-10-07',to:'2026-10-07',due:'upcoming'},{},Date.parse('2026-10-08')).map(q=>q.id),['new'])
 assert.deepEqual(filterQuizzes(cards,{...defaultQuizFilters,status:'removed'},{}).map(q=>q.id),['removed'])
 assert.equal(filterQuizzes(cards,{...defaultQuizFilters,status:'all'},{}).length,5)
 assert.equal(filterQuizzes(cards,{...defaultQuizFilters,unit:'unit-2'},{}).length,0)
 assert.equal(filterQuizzes(cards,{...defaultQuizFilters,due:'past'},{},Date.parse('2026-10-10')).length,4)
})
