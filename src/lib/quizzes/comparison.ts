import type {Quiz,QuizCourse,QuizWork,QuizSubmission,QuizReview} from './types'

/** Changes to instructions, questions, keys, targets or scoring produce a separate version. */
export function assessmentContent(quiz:Quiz):string {
 return JSON.stringify({instructions:quiz.instructions,questions:quiz.questions.map(q=>({kind:q.kind,prompt:q.prompt,points:q.points,target_id:q.target_id,options:q.options??[],correct_index:q.correct_index??null,guide:q.guide??''}))})
}
export const average=(values:number[])=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null
export function assessmentResults(input:{quizzes:Quiz[];courses:QuizCourse[];enrollments:{course_id:string;student_id:string;name:string}[];work:QuizWork[];submissions:QuizSubmission[];reviews:QuizReview[];groupCopies?:boolean;choiceExemptions?:Record<string,string[]>;choiceAvailable?:Record<string,string[]>}) {
 const groups=new Map<string,Quiz[]>()
 for(const quiz of input.quizzes){if(!quiz.questions.length)continue;const key=input.groupCopies===false?quiz.id:assessmentContent(quiz);groups.set(key,[...(groups.get(key)??[]),quiz])}
 return [...groups.values()].map(quizzes=>{
  quizzes.sort((a,b)=>(b.created_at??'').localeCompare(a.created_at??'')||a.id.localeCompare(b.id))
  const published=quizzes.filter(q=>q.status!=='draft'),representative=published[0]??quizzes[0]
  const students=input.enrollments.flatMap(enrollment=>{
   // The latest assigned copy counts once per student and class; an old score never masks a new pending attempt.
   const quiz=published.find(q=>q.course_id===enrollment.course_id&&(!q.student_ids||q.student_ids.includes(enrollment.student_id)))
   if(!quiz)return []
   const work=input.work.find(w=>w.quiz_id===quiz.id&&w.user_id===enrollment.student_id)
   const attempted=!!work?.submission_id||Object.keys(work?.answers??{}).length>0
   const choiceExempt=!attempted&&!!input.choiceExemptions?.[quiz.id]?.includes(enrollment.student_id)
   const choiceAvailable=!attempted&&!!input.choiceAvailable?.[quiz.id]?.includes(enrollment.student_id)
   const submission=input.submissions.find(s=>s.id===work?.submission_id&&s.quiz_id===quiz.id&&s.user_id===enrollment.student_id)
   const review=submission?input.reviews.filter(r=>r.submission_id===submission.id&&r.decision==='graded').sort((a,b)=>b.reviewed_at.localeCompare(a.reviewed_at))[0]:undefined
   const graded=work?.state==='graded'&&!!review&&!!submission&&assessmentContent(submission.snapshot)===assessmentContent(quiz)
   const questionScores=quiz.questions.map((q,i)=>{
    if(!graded)return null
    const snapshot=submission!.snapshot.questions[i]
    if(!snapshot)return null
    const score=snapshot.kind==='choice'?(submission!.answers[snapshot.id]===String(snapshot.correct_index)?snapshot.points:0):review!.scores[snapshot.id]
    return typeof score==='number'&&Number.isFinite(score)?score:null
   })
   const possible=quiz.questions.reduce((n,q)=>n+q.points,0)
   const complete=graded&&questionScores.every(score=>score!==null)
   const earned=complete?questionScores.reduce<number>((n,score)=>n+(score??0),0):null
   return [{...enrollment,quiz_id:quiz.id,state:work?.state??'not_started',choiceExempt,choiceAvailable,earned,possible,percent:earned===null?null:100*earned/possible,questionScores,ratings:graded?review!.ratings:{},gradeMode:quiz.grade_mode,gradeValue:graded?review!.grade_value:null,submittedAt:submission?.submitted_at??null}]
  })
  const classes=input.courses.filter(c=>quizzes.some(q=>q.course_id===c.id)).map(course=>{
   const rows=students.filter(s=>s.course_id===course.id),scores=rows.flatMap(s=>s.percent===null?[]:[s.percent]).sort((a,b)=>a-b),mid=Math.floor(scores.length/2)
   return {...course,assigned:rows.filter(s=>!s.choiceExempt&&!s.choiceAvailable).length,graded:scores.length,submitted:rows.filter(s=>['submitted','graded'].includes(s.state)).length,
    mean:average(scores),median:scores.length?(scores.length%2?scores[mid]:(scores[mid-1]+scores[mid])/2):null,
    questions:representative.questions.map((q,i)=>({meanPercent:average(rows.flatMap(s=>s.questionScores[i]===null?[]:[100*s.questionScores[i]!/q.points])),graded:rows.filter(s=>s.questionScores[i]!==null).length})),
    targets:[...new Set(representative.questions.map(q=>q.target_id))].map(id=>({id,levels:[1,2,3].map(level=>rows.filter(s=>s.ratings[id]===level).length),unrated:rows.filter(s=>s.ratings[id]==null).length}))}
  })
  return {id:representative.id,title:representative.title,created_at:representative.created_at??null,due_at:representative.due_at,question_count:representative.questions.length,possible:representative.questions.reduce((n,q)=>n+q.points,0),
   copies:quizzes.map(q=>({id:q.id,course_id:q.course_id,status:q.status})),classes,students,
   questions:representative.questions.map(q=>({prompt:q.prompt,points:q.points,target_id:q.target_id,kind:q.kind}))}
 })
}
export type AssessmentComparison=ReturnType<typeof assessmentResults>[number]
