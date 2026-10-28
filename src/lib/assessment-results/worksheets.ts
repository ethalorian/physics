import 'server-only'
import {read,byIds,type Scope} from './queries'
import type {ResultActivity,ResultCell} from './types'
import {PAPER_LABELS,type WorksheetAssignment,type PaperReceipt} from '../worksheet-assignments'
export async function worksheetResults(scope:Scope):Promise<ResultActivity[]>{
 if(scope.course.program!=='physics')return []
 const assignments=(await read<WorksheetAssignment>('worksheet_assignments','*',q=>q.eq('course_id',scope.course.id),['id'])).filter(a=>scope.includes([a.unit_id]))
 const receipts=await byIds<PaperReceipt>('worksheet_receipts','assignment_id,user_id,state,recorded_at,version','assignment_id',assignments.map(a=>a.id),['assignment_id','user_id'])
 const byStudent=new Map(receipts.map(r=>[r.assignment_id+':'+r.user_id,r]))
 return assignments.map(a=>({key:'worksheet:'+a.id,sourceId:a.id,kind:'worksheet',title:a.title,unitIds:[a.unit_id],targetIds:[],dueAt:a.due_at,archived:a.status==='archived',pairedKey:'quiz:'+a.quiz_id,description:'Paper hand-in · Completion only',cells:Object.fromEntries(scope.students.filter(st=>!a.student_ids||a.student_ids.includes(st.id)).map(st=>{const r=byStudent.get(a.id+':'+st.id);return [st.id,{state:r?.state==='received'?'completed':r?.state==='excused'?'excused':'not_started',label:PAPER_LABELS[r?.state??'not_received'],detail:'Paper completion only; learning-target evidence is in the paired quiz.',needsReview:false,submittedAt:r?.state==='received'?r.recorded_at:null} satisfies ResultCell]}))}))
}
