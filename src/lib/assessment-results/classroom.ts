import 'server-only'
import { byIds, read, type Scope } from './queries'
import { notStarted } from './model'
import type { ResultActivity, ResultCell } from './types'

export async function presentationResults(scope:Scope):Promise<ResultActivity[]> {
  const sessions = await read<{id:string;plan_unit_id:string|null;plan_day:number|null}>('present_sessions','id,plan_unit_id,plan_day',q=>q.eq('course_id',scope.course.id),['id'])
  const pulses = await byIds<{id:string;session_id:string;kind:string;target_id:string|null;prompt:string;required:boolean;created_at:string}>('present_pulses','id,session_id,kind,target_id,prompt,required,created_at','session_id',sessions.map(s=>s.id),['id'],q=>q.in('kind',['warmup','solo','exit_ticket']))
  const [responses,reviews] = await Promise.all([
    byIds<{id:string;pulse_id:string;user_id:string;created_at:string}>('present_ticket_responses','id,pulse_id,user_id,created_at','pulse_id',pulses.map(p=>p.id),['id'],q=>q.in('user_id',scope.students.map(s=>s.id))),
    byIds<{present_pulse_id:string;user_id:string}>('mastery_evidence_reviews','present_pulse_id,user_id','present_pulse_id',pulses.map(p=>p.id),['id'],q=>q.in('user_id',scope.students.map(s=>s.id))),
  ])
  return pulses.filter(p=>p.required||responses.some(r=>r.pulse_id===p.id)).map(p=>{
    const session=sessions.find(s=>s.id===p.session_id),unit=(p.target_id?scope.targets.get(p.target_id):undefined)??session?.plan_unit_id
    return {key:'presentation:'+p.id,sourceId:p.id,kind:'presentation',title:`${p.kind==='warmup'?'Warm-up':p.kind==='solo'?'Solo activity':'Exit ticket'}${session?.plan_day?' · Day '+session.plan_day:''} · ${p.created_at.slice(0,10)}`,description:p.prompt,unitIds:unit?[unit]:[],targetIds:p.target_id?[p.target_id]:[],dueAt:null,archived:false,
      cells:Object.fromEntries(scope.students.flatMap(st=>{
        const response=responses.find(r=>r.pulse_id===p.id&&r.user_id===st.id),reviewed=reviews.some(r=>r.present_pulse_id===p.id&&r.user_id===st.id)
        if(!response)return p.required?[[st.id,notStarted()]]:[]
        return [[st.id,{state:reviewed?'reviewed':'submitted',label:reviewed?'Teacher reviewed':p.target_id?'Needs review':'Submitted',needsReview:!!p.target_id&&!reviewed,submissionId:response.id,submittedAt:response.created_at,pendingTargets:reviewed||!p.target_id?[]:[p.target_id]} satisfies ResultCell]]
      }))}
  })
}
