import { after, NextResponse, type NextRequest } from 'next/server'
import { withRole, type AuthContext } from '@/lib/api-auth'
import { readingCourses } from '@/lib/textbook-assignments-server'
import { teacherCanAccessStudent } from '@/lib/teacher-scope'
import { supabaseAdmin } from '@/lib/supabase'
import { loadReview, row } from '@/lib/review-desk/sources'
import { validateDecision, type ReviewDocument } from '@/lib/review-desk/types'
import { reviewActions, performNativeAction, type NativeAction } from '@/lib/review-desk/native-actions'
import { suggestEvidence } from '@/lib/review-desk/suggestions'
export const maxDuration=180
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}})
export const GET=withRole(['teacher','admin'],async(request,ctx)=>{
 const p=request.nextUrl.searchParams,courseId=p.get('class')??''
 if(!(await readingCourses(ctx)).some(c=>c.id===courseId))return json({error:'Class unavailable.'},403)
 if(!p.get('assignment')){
  const [drafts,revisions]=await Promise.all([supabaseAdmin.from('review_desk_drafts').select('id,source_key,user_id,source_version,state,version').eq('course_id',courseId).eq('reviewer_email',ctx.scopeEmail).in('state',['draft','ready','releasing','returning']),supabaseAdmin.from('review_desk_revisions').select('id,source_key,user_id,source_version,requested_at,resubmitted_at,released_at').eq('course_id',courseId).is('released_at',null)])
  if(drafts.error)throw drafts.error;if(revisions.error)throw revisions.error
  return json({drafts:drafts.data,revisions:revisions.data})
 }
 try{
  const {doc}=await loadReview(ctx,courseId,p.get('assignment')??'',p.get('student')??'',p.get('submission')??undefined)
  const suggestions=await row('review_desk_suggestions',{source_key:doc.activity.key,user_id:doc.userId,source_version:doc.version})
  if(doc.evidence.length&&!ctx.viewingAsTeacher&&!ctx.session.experience&&(!suggestions||suggestions.status==='queued'||suggestions.status==='processing'&&Date.parse(suggestions.lease_until)<Date.now()))after(()=>suggestEvidence(doc))
  return json({document:doc,suggestions,readOnly:ctx.viewingAsTeacher||!!ctx.session.experience})
 }catch(e){if(e instanceof Error)return json({error:e.message},409);throw e}
})
async function publish(request:NextRequest,ctx:AuthContext,id:string,version:number,returning:boolean){
 const saved=await row('review_desk_drafts',{id,reviewer_email:ctx.scopeEmail})
 if(!saved||!(await readingCourses(ctx)).some(c=>c.id===saved.course_id)||!await teacherCanAccessStudent(ctx.scopeEmail,saved.user_id))throw Error('Saved review unavailable.')
 const finalState=returning?'returned':'released',working=returning?'returning':'releasing'
 if(saved.state===finalState)return {saved:true,state:finalState}
 if(saved.version!==version)throw Error('This review changed in another tab. Reload before releasing.')
 if(saved.lease_until&&Date.parse(saved.lease_until)>Date.now())throw Error('This review is already being saved. Wait a moment, then refresh.')
 let actions=saved.release_plan as NativeAction[]|null,snapshot=saved.review_snapshot as ReviewDocument|null
 if(saved.state!==working){
  if(saved.state!=='ready'&&!returning)throw Error('Mark this review ready before release.')
  if(!['draft','ready'].includes(saved.state))throw Error('This review has already changed state.')
  const source=await loadReview(ctx,saved.course_id,saved.source_key,saved.user_id,snapshot?.submissionId)
  if(source.doc.version!==saved.source_version||source.doc.reviewVersion!==snapshot?.reviewVersion)throw Error('Newer work is available. Review that attempt before release.')
  const decision=validateDecision(source.doc,saved.payload,!returning)
  if(returning&&!decision.note.trim())throw Error('Add a specific next step before requesting revision.')
  actions=reviewActions(source,decision,saved.request_id,returning);snapshot=source.doc
 }
 if(!actions?.length||!snapshot)throw Error('No review action is available.')
 const locked=await supabaseAdmin.from('review_desk_drafts').update({state:working,release_plan:actions,review_snapshot:snapshot,lease_until:new Date(Date.now()+180000).toISOString(),updated_at:new Date().toISOString()}).eq('id',id).eq('version',version).eq('state',saved.state).or('lease_until.is.null,lease_until.lt.'+new Date().toISOString()).select('id').maybeSingle()
 if(locked.error)throw locked.error;if(!locked.data)throw Error('Another review operation started. Refresh before continuing.')
 const done:number[]=saved.completed_actions??[]
 try{
  for(let index=0;index<actions.length;index++){
   if(done.includes(index))continue
   await performNativeAction(request,actions[index],ctx.email);done.push(index)
   const progress=await supabaseAdmin.from('review_desk_drafts').update({completed_actions:done}).eq('id',id).eq('state',working);if(progress.error)throw progress.error
  }
  if(returning){
   const revision=await supabaseAdmin.from('review_desk_revisions').upsert({course_id:saved.course_id,source_key:saved.source_key,user_id:saved.user_id,source_version:saved.source_version,reviewer_email:ctx.scopeEmail,feedback:saved.payload.note,evidence:snapshot.evidence.map(e=>({...e,...(saved.payload.feedback[e.id]?{teacherFeedback:saved.payload.feedback[e.id]}:{})}))},{onConflict:'source_key,user_id,source_version',ignoreDuplicates:true});if(revision.error)throw revision.error
  }else{
   const revision=await supabaseAdmin.from('review_desk_revisions').update({released_at:new Date().toISOString()}).eq('source_key',saved.source_key).eq('user_id',saved.user_id).is('released_at',null);if(revision.error)throw revision.error
  }
  const finished=await supabaseAdmin.from('review_desk_drafts').update({state:finalState,lease_until:null,updated_at:new Date().toISOString()}).eq('id',id).eq('state',working);if(finished.error)throw finished.error
  return {saved:true,state:finalState}
 }catch(e){await supabaseAdmin.from('review_desk_drafts').update({lease_until:null}).eq('id',id).eq('state',working);throw e}
}
export const POST=withRole(['teacher','admin'],async(request,ctx)=>{
 if(request.headers.get('origin')!==request.nextUrl.origin||ctx.viewingAsTeacher)return json({error:'Use your own teacher account to save reviews.'},403)
 const b=await request.json().catch(()=>null)
 if(!b||typeof b!=='object')return json({error:'Invalid review.'},400)
 try{
  if(b.action==='release'||b.action==='return'){
   if(typeof b.id!=='string'||!Number.isInteger(b.version))return json({error:'Reload the saved review.'},400)
   return json(await publish(request,ctx,b.id,b.version,b.action==='return'))
  }
  if(!['save','suggest'].includes(b.action)||![b.classId,b.assignment,b.student].every(x=>typeof x==='string'&&x.length>0&&x.length<240))return json({error:'Choose an assignment and student.'},400)
  const {doc}=await loadReview(ctx,b.classId,b.assignment,b.student,b.submissionId)
  if(b.action==='suggest'){after(()=>suggestEvidence(doc,true));return json({queued:true})}
  if(b.sourceVersion!==doc.version||b.reviewVersion!==doc.reviewVersion||!Number.isInteger(b.version)||b.version<0)return json({error:'The submission changed. Reload before saving.'},409)
  const payload=validateDecision(doc,b.payload,b.ready===true),state=b.ready===true?'ready':'draft'
  const existing=await row('review_desk_drafts',{source_key:b.assignment,user_id:b.student,source_version:doc.version,reviewer_email:ctx.scopeEmail})
  if(existing?.version!==b.version&&!(b.version===0&&!existing))return json({error:'This draft changed in another tab. Reload before saving.'},409)
  if(existing&&!['draft','ready'].includes(existing.state))return json({error:'This review has already been released or is being saved.'},409)
  const values={payload,state,version:b.version+1,review_snapshot:doc,updated_at:new Date().toISOString()}
  const result=existing?await supabaseAdmin.from('review_desk_drafts').update(values).eq('id',existing.id).eq('version',b.version).in('state',['draft','ready']).select('id,version,state,payload,request_id').maybeSingle():await supabaseAdmin.from('review_desk_drafts').insert({...values,source_key:b.assignment,user_id:b.student,source_version:doc.version,reviewer_email:ctx.scopeEmail,course_id:b.classId}).select('id,version,state,payload,request_id').single()
  if(result.error){if(result.error.code==='23505')return json({error:'Another draft was saved. Reload before continuing.'},409);throw result.error}if(!result.data)return json({error:'This draft changed. Reload before continuing.'},409)
  return json({draft:result.data})
 }catch(e){if(e instanceof Error)return json({error:e.message},409);throw e}
})
