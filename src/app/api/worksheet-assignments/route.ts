import { withAuth,withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { quizCourses,quizRows,quizJson,quizRpcError,quizStaff } from '@/lib/quizzes/server'
import { QUIZ_UUID } from '@/lib/quizzes/types'
import { validateQuiz } from '@/lib/quizzes/validation'
import { worksheetQuizPreview,worksheetUuid } from '@/lib/worksheet-assignments-server'
import { dailyWorksheet,worksheetLabels,type WorksheetTrack } from '@/lib/daily-worksheets'
import type { WorksheetAssignment,PaperReceipt } from '@/lib/worksheet-assignments'
export const GET=withAuth(async(_req,ctx)=>{
 const staff=quizStaff(ctx),courses=(await quizCourses(ctx)).filter(c=>c.program==='physics')
 const rows=courses.length?await quizRows<WorksheetAssignment>((a,b)=>supabaseAdmin.from('worksheet_assignments').select('*').in('course_id',courses.map(c=>c.id)).order('created_at',{ascending:false}).order('id').range(a,b)):[]
 const assignments=rows.filter(a=>staff||a.status==='published'&&(!a.student_ids||a.student_ids.includes(ctx.userId)))
 const receipts=!staff&&assignments.length?await quizRows<PaperReceipt>((a,b)=>supabaseAdmin.from('worksheet_receipts').select('assignment_id,user_id,state,version,recorded_at').in('assignment_id',assignments.map(a=>a.id)).eq('user_id',ctx.userId).order('assignment_id').range(a,b)):[]
 return quizJson({staff,readOnly:ctx.viewingAsTeacher,courses:courses.map(({id,name,section,program,track})=>({id,name,section,program,track})),assignments:assignments.map(a=>staff?a:{...a,student_ids:null}),receipts})
})
export const POST=withRole(['teacher','admin'],async(req,ctx)=>{
 if(ctx.viewingAsTeacher)return quizJson({error:'Return to your own account before assigning.'},403)
 const b=await req.json().catch(()=>null)
 if(!b||!QUIZ_UUID.test(b.id??'')||!QUIZ_UUID.test(b.course_id??'')||!Object.hasOwn(worksheetLabels,b.edition??'')||!dailyWorksheet(b.unit,b.day)||!Number.isFinite(Date.parse(b.paper_due)))return quizJson({error:'Choose a worksheet, class, edition and paper deadline.'},400)
 const course=(await quizCourses(ctx)).find(c=>c.id===b.course_id&&c.program==='physics');if(!course)return quizJson({error:'Choose your own Physics class.'},403)
 let preview,quiz
 try{preview=await worksheetQuizPreview(b.unit,b.day,b.edition as WorksheetTrack,b.id);if(preview.quiz_sha256!==b.quiz_sha256)throw Error('The paired quiz changed. Reload and review the current questions before assigning.');quiz=validateQuiz({id:worksheetUuid(b.id+':quiz'),course_id:course.id,title:`Day ${b.day} · ${preview.title} · Paired quiz`,kind:'understanding',instructions:'Complete the paper worksheet and hand it to your teacher. Then answer these new problems independently. Choose one answer for each question. Your teacher will review your quiz and release your score and feedback.',grade_mode:'numeric',questions:preview.questions,due_at:b.quiz_due,status:'published',version:0,student_ids:b.student_ids??null,source_quiz_id:null,language_level:b.edition.startsWith('honors')?'honors':'cpa',sei_supports:b.edition.endsWith('-sei')});if(!b.quiz_due||Date.parse(b.paper_due)>Date.parse(b.quiz_due))throw Error('Schedule the quiz after paper hand-in.')}catch(e){return quizJson({error:(e as Error).message},400)}
 const {data,error}=await supabaseAdmin.rpc('assign_worksheet_pair',{p_id:b.id,p_unit:b.unit,p_day:b.day,p_edition:b.edition,p_due:b.paper_due,p_source:preview.source_sha256,p_quiz:quiz,p_actor:ctx.email,p_owner:course.teacher_email})
 return error?quizRpcError(error):quizJson({assignment:data},201)
})
