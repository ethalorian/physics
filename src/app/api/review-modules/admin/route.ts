import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { reviewDashboardScope } from '@/lib/review-modules/dashboard-server'
import { practiceSignals,reviewCriteria,TOPICS } from '@/lib/review-modules/rubric-server'
import { reviewModel } from '@/lib/review-modules/grading-server'
import { getTeacherStudentGids } from '@/lib/teacher-scope'
import { canAccessReview, hashReviewCode, privateHeaders, reviewManifest } from '@/lib/review-modules/server'

const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:privateHeaders})
export const GET=withRole(['teacher','admin'],async (_request,ctx)=>{
 const scope=await reviewDashboardScope(ctx)
 const slugs=scope.assignments.map(a=>a.slug)
 const [work,scores,courses]=await Promise.all([
  scope.users.length?supabaseAdmin.from('review_module_work').select('*,students(name,email)').in('module_slug',slugs).in('user_id',scope.users).order('updated_at',{ascending:false}):{data:[],error:null},
  scope.users.length?supabaseAdmin.from('review_module_scores').select('module_slug,user_id,work_version,work_status,response_snapshot,rubric_version,status,result,overrides,score,model,error,revision,graded_at,lease_until,attempts').in('module_slug',slugs).in('user_id',scope.users):{data:[],error:null},
  scope.courseIds.length?supabaseAdmin.from('courses').select('id,name,section').in('id',scope.courseIds):{data:[],error:null}
 ])
 if(work.error)throw work.error;if(scores.error)throw scores.error;if(courses.error)throw courses.error
 return json({assignments:await Promise.all(scope.assignments.map(async a=>({slug:a.slug,title:a.title,version:a.code_version,course_ids:a.course_ids,manifest:await reviewManifest(a.slug),criteria:reviewCriteria(a.slug),topics:TOPICS.filter(t=>a.slug==='unit-1-honors'||t.id!=='honors')}))),work:(work.data??[]).map(w=>({...w,practice:practiceSignals(w.state)})),scores:scores.data??[],roster:scope.roster,courses:courses.data??[],claude:{configured:!!process.env.ANTHROPIC_API_KEY,model:reviewModel()}})
})
export const POST=withRole(['teacher','admin'],async(request,ctx)=>{
 if(request.headers.get('origin')!==request.nextUrl.origin)return json({error:'Reload and try again.'},403)
 const body=await request.json().catch(()=>null)
 if(!body||typeof body.slug!=='string')return json({error:'Choose a review.'},400)
 const {data:a,error}=await supabaseAdmin.from('review_module_assignments').select('*').eq('slug',body.slug).maybeSingle()
 if(error)throw error
 if(!a||!await canAccessReview(ctx,a))return json({error:'Forbidden'},403)
 if(body.action==='code'){
  if(typeof body.code!=='string'||!/^[A-Za-z0-9-]{8,40}$/.test(body.code))return json({error:'Use 8–40 letters, numbers, or hyphens.'},400)
  if(!Number.isInteger(body.version))return json({error:'Reload and try again.'},400)
  const saved=await supabaseAdmin.from('review_module_assignments').update({...hashReviewCode(body.code),code_version:body.version+1}).eq('slug',a.slug).eq('code_version',body.version).select('slug').maybeSingle()
  if(saved.error)throw saved.error
  if(!saved.data)return json({error:'The code changed in another tab. Reload and try again.'},409)
  return json({saved:true})
 }
 if(body.action==='reopen'&&typeof body.user_id==='string'){
  if(!Number.isInteger(body.version)||body.version<0)return json({error:'Reload and try again.'},400)
  if(ctx.role==='teacher'&&!(await getTeacherStudentGids(ctx.scopeEmail)).includes(body.user_id))return json({error:'Forbidden'},403)
  const saved=await supabaseAdmin.from('review_module_work').update({status:'draft',version:body.version+1,updated_at:new Date().toISOString()}).eq('module_slug',a.slug).eq('user_id',body.user_id).eq('version',body.version).eq('status','submitted').select('version').maybeSingle()
  if(saved.error)throw saved.error
  if(!saved.data)return json({error:'This work changed. Reload and try again.'},409)
  return json({saved:true})
 }
 return json({error:'Invalid action.'},400)
})
