import {NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase'
import {teacherCanAccessStudent} from '@/lib/teacher-scope'
import {validateEvidenceKeys,validateEvidenceDecisions,summarizeEvidence} from '@/lib/evidence-rating'
import type {AuthContext} from '@/lib/api-auth'

export const presentationEvidenceId=(pulse:string)=>'presentation:'+pulse
export const presentationPulseId=(value:string|null)=>value?.startsWith('presentation:')&&/^[0-9a-f-]{36}$/i.test(value.slice(13))?value.slice(13):null
interface TicketRow {id:string;user_id:string;pulse_id:string;created_at:string;response?:string;present_pulses:{id:string;kind:string;target_id:string;prompt:string;created_at:string;present_sessions:{course_id:string;plan_day:number|null}}}

/** The classroom source stays independent of video-lesson publication and submissions. */
export async function presentationEvidence(students:string[],targets:string[],classId?:string|null,answers=false){
 if(!students.length||!targets.length)return [] as TicketRow[]
 const rows:TicketRow[]=[]
 for(let from=0;;from+=500){
  let query=supabaseAdmin.from('present_ticket_responses').select(`id,user_id,pulse_id,created_at,${answers?'response,':''}present_pulses!inner(id,kind,target_id,prompt,created_at,present_sessions!inner(course_id,plan_day))`).in('user_id',students).in('present_pulses.target_id',targets).order('created_at',{ascending:false}).order('id').range(from,from+499)
  if(classId)query=query.eq('present_pulses.present_sessions.course_id',classId)
  const result=await query;if(result.error)throw result.error
  rows.push(...result.data as unknown as TicketRow[])
  if(result.data.length<500)break
 }
 return rows
}
export function presentationWork(row:TicketRow){
 const p=row.present_pulses
 return {evidenceKey:row.id,lessonId:presentationEvidenceId(p.id),submissionId:null,lessonTitle:`${p.kind==='warmup'?'Warm-up':p.kind==='solo'?'Solo activity':'Exit ticket'}${p.present_sessions.plan_day?' · Day '+p.present_sessions.plan_day:''} · ${p.created_at.slice(0,10)}`,blockType:p.kind,blockId:p.id,prompt:p.prompt,response:row.response??'',createdAt:row.created_at,targetLinked:true,responseMode:'written',scaffoldsUsed:[] as string[],evidenceSource:p.kind,confidence:null,role:null,untargeted:false,unlinked:false}
}
export async function presentationStudentWork(userId:string,unitId:string,targetId:string|null,pulseId?:string|null){
 let query=supabaseAdmin.from('learning_targets').select('id,slug,statement,domain').eq('unit_id',unitId)
 if(targetId)query=query.eq('id',targetId)
 const targets=await query;if(targets.error)throw targets.error
 const rows=await presentationEvidence([userId],targets.data.map(t=>t.id),null,true)
 const selected=rows.filter(r=>!pulseId||r.pulse_id===pulseId)
 const records=targets.data.length?await supabaseAdmin.from('mastery_records').select('target_id,level,observed_at,evidence_source').eq('user_id',userId).in('target_id',targets.data.map(t=>t.id)).order('observed_at'):{data:[],error:null}
 if(records.error)throw records.error
 return {userId,unitId,targets:targets.data,records:records.data??[],work:selected.map(presentationWork),submissions:[]}
}
export function presentationReviewDTO<T extends {present_pulse_id?:string|null;lesson_id?:string|null}>(row:T){return {...row,lesson_id:row.present_pulse_id?presentationEvidenceId(row.present_pulse_id):row.lesson_id}}

export async function reviewPresentationEvidence(body:Record<string,unknown>,ctx:AuthContext){
 const {userId,unitId,targetId,lessonId,requestId}=body
 if(ctx.viewingAsTeacher)return NextResponse.json({error:'Switch back to your own account before rating work.'},{status:403})
 if(![userId,unitId,targetId,lessonId,requestId].every(v=>typeof v==='string'&&v.length>0&&v.length<200)||!/^[0-9a-f-]{36}$/i.test(String(requestId)))return NextResponse.json({error:'Invalid review identifiers.'},{status:400})
 const pulseId=presentationPulseId(String(lessonId));if(!pulseId)return NextResponse.json({error:'Invalid presentation activity.'},{status:400})
 if(!await teacherCanAccessStudent(ctx.scopeEmail,String(userId)))return NextResponse.json({error:'Student is not on your roster.'},{status:403})
 const prior=await supabaseAdmin.from('mastery_evidence_reviews').select('*').eq('id',String(requestId)).maybeSingle();if(prior.error)throw prior.error
 if(prior.data){if(prior.data.user_id!==userId||prior.data.target_id!==targetId||prior.data.present_pulse_id!==pulseId||prior.data.reviewer_email!==ctx.scopeEmail)return NextResponse.json({error:'Review identifier conflict.'},{status:409});return NextResponse.json({id:prior.data.id,level:prior.data.overall_level,mean:prior.data.mean,review:presentationReviewDTO(prior.data)})}
 const data=await presentationStudentWork(String(userId),String(unitId),String(targetId),pulseId)
 if(data.work.length!==1)return NextResponse.json({error:'This submitted response is unavailable for the selected target.'},{status:404})
 const mode=body.mode??'target',message=typeof body.message==='string'?body.message.trim():''
 if(!['target','evidence'].includes(String(mode))||message.length>1600)return NextResponse.json({error:'Invalid review or feedback.'},{status:422})
 let level:number|null,decisions:ReturnType<typeof validateEvidenceDecisions>=[]
 try{if(mode==='target'){validateEvidenceKeys(body.evidenceKeys,data.work.map(w=>w.evidenceKey));level=Number(body.level)}else{decisions=validateEvidenceDecisions(body.decisions,data.work.map(w=>w.evidenceKey));level=summarizeEvidence(decisions).level}}catch(e){return NextResponse.json({error:(e as Error).message},{status:422})}
 if(!level||![1,2,3].includes(level))return NextResponse.json({error:'Choose a mastery rating of 1, 2 or 3.'},{status:422})
 const evidence=data.work.map(w=>({...w,key:w.evidenceKey,...(mode==='evidence'?decisions.find(d=>d.key===w.evidenceKey):{})}))
 const feedback=`${data.work[0].lessonTitle}: ${level} / 3 (${['','Not yet','Almost','Got it'][level]}).${message?'\n\n'+message:''}`
 const saved=await supabaseAdmin.rpc('review_present_ticket',{p_id:requestId,p_user:userId,p_reviewer:ctx.scopeEmail,p_pulse:pulseId,p_target:targetId,p_evidence:evidence,p_mode:mode,p_level:level,p_message:feedback,p_note:message})
 if(saved.error)throw saved.error
 return NextResponse.json({id:saved.data.id,level:saved.data.overall_level,mean:saved.data.mean,review:presentationReviewDTO(saved.data)},{status:201})
}
