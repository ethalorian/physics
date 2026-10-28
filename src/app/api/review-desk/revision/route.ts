import {NextResponse} from 'next/server'
import {withAuth,withEnrolledStudent} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {reviewPercent,type ReviewDocument,type ReviewDecision} from '@/lib/review-desk/types'
import {pendingRevision,revisionRequirements,revisionSourceKeys} from '@/lib/review-desk/revision-server'
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}})
export const GET=withAuth(async(request,ctx)=>{
 if(ctx.role!=='student')return json({revision:null})
 let key=request.nextUrl.searchParams.get('assignment');if(!key||key.length>240)return json({error:'Choose an assignment.'},400)
 const missionKey=key.startsWith('mission:')?key:null
 if(missionKey){const mission=await supabaseAdmin.from('math_mission_sessions').select('code').eq('id',key.slice(8)).eq('user_id',ctx.userId).maybeSingle();if(mission.error)throw mission.error;if(!mission.data)return json({revision:null,receipt:null});const target=await supabaseAdmin.from('math_competencies').select('id').eq('code',mission.data.code).eq('is_active',true).maybeSingle();if(target.error)throw target.error;if(!target.data)return json({revision:null,receipt:null});key='math:'+target.data.id}
 const r=await supabaseAdmin.from('review_desk_revisions').select('id,source_key,user_id,source_version,feedback,evidence,change_summary,addressed,requested_at,resubmitted_at,released_at').in('source_key',revisionSourceKeys(key)).eq('user_id',ctx.userId).order('requested_at',{ascending:false}).limit(1).maybeSingle();if(r.error)throw r.error
 // Only a teacher's explicitly sent revision instructions are visible here.
 let releasedQuery=supabaseAdmin.from('review_desk_drafts').select('payload,review_snapshot,updated_at').in('source_key',revisionSourceKeys(key)).eq('user_id',ctx.userId).eq('state','released');if(missionKey)releasedQuery=releasedQuery.eq('review_snapshot->>submissionId',missionKey)
 const released=await releasedQuery.order('updated_at',{ascending:false}).limit(1).maybeSingle();if(released.error)throw released.error
 const doc=released.data?.review_snapshot as ReviewDocument|undefined,decision=released.data?.payload as ReviewDecision|undefined
 const receipt=doc&&decision?{releasedAt:released.data!.updated_at,percent:reviewPercent(doc,decision),note:decision.note,targets:doc.targets.map(t=>({id:t.id,statement:t.statement,level:t.released??decision.ratings[t.id]})),feedback:Object.entries(decision.feedback).filter(([,note])=>note.trim()).map(([id,note])=>({id,label:doc.evidence.find(e=>e.id===id)?.prompt??doc.scoreItems.find(i=>i.id===id)?.label??'Feedback',note}))}:null
 const revision=r.data&&!missionKey?{...r.data,evidence:r.data.evidence.map((e:{id:string;prompt:string;teacherFeedback?:string})=>({id:e.id,prompt:e.prompt,teacherFeedback:e.teacherFeedback??''}))}:null
 return json({revision,requirements:r.data?revisionRequirements(r.data.evidence):[],receipt})
})
export const POST=withEnrolledStudent(async(request,ctx)=>{
 if(ctx.role!=='student'||request.headers.get('origin')!==request.nextUrl.origin)return json({error:'Use your own student account.'},403)
 const b=await request.json().catch(()=>null)
 if(!b||typeof b.assignment!=='string'||b.assignment.length>240||typeof b.summary!=='string'||!b.summary.trim()||b.summary.length>2000||!Array.isArray(b.addressed)||!b.addressed.every((id:unknown)=>typeof id==='string'))return json({error:'Write a brief change summary and check the revision steps.'},400)
 const current=await pendingRevision(b.assignment,ctx.userId)
 if(!current||current.id!==b.id)return json({error:'This revision request changed. Refresh the assignment.'},409)
 const required=revisionRequirements(current.evidence)
 if(required.some(id=>!b.addressed.includes(id))||b.addressed.some((id:string)=>!required.includes(id)))return json({error:'Check each feedback item after reviewing your changes.'},400)
 const r=await supabaseAdmin.from('review_desk_revisions').update({change_summary:b.summary.trim(),addressed:[...new Set(b.addressed)]}).eq('id',current.id).eq('user_id',ctx.userId).is('resubmitted_at',null).is('released_at',null).select('id').maybeSingle();if(r.error)throw r.error;if(!r.data)return json({error:'This attempt was already resubmitted. Refresh the assignment.'},409)
 return json({saved:true})
})
