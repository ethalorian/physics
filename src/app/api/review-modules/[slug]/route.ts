import {checkRevisionBeforeSubmit,recordRevisionSubmitted} from '@/lib/review-desk/revision-server'
import { NextResponse,after } from 'next/server'
import { suggestAfterSubmission } from '@/lib/assessment-results/suggestions-server'
import { queueReviewScores,processReviewScore } from '@/lib/review-modules/grading-server'
export const maxDuration=180
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { checkReviewCode, getReview, privateHeaders, reviewHtml, reviewManifest } from '@/lib/review-modules/server'
import { emptyReviewState, missingReviewFields, validateReviewState } from '@/lib/review-modules/state'

const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:privateHeaders})
export const GET=withAuth<{slug:string}>(async (_request,ctx)=>{
 const {slug}=await ctx.params, r=await getReview(ctx,slug)
 if(!r)return json({error:'This review is not assigned to your class.'},404)
 const unlocked=r.staff||r.work?.unlocked_version===r.assignment.code_version
 if(!unlocked)return json({title:r.assignment.title,due_on:r.assignment.due_on,closes_at:r.assignment.closes_at,locked:true})
 return json({title:r.assignment.title,due_on:r.assignment.due_on,closes_at:r.assignment.closes_at,locked:false,staff:r.staff,work:r.work??{state:emptyReviewState(),version:0,status:'draft'},manifest:await reviewManifest(slug),html:await reviewHtml(slug)})
})
export const POST=withAuth<{slug:string}>(async(request,ctx)=>{
 if(request.headers.get('origin')!==request.nextUrl.origin)return json({error:'Reload this page before continuing.'},403)
 if(Number(request.headers.get('content-length')??0)>200000)return json({error:'Response is too large.'},413)
 const {slug}=await ctx.params,r=await getReview(ctx,slug)
 if(!r)return json({error:'This review is not assigned to your class.'},404)
 const body=await request.json().catch(()=>null)
 if(!body)return json({error:'Invalid request.'},400)
 if(r.staff)return json({error:'Teacher preview does not save student work.'},403)
 if(body.action==='unlock'){
  if(typeof body.code!=='string'||body.code.length>80)return json({error:'Enter the code from your teacher.'},400)
  const attempt=await supabaseAdmin.rpc('consume_review_module_attempt',{p_user:ctx.userId,p_slug:slug})
  if(attempt.error)throw attempt.error
  if(!attempt.data)return json({error:'Too many attempts. Wait 10 minutes, then try again.'},429)
  if(!checkReviewCode(body.code,r.assignment))return json({error:'That code does not match this review. Check with your teacher.'},403)
  const saved=await supabaseAdmin.rpc('unlock_review_module',{p_user:ctx.userId,p_slug:slug,p_version:r.assignment.code_version})
  if(saved.error)throw saved.error
  return json({unlocked:true})
 }
 if(r.work?.unlocked_version!==r.assignment.code_version)return json({error:'Enter your teacher’s current code to continue.'},403)
 if(!['save','submit'].includes(body.action)||!Number.isInteger(body.version))return json({error:'Invalid action.'},400)
 const manifest=await reviewManifest(slug)
 if(!validateReviewState(body.state,manifest))return json({error:'Some answers could not be saved. Check their length and retry.'},400)
 if(body.action==='submit'){
  const missing=missingReviewFields(body.state,manifest)
  if(missing.length)return json({error:`Complete ${missing.length} remaining response${missing.length===1?'':'s'} before submitting.`,missing},400)
 }
 if(body.action==='submit'){const message=await checkRevisionBeforeSubmit('review:'+slug,ctx.userId);if(message)return json({error:message},422)}
 if(r.work.status==='submitted')return json({error:'This work is already submitted. Ask your teacher to reopen it if you need to change it.'},409)
 const {data,error}=await supabaseAdmin.from('review_module_work').update({state:body.state,status:body.action==='submit'?'submitted':'draft',submitted_at:body.action==='submit'?new Date().toISOString():null,updated_at:new Date().toISOString(),version:body.version+1}).eq('module_slug',slug).eq('user_id',ctx.userId).eq('version',body.version).eq('status','draft').eq('unlocked_version',r.assignment.code_version).select('version,status,submitted_at').maybeSingle()
 if(error)throw error
 if(!data)return json({error:'This assignment changed in another tab. Keep this page open, copy any unsaved responses, and reload before continuing.'},409)
 if(body.action==='submit')await recordRevisionSubmitted('review:'+slug,ctx.userId)
 if(body.action==='submit')suggestAfterSubmission('review',slug+':'+ctx.userId)
 if(body.action==='submit')after(async()=>{try{await queueReviewScores([slug],[ctx.userId]);await processReviewScore([slug],[ctx.userId])}catch{console.warn('[review-grading] Automatic scoring could not finish; teacher can resume from dashboard.')}})
 return json(data)
})
