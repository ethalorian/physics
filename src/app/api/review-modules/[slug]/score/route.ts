import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getReview,privateHeaders } from '@/lib/review-modules/server'
import { responseKey,effectiveItems,type ReviewScore } from '@/lib/review-modules/analytics'
export const GET=withAuth<{slug:string}>(async(_req,ctx)=>{
 const {slug}=await ctx.params,r=await getReview(ctx,slug)
 if(!r||r.staff||r.work?.status!=='submitted'||r.work.unlocked_version!==r.assignment.code_version)return NextResponse.json({score:null},{headers:privateHeaders})
 const {data,error}=await supabaseAdmin.from('review_module_scores').select('*').eq('module_slug',slug).eq('user_id',ctx.userId).maybeSingle();if(error)throw error
 const grade=data as ReviewScore|null,current=grade&&grade.work_status==='submitted'&&responseKey(grade.response_snapshot)===responseKey(r.work.state.responses)
 return NextResponse.json({score:current&&grade.status==='ready'&&grade.released_at?{percent:grade.score,summary:grade.released_review?.summary??grade.result?.summary,next_step:grade.released_review?.next_step??grade.result?.next_step,items:effectiveItems(grade).map(({id,score,feedback,overridden})=>({id,score,feedback:grade.released_review?(grade.released_review.feedback[id]??''):feedback,overridden})),graded_at:grade.graded_at}:null,status:current&&grade.status==='ready'&&!grade.released_at?'awaiting_review':current?grade.status:'queued'},{headers:privateHeaders})
})
