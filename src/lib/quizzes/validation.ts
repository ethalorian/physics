import {MCAS_ID} from '@/lib/mcas/types'
import {LETTER_GRADES,QUIZ_UUID,type Quiz,type QuizAnswers,type QuizQuestion,type ProblemAnswer} from './types'
import {PROBLEM_STAGES,validateProblemStage,stageHasEvidence} from '@/lib/problem-response'
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)
const text=(v:unknown,max:number,required=true):v is string=>typeof v==='string'&&v.length<=max&&(!required||!!v.trim())
export function validateQuiz(v:unknown):Quiz {
 if(!object(v)||!QUIZ_UUID.test(String(v.id))||!QUIZ_UUID.test(String(v.course_id))||!text(v.title,160)||!text(v.instructions,3000,false)||!['vocabulary','understanding','mixed'].includes(String(v.kind))||!['numeric','letter','credit'].includes(String(v.grade_mode))||!['draft','published'].includes(String(v.status))||!Number.isInteger(v.version)||Number(v.version)<0)throw Error('Choose a class, title, quiz type, and grading format.')
 if(v.due_at!==null&&(!text(v.due_at,40)||!Number.isFinite(Date.parse(v.due_at))))throw Error('Choose a valid due date or leave it empty.')
 if(v.source_quiz_id!==null&&!QUIZ_UUID.test(String(v.source_quiz_id)))throw Error('Invalid reassessment link.')
 if(v.student_ids!==null&&(!Array.isArray(v.student_ids)||!v.student_ids.length||v.student_ids.length>1000||v.student_ids.some(id=>typeof id!=='string'||!QUIZ_UUID.test(id))))throw Error('Choose students or assign the whole class.')
 if(v.language_level!=null&&!['cpa','honors'].includes(String(v.language_level))||v.sei_supports!=null&&typeof v.sei_supports!=='boolean')throw Error('Choose CPA or Honors and a valid SEI support setting.')
 const published=v.status==='published'
 if(!Array.isArray(v.questions)||(published&&v.questions.length<1)||v.questions.length>30)throw Error('Add 1–30 questions.')
 const seen=new Set<string>()
 const questions=v.questions.map((raw,i)=>{
  if(!object(raw)||!QUIZ_UUID.test(String(raw.id))||seen.has(String(raw.id))||!['choice','written','problem'].includes(String(raw.kind))||!text(raw.prompt,3000,published)||!text(raw.guide,3000,published)||!(raw.target_id===''&&!published||QUIZ_UUID.test(String(raw.target_id)))||!Number.isInteger(raw.points)||Number(raw.points)<1||Number(raw.points)>20)throw Error(`Question ${i+1} needs a prompt, answer guide, learning target, and 1–20 points.`)
  seen.add(String(raw.id));const q:QuizQuestion={id:String(raw.id),kind:raw.kind as QuizQuestion['kind'],prompt:raw.prompt.trim(),guide:raw.guide.trim(),target_id:String(raw.target_id),points:Number(raw.points)}
  if(raw.mcas_id!==undefined){if(typeof raw.mcas_id!=='string'||!MCAS_ID.test(raw.mcas_id))throw Error('Invalid MCAS question reference.');q.mcas_id=raw.mcas_id}
  if(q.kind==='choice'){
   if(!Array.isArray(raw.options)||raw.options.length<2||raw.options.length>6||raw.options.some(o=>!text(o,800,published))||(published&&new Set(raw.options.map(o=>String(o).trim().toLowerCase())).size!==raw.options.length)||!Number.isInteger(raw.correct_index)||Number(raw.correct_index)<(published?0:-1)||Number(raw.correct_index)>=raw.options.length)throw Error(`Question ${i+1} needs distinct choices and one correct answer.`)
   q.options=raw.options.map(o=>String(o).trim());q.correct_index=Number(raw.correct_index)
  }
  if(raw.vocabulary!==undefined){if(!Array.isArray(raw.vocabulary)||raw.vocabulary.length>12||raw.vocabulary.some(w=>!text(w,150)))throw Error('Use a short list of vocabulary words.');q.vocabulary=raw.vocabulary as string[]}
  return q
 })
 return {...(v.language_level!==undefined?{language_level:v.language_level as Quiz['language_level']}:{}),...(v.sei_supports!==undefined?{sei_supports:v.sei_supports as boolean|null}:{}),id:String(v.id),course_id:String(v.course_id),title:String(v.title).trim(),instructions:String(v.instructions).trim(),kind:v.kind as Quiz['kind'],grade_mode:v.grade_mode as Quiz['grade_mode'],questions,due_at:v.due_at as string|null,status:v.status as Quiz['status'],version:Number(v.version),student_ids:v.student_ids===null?null:[...new Set(v.student_ids as string[])],source_quiz_id:v.source_quiz_id as string|null}
}
export function validateAnswers(v:unknown,questions:QuizQuestion[],complete=false):QuizAnswers {
 if(!object(v)||JSON.stringify(v).length>1500000)throw Error('Invalid quiz responses.')
 const out:QuizAnswers={}
 for(const [id,a]of Object.entries(v)){
  const q=questions.find(q=>q.id===id);if(!q)throw Error('A response does not belong to this quiz.')
  if(q.kind==='problem'){
   if(!object(a)||Object.keys(a).some(k=>!PROBLEM_STAGES.includes(k as typeof PROBLEM_STAGES[number])))throw Error('Invalid problem response.')
   const problem=Object.fromEntries(PROBLEM_STAGES.map(k=>[k,validateProblemStage(a[k])])) as ProblemAnswer
   if(complete&&PROBLEM_STAGES.some(k=>!stageHasEvidence(problem[k])))throw Error('Add text or a drawing to Model, Plan, Work, and Answer. Reasoning or an explanation of uncertainty is welcome.')
   out[id]=problem
  }else{
   if(!text(a,10000,complete))throw Error('Add a response to every question.')
   if(q.kind==='choice'&&a!==''&&!q.options?.some((_,n)=>String(n)===a))throw Error('Choose an available answer.')
   out[id]=a
  }
 }
 if(complete&&questions.some(q=>!Object.hasOwn(out,q.id)))throw Error('Answer every question before submitting.')
 return out
}
export function quizScore(questions:QuizQuestion[],answers:QuizAnswers,scores:Record<string,number>){
 let earned=0,pending=0;const possible=questions.reduce((n,q)=>n+q.points,0)
 for(const q of questions){if(q.kind==='choice')earned+=answers[q.id]===String(q.correct_index)?q.points:0;else if(Number.isFinite(scores[q.id])&&scores[q.id]>=0&&scores[q.id]<=q.points&&scores[q.id]*2===Math.round(scores[q.id]*2))earned+=scores[q.id];else pending++}
 return {earned,possible,pending,percent:pending?null:Math.round(100*earned/possible)}
}
export function validateReview(b:unknown,quiz:Quiz,draftOnly=false){
 if(!object(b)||!QUIZ_UUID.test(String(b.submission_id))||!QUIZ_UUID.test(String(b.request_id))||!['graded','returned'].includes(String(b.decision))||!text(b.note,3000,!draftOnly)||!object(b.scores)||!object(b.ratings)||!object(b.question_notes))throw Error('Add feedback and complete this review.')
 for(const [id,score]of Object.entries(b.scores)){const q=quiz.questions.find(q=>q.id===id&&q.kind!=='choice');if(!q||typeof score!=='number'||!Number.isFinite(score)||score<0||score>q.points||!Number.isInteger(score*2))throw Error('Score written work in half-point steps within its available points.')}
 for(const [id,note]of Object.entries(b.question_notes))if(!quiz.questions.some(q=>q.id===id)||!text(note,2000,false))throw Error('Invalid question feedback.')
 const targets=[...new Set(quiz.questions.map(q=>q.target_id))]
 if(Object.entries(b.ratings).some(([id,n])=>!targets.includes(id)||![null,1,2,3].includes(n as number|null)))throw Error('Use 1–3 or not enough evidence for the assessed targets.')
 if(b.decision==='returned'){
  if(Object.keys(b.scores).length||Object.keys(b.ratings).length||b.grade_value!==null)throw Error('Request revision without releasing scores or mastery ratings.')
 }else{
  if(!draftOnly&&targets.some(id=>!Object.hasOwn(b.ratings as object,id)))throw Error('Make a mastery decision for every target, including not enough evidence when appropriate.')
  if(!draftOnly&&quiz.questions.some(q=>q.kind!=='choice'&&!Object.hasOwn(b.scores as object,q.id)))throw Error('Score every written response before returning the grade.')
  if(quiz.grade_mode==='numeric'&&b.grade_value!==null||quiz.grade_mode==='letter'&&!(draftOnly&&b.grade_value===null)&&!LETTER_GRADES.includes(b.grade_value as typeof LETTER_GRADES[number])||quiz.grade_mode==='credit'&&!(draftOnly&&b.grade_value===null)&&!['credit','no_credit'].includes(String(b.grade_value)))throw Error('Choose the quiz grade.')
 }
 return b as unknown as {submission_id:string;request_id:string;decision:'graded'|'returned';scores:Record<string,number>;ratings:Record<string,1|2|3|null>;note:string;question_notes:Record<string,string>;grade_value:string|null}
}
