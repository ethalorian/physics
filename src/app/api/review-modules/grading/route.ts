import { NextResponse } from 'next/server'
import { ownerEmailsFor } from '@/lib/identity-aliases'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { privateHeaders } from '@/lib/review-modules/server'
import { reviewDashboardScope } from '@/lib/review-modules/dashboard-server'
import { gradeResponses,queueReviewScores,processReviewScore } from '@/lib/review-modules/grading-server'
import { effectiveItems,responseKey,scorePercent,type ReviewScore } from '@/lib/review-modules/analytics'
export const maxDuration=180
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:privateHeaders})
export const POST=withRole(['teacher','admin'],async(request,ctx)=>{
 if(request.headers.get('origin')!==request.nextUrl.origin)return json({error:'Reload and try again.'},403)
 if(ctx.viewingAsTeacher)return json({error:'Switch back to your own account.'},403)
 const body=await request.json().catch(()=>null);if(!body)return json({error:'Invalid request.'},400)
 if(!process.env.ANTHROPIC_API_KEY&&['queue','process','check'].includes(body.action))return json({error:'Claude is not configured on this site.'},503)
 const scope=await reviewDashboardScope(ctx)
 const assignments=scope.assignments.filter(a=>(!body.slug||body.slug===a.slug)&&(!body.course_id||a.course_ids.includes(body.course_id)))
 const slugs=assignments.map(a=>a.slug),users=scope.roster.filter(r=>assignments.some(a=>a.course_ids.includes(r.course_id))&&(!body.course_id||r.course_id===body.course_id)).map(r=>r.student_id)
 if(body.action==='check'){
  if(!assignments.length)return json({error:'Forbidden'},403)
  try{const tested=await gradeResponses(assignments[0].slug,{km:'1000',seconds:'seconds',velocity:'how fast it is moving and in which direction.',position:'its starting distance from Earth'},true);if(tested.result.items.some(i=>i.score!==4))return json({error:'Claude connected, but the calibration answers need a rubric review.'},502);return json({connected:true,model:tested.model,message:'Claude connected. All four calibration answers scored correctly.'})}catch(e){return json({error:e instanceof Error?e.message:'Claude connection failed.'},502)}
 }
 if(!slugs.length)return json({error:'Forbidden'},403)
 if(body.action==='queue')return json({queued:await queueReviewScores(slugs,[...new Set(users)],true,true)})
 if(body.action==='process')return json(await processReviewScore(slugs,[...new Set(users)]))
 if(body.action==='release' || body.action==='save-draft'){
  if(ctx.viewingAsTeacher||typeof body.user_id!=='string'||!users.includes(body.user_id)||!slugs.includes(body.slug)||!Number.isInteger(body.revision))return json({error:'Choose a current submission in your own class.'},403)
  const released=await supabaseAdmin.rpc('review_module_decision',{p_slug:body.slug,p_user:body.user_id,p_revision:body.revision,p_actor:ctx.scopeEmail,p_owner_emails:ownerEmailsFor(ctx.scopeEmail),p_draft:body.draft,p_release:body.action==='release'})
  if(released.error)return json({error:'Responses or scoring changed. Refresh before release.'},409)
  return json({released:body.action==='release',saved:true})
 }
 if(body.action==='override'){
  if(typeof body.user_id!=='string'||!users.includes(body.user_id)||!slugs.includes(body.slug))return json({error:'Forbidden'},403)
  if(typeof body.field!=='string'||!Number.isInteger(body.score)||body.score<0||body.score>4||typeof body.feedback!=='string'||body.feedback.length>800||!Number.isInteger(body.revision))return json({error:'Choose a score from 0 to 4 and keep feedback under 800 characters.'},400)
  const [scoreResult,workResult]=await Promise.all([supabaseAdmin.from('review_module_scores').select('*').eq('module_slug',body.slug).eq('user_id',body.user_id).maybeSingle(),supabaseAdmin.from('review_module_work').select('state,status').eq('module_slug',body.slug).eq('user_id',body.user_id).maybeSingle()])
  if(scoreResult.error)throw scoreResult.error;if(workResult.error)throw workResult.error
  const score=scoreResult.data as ReviewScore|null,work=workResult.data
  if(!score||!work||score.status!=='ready'||score.work_status!==work.status||responseKey(score.response_snapshot)!==responseKey(work.state.responses))return json({error:'The responses changed. Analyze the latest work before adjusting a score.'},409)
  const original=score.result?.items.find(i=>i.id===body.field);if(!original)return json({error:'No scored answer found.'},400)
  const overrides={...score.overrides,[body.field]:{score:body.score,feedback:body.feedback.trim()}}
  const saved=await supabaseAdmin.from('review_module_scores').update({overrides,score:scorePercent(effectiveItems({...score,overrides})),revision:body.revision+1,updated_at:new Date().toISOString()}).eq('module_slug',body.slug).eq('user_id',body.user_id).eq('revision',body.revision).eq('status','ready').select('revision').maybeSingle()
  if(saved.error)throw saved.error;if(!saved.data)return json({error:'The score changed in another tab. Reload and try again.'},409)
  return json({saved:true})
 }
 return json({error:'Invalid action.'},400)
})
