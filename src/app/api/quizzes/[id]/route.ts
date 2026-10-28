import {checkRevisionBeforeSubmit,recordRevisionSubmitted} from '@/lib/review-desk/revision-server'
import { calendarAssigned, CALENDAR_ASSIGNMENT_MESSAGE } from '@/lib/calendar-assignment'
import {after} from 'next/server'
import {processQuizSubmission,quizGradingModel} from '@/lib/quizzes/grading-server'
import {quizAiRecoverable,type QuizAiReview} from '@/lib/quizzes/grading'
export const maxDuration=180
import {withAuth} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {accessQuiz,quizJson,quizRows,quizRoster,quizStaff,quizRpcError,quizListWork} from '@/lib/quizzes/server'
import {QUIZ_UUID,studentQuiz,type QuizSubmission,type QuizReview} from '@/lib/quizzes/types'
import {validateAnswers,validateReview} from '@/lib/quizzes/validation'
export const GET=withAuth<{id:string}>(async(_req,ctx)=>{
 const {id}=await ctx.params;if(!QUIZ_UUID.test(id))return quizJson({error:'Quiz unavailable.'},404)
 const access=await accessQuiz(id,ctx);if(!access)return quizJson({error:'Quiz unavailable for this account.'},404)
 const staff=quizStaff(ctx),quiz=access.quiz,students=staff?await quizRoster(quiz):[],users=staff?students.map(s=>s.id):[ctx.userId]
 const {data:worksheet,error:worksheetError}=await supabaseAdmin.from('worksheet_assignments').select('id,title,due_at,course_id,unit_id').eq('quiz_id',id).maybeSingle();if(worksheetError)throw worksheetError
 const targetIds=[...new Set(quiz.questions.map(q=>q.target_id).filter(Boolean))]
 const [allWork,submissions,targets]=await Promise.all([
  quizListWork([id],staff?undefined:ctx.userId),
  users.length?quizRows<QuizSubmission>((a,b)=>supabaseAdmin.from('quiz_submissions').select('*').eq('quiz_id',id).in('user_id',users).order('submitted_at',{ascending:false}).order('id').range(a,b)):[],
  targetIds.length?quizRows((a,b)=>supabaseAdmin.from('learning_targets').select('id,statement,unit_id,domain,program').in('id',targetIds).order('id').range(a,b)):[]
 ])
 const reviews=submissions.length?await quizRows<QuizReview>((a,b)=>supabaseAdmin.from('quiz_reviews').select('id,submission_id,decision,scores,ratings,note,question_notes,earned,possible,grade_mode,grade_value,reviewed_at').in('submission_id',submissions.map(s=>s.id)).order('reviewed_at',{ascending:false}).order('id').range(a,b)):[]
 // Reviewed keys are released only with a final grade for that immutable attempt.
 const drafts=staff&&submissions.length?await quizRows((a,b)=>supabaseAdmin.from('quiz_review_drafts').select('submission_id,version,payload').in('submission_id',submissions.map(s=>s.id)).order('submission_id').range(a,b)):[]
 const ai=staff&&!worksheet&&submissions.length?await quizRows<QuizAiReview>((a,b)=>supabaseAdmin.from('quiz_ai_reviews').select('submission_id,status,result,error,model,attempts,locked_until,updated_at').in('submission_id',submissions.map(s=>s.id)).order('submission_id').range(a,b)):[]
 const current=new Set(allWork.filter(w=>w.state==='submitted').map(w=>w.submission_id))
 const resume=ai.filter(a=>current.has(a.submission_id)&&quizAiRecoverable(a)).slice(0,2)
 if(staff&&!ctx.viewingAsTeacher&&process.env.ANTHROPIC_API_KEY&&resume.length){
  // Keep the review polling while these private suggestions are regenerated.
  resume.forEach(a=>{a.status='processing'})
  after(async()=>{await Promise.allSettled(resume.map(a=>processQuizSubmission(a.submission_id,true)))})
 }
 const graded=new Set(reviews.filter(r=>r.decision==='graded').map(r=>r.submission_id))
 return quizJson({worksheet,... (staff?{ai,claudeConfigured:!worksheet&&!!process.env.ANTHROPIC_API_KEY,claudeModel:quizGradingModel()}:{}),drafts,staff,readOnly:ctx.viewingAsTeacher,quiz:staff?quiz:studentQuiz(quiz),students,work:allWork.filter(w=>users.includes(w.user_id)),submissions:staff?submissions:submissions.map(s=>({...s,snapshot:graded.has(s.id)?{...studentQuiz(s.snapshot),questions:s.snapshot.questions}:studentQuiz(s.snapshot)})),reviews,targets})
})
export const POST=withAuth<{id:string}>(async(req,ctx)=>{
 const {id}=await ctx.params;if(!QUIZ_UUID.test(id))return quizJson({error:'Quiz unavailable.'},404)
 const access=await accessQuiz(id,ctx);if(!access)return quizJson({error:'Quiz unavailable.'},404)
 let b;try{b=await req.json()}catch{return quizJson({error:'Invalid request.'},400)}
 if(!b||typeof b!=='object'||Array.isArray(b))return quizJson({error:'Invalid request.'},400)
 if(quizStaff(ctx)){
  if(access.quiz.daily_sequence_key&&['archive','reopen'].includes(b.action))return quizJson({error:'Manage the daily quiz with its review on the teaching calendar.'},409)
  if(['archive','reopen'].includes(b.action)){const {data:pair,error}=await supabaseAdmin.from('worksheet_assignments').select('id').eq('quiz_id',id).maybeSingle();if(error)throw error;if(pair)return quizJson({error:'Manage this quiz together with its paper worksheet in Worksheets & paired quizzes.',worksheet_id:pair.id},409)}
  if(ctx.viewingAsTeacher)return quizJson({error:'Return to your own account before grading.'},403)
  if(b.action==='archive'||b.action==='reopen'){
   if(Object.keys(b).some(k=>!['action','version'].includes(k))||!Number.isInteger(b.version)||b.version<1||b.version>=2147483647)return quizJson({error:'Reload this quiz before continuing.'},400)
   if(b.action==='reopen'&&!calendarAssigned(true,access.quiz.due_at))return quizJson({error:CALENDAR_ASSIGNMENT_MESSAGE},409)
   const from=b.action==='archive'?'published':'archived',to=b.action==='archive'?'archived':'published'
   if(access.quiz.status===to&&access.quiz.version===b.version+1)return quizJson({ok:true})
   if(access.quiz.status!==from)return quizJson({error:'Quiz status changed. Refresh before continuing.'},409)
   const {data,error}=await supabaseAdmin.from('quiz_assignments').update({status:to,version:b.version+1,updated_at:new Date().toISOString()}).eq('id',id).eq('course_id',access.quiz.course_id).eq('version',b.version).eq('status',from).is('deleted_at',null).select('id').maybeSingle();if(error)throw error
   return data?quizJson({ok:true}):quizJson({error:'Quiz changed. Reload before continuing.'},409)
  }
  if(!['review','save_review'].includes(b.action))return quizJson({error:'Action unavailable.'},403)
  let review;try{review=validateReview({...b,decision:b.action==='save_review'?'graded':b.decision},access.quiz,b.action==='save_review')}catch(e){return quizJson({error:(e as Error).message},400)}
  const {data:submission,error:se}=await supabaseAdmin.from('quiz_submissions').select('id').eq('id',review.submission_id).eq('quiz_id',id).maybeSingle();if(se)throw se;if(!submission)return quizJson({error:'Submission unavailable.'},404)
  if(!Number.isInteger(b.draft_version)||b.draft_version<0)return quizJson({error:'Reload the review.'},400)
  if(b.action==='save_review'){const {data,error}=await supabaseAdmin.rpc('save_quiz_review_draft',{p_submission:submission.id,p_actor:ctx.email,p_owner:access.course.teacher_email,p_version:b.draft_version,p_payload:{scores:review.scores,ratings:review.ratings,note:review.note,question_notes:review.question_notes,grade_value:review.grade_value}});return error?quizRpcError(error):quizJson({draft:data})}
  const {data,error}=await supabaseAdmin.rpc('review_quiz_submission',{p_submission:submission.id,p_request:review.request_id,p_actor:ctx.email,p_owner:access.course.teacher_email,p_decision:review.decision,p_scores:review.scores,p_ratings:review.ratings,p_note:review.note.trim(),p_question_notes:review.question_notes,p_grade_value:review.grade_value,p_draft_version:b.draft_version})
  return error?quizRpcError(error):quizJson({review:data})
 }
 if(ctx.realRole!=='student'||!['save','submit'].includes(b.action))return quizJson({error:'Action unavailable.'},403)
 if(!Number.isInteger(b.version)||b.version<0||!QUIZ_UUID.test(b.request_id??''))return quizJson({error:'Reload this quiz before continuing.'},400)
 let answers;try{answers=validateAnswers(b.answers,access.quiz.questions,b.action==='submit')}catch(e){return quizJson({error:(e as Error).message},400)}
 if(b.action==='submit'){const message=await checkRevisionBeforeSubmit('quiz:'+id,ctx.userId);if(message)return quizJson({error:message},422)}
 const {data,error}=await supabaseAdmin.rpc('quiz_student_action',{p_quiz:id,p_user:ctx.userId,p_action:b.action,p_answers:answers,p_version:b.version,p_request:b.request_id})
 if(error)return quizRpcError(error)
 if(b.action==='submit'){await recordRevisionSubmitted('quiz:'+id,ctx.userId);after(async()=>{try{await processQuizSubmission(b.request_id)}catch{console.warn('[quiz-grading] Saved submission remains pending analysis.')}})}
 return quizJson({work:data})
})
