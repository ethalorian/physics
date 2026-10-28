import {withAuth,withRole} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {quizJson,quizRows,quizRpcError,quizStaff} from '@/lib/quizzes/server'
import {QUIZ_UUID} from '@/lib/quizzes/types'
import {dailyWorksheet} from '@/lib/daily-worksheets'
import {accessWorksheet,worksheetSource} from '@/lib/worksheet-assignments-server'
import {quizScheduleError} from '@/lib/quiz-schedule'
import {PAPER_LABELS,type PaperReceipt} from '@/lib/worksheet-assignments'
export const GET=withAuth<{id:string}>(async(_req,ctx)=>{
 const {id}=await ctx.params;if(!QUIZ_UUID.test(id))return quizJson({error:'Worksheet unavailable.'},404)
 const access=await accessWorksheet(id,ctx);if(!access)return quizJson({error:'Worksheet unavailable for this account.'},404)
 const {assignment:a}=access,staff=quizStaff(ctx),sheet=worksheetSource(a.unit_id,a.day),pdf=dailyWorksheet(a.unit_id,a.day)?.files[a.edition].path
 const roster=staff?await quizRows<{student_id:string;students:{id:string;name:string;is_active:boolean}[]|{id:string;name:string;is_active:boolean}|null}>((from,to)=>supabaseAdmin.from('course_students').select('student_id,students(id,name,is_active)').eq('course_id',a.course_id).eq('enrollment_state','ACTIVE').order('id').range(from,to)):[]
 const students=roster.flatMap(r=>{const s=Array.isArray(r.students)?r.students[0]:r.students;return s&&s.is_active!==false&&(!a.student_ids||a.student_ids.includes(s.id))?[{id:s.id,name:s.name}]:[]})
 const receipts=await quizRows<PaperReceipt>((from,to)=>{let q=supabaseAdmin.from('worksheet_receipts').select('assignment_id,user_id,state,version,recorded_at').eq('assignment_id',id);if(!staff)q=q.eq('user_id',ctx.userId);return q.order('user_id').range(from,to)})
 const {data:quiz,error}=await supabaseAdmin.from('quiz_assignments').select('id,title,due_at,status').eq('id',a.quiz_id).single();if(error)throw error
 return quizJson({staff,readOnly:ctx.viewingAsTeacher,assignment:staff?a:{...a,student_ids:null},students,receipts,pdf,quiz,target:sheet?.target??'',criteria:sheet?.criteria??[]})
})
export const POST=withRole(['teacher','admin'],async(req,ctx)=>{
 if(ctx.viewingAsTeacher)return quizJson({error:'Return to your own account before changing worksheets.'},403)
 const {id}=await ctx.params;if(!QUIZ_UUID.test(id))return quizJson({error:'Worksheet unavailable.'},404)
 const access=await accessWorksheet(id,ctx);if(!access)return quizJson({error:'Worksheet unavailable for this account.'},404)
 const b=await req.json().catch(()=>null);if(!b||!Number.isInteger(b.version)||b.version<0)return quizJson({error:'Reload before saving.'},400)
 if(b.action==='receipt'){
  if(!QUIZ_UUID.test(b.user_id??'')||!Object.hasOwn(PAPER_LABELS,b.state??''))return quizJson({error:'Choose a student and paper status.'},400)
  const {data,error}=await supabaseAdmin.rpc('record_worksheet_receipt',{p_id:id,p_user:b.user_id,p_state:b.state,p_version:b.version,p_actor:ctx.email,p_owner:access.course.teacher_email})
  return error?quizRpcError(error):quizJson({receipt:data})
 }
 if(b.action!=='schedule'||!['published','archived'].includes(b.status)||!Number.isFinite(Date.parse(b.paper_due))||!Number.isFinite(Date.parse(b.quiz_due))||Date.parse(b.paper_due)>Date.parse(b.quiz_due))return quizJson({error:'Choose both deadlines, with the quiz after paper hand-in.'},400)
 const schedule=quizScheduleError(b.quiz_due,'regular');if(schedule)return quizJson({error:schedule},400)
 const {data,error}=await supabaseAdmin.rpc('update_worksheet_pair',{p_id:id,p_version:b.version,p_due:b.paper_due,p_quiz_due:b.quiz_due,p_status:b.status,p_actor:ctx.email,p_owner:access.course.teacher_email})
 return error?quizRpcError(error):quizJson({assignment:data})
})
