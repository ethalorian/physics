import {missingDailyLessons} from '@/lib/interactive-assignments/foundations/sequence-server'
import {choiceQuizDispositions} from '@/lib/choice-calendar-server'
import { calendarAssigned, CALENDAR_ASSIGNMENT_MESSAGE } from '@/lib/calendar-assignment'
import {mcasItem} from '@/lib/mcas/bank'
import {withAuth,withRole} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {quizCourses,quizRows,quizJson,quizRpcError,quizStaff,quizListWork} from '@/lib/quizzes/server'
import {quizCard,studentQuiz,type LockedQuizCard,type Quiz,type QuizReview,type QuizTarget} from '@/lib/quizzes/types'
import {validateQuiz} from '@/lib/quizzes/validation'
import {lockedReadingQuizPrerequisites} from '@/lib/reading-quiz-access'
export const GET=withAuth(async(req,ctx)=>{
 const staff=quizStaff(ctx),courses=await quizCourses(ctx),inventory=staff&&new URL(req.url).searchParams.get('inventory')==='1'
 let quizzes=courses.length?await quizRows<Quiz>((a,b)=>{let q=supabaseAdmin.from('quiz_assignments').select('*').in('course_id',courses.map(c=>c.id));if(!inventory)q=q.is('deleted_at',null);if(!staff)q=q.eq('status','published');return q.order('created_at',{ascending:false}).order('id').range(a,b)}):[]
 if(!staff){
  const disposition=await choiceQuizDispositions(courses.filter(c=>c.program==='physics').map(c=>c.id),[ctx.userId])
  quizzes=quizzes.filter(q=>calendarAssigned(q.status,q.due_at)&&(!q.student_ids||q.student_ids.includes(ctx.userId))&&!disposition.exemptions[q.id]?.includes(ctx.userId)&&!disposition.available[q.id]?.includes(ctx.userId))
 }
 const locked:LockedQuizCard[]=[]
 if(!staff){
  const prerequisites=await lockedReadingQuizPrerequisites(quizzes.map(q=>q.id),ctx.userId)
  const readings=prerequisites.size?await quizRows<{id:string;course_id:string;title:string}>((a,b)=>supabaseAdmin.from('textbook_assignments').select('id,course_id,title').in('id',[...prerequisites.values()]).eq('status','published').order('id').range(a,b)):[]
  for(const q of quizzes){const reading=readings.find(r=>r.id===prerequisites.get(q.id)&&r.course_id===q.course_id);if(q.status==='published'&&reading)locked.push({kind:q.kind,id:q.id,course_id:q.course_id,title:q.title,due_at:q.due_at,created_at:q.created_at,reading_id:reading.id,reading_title:reading.title})}
  quizzes=quizzes.filter(q=>!prerequisites.has(q.id))
  const daily=await missingDailyLessons(quizzes.filter(q=>q.daily_sequence_key).map(q=>q.id),ctx.userId)
  for(const q of quizzes){const missing=daily.filter(m=>m.quiz_id===q.id);if(missing.length)locked.push({kind:q.kind,id:q.id,course_id:q.course_id,title:q.title,due_at:q.due_at,created_at:q.created_at,daily_sequence_key:q.daily_sequence_key,prerequisites:missing.map(({id,title,role})=>({id,title,role}))})}
  quizzes=quizzes.filter(q=>!daily.some(m=>m.quiz_id===q.id))
 }

 const work=await quizListWork(quizzes.map(q=>q.id),staff?undefined:ctx.userId),pending:Record<string,number>={}
 if(staff&&courses.length){
  const roster=await quizRows((a,b)=>supabaseAdmin.from('course_students').select('course_id,student_id').in('course_id',courses.map(c=>c.id)).eq('enrollment_state','ACTIVE').order('id').range(a,b))
  const enrolled=new Set(roster.map(r=>`${r.course_id}:${r.student_id}`)),byId=new Map(quizzes.map(q=>[q.id,q]))
  for(const w of work){const q=byId.get(w.quiz_id);if(q&&q.status!=='draft'&&w.state==='submitted'&&enrolled.has(`${q.course_id}:${w.user_id}`)&&(!q.student_ids||q.student_ids.includes(w.user_id)))pending[q.id]=(pending[q.id]??0)+1}
 }
 const submissionIds=!staff?work.flatMap(w=>w.submission_id?[w.submission_id]:[]):[]
 const reviews=submissionIds.length?await quizRows<QuizReview>((a,b)=>supabaseAdmin.from('quiz_reviews').select('id,submission_id,decision,scores,ratings,note,question_notes,earned,possible,grade_mode,grade_value,reviewed_at').in('submission_id',submissionIds).order('id').range(a,b)):[]
 const targets=inventory&&courses.length?await quizRows<QuizTarget>((a,b)=>supabaseAdmin.from('learning_targets').select('id,statement,unit_id,domain,program').in('program',[...new Set(courses.map(c=>c.program))]).order('id').range(a,b)):[]
 const units=inventory&&courses.length?await quizRows<{id:string;name:string}>((a,b)=>supabaseAdmin.from('units').select('id,name').in('program',[...new Set(courses.map(c=>c.program))]).order('id').range(a,b)):[]
 const targetUnits=new Map(targets.map(t=>[t.id,t.unit_id])),workCounts=new Map<string,number>()
 for(const w of work)workCounts.set(w.quiz_id,(workCounts.get(w.quiz_id)??0)+1)
 return quizJson({locked,staff,readOnly:ctx.viewingAsTeacher,courses:courses.map(({id,name,section,program,track})=>({id,name,section,program,track})),quizzes:quizzes.map(q=>{const card={...quizCard(staff?q:studentQuiz(q)),created_at:q.created_at};return inventory?{...card,work_count:workCounts.get(q.id)??0,unit_ids:[...new Set((card.target_ids??[]).flatMap(id=>targetUnits.has(id)?[targetUnits.get(id)!]:[]))]}:card}),...(inventory?{inventory:{units,targets}}:{}),work:staff?[]:work,reviews,pending})
})
export const POST=withRole(['teacher','admin'],async(req,ctx)=>{
 if(ctx.viewingAsTeacher)return quizJson({error:'Return to your own account to create quizzes.'},403)
 let quiz;try{quiz=validateQuiz(await req.json())}catch(e){return quizJson({error:(e as Error).message},400)}
 if(quiz.status==='published'&&!calendarAssigned(quiz.status,quiz.due_at))return quizJson({error:CALENDAR_ASSIGNMENT_MESSAGE},400)
 if(quiz.questions.some(q=>q.mcas_id&&!mcasItem(q.mcas_id)))return quizJson({error:'An MCAS source question is unavailable. Reopen the bank and select it again.'},400)
 const course=(await quizCourses(ctx)).find(c=>c.id===quiz.course_id);if(!course)return quizJson({error:'Choose your own class.'},403)
 if(course.program!=='physics'&&quiz.questions.some(q=>q.mcas_id))return quizJson({error:'MCAS Physics questions belong to a Physics class.'},400)
 const {data,error}=await supabaseAdmin.rpc('save_quiz_assignment',{p_quiz:quiz,p_actor:ctx.email,p_owner:course.teacher_email})
 if(!error&&data.deleted_at)return quizJson({error:'This draft was deleted. Return to your quiz library.',failed:true},409)
 return error?quizRpcError(error):quizJson({quiz:data},201)
})
