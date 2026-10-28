import {NextResponse} from 'next/server'
import {withAuth} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {accessibleAssignment,privateHeaders} from '@/lib/interactive-assignments/server'
import {missingDailyLessons} from '@/lib/interactive-assignments/foundations/sequence-server'
export const GET=withAuth<{id:string}>(async(_req,ctx)=>{
 const {id}=await ctx.params,a=await accessibleAssignment(ctx,id)
 if(!a)return NextResponse.json({error:'Assignment unavailable.'},{status:404,headers:privateHeaders})
 const b=await supabaseAdmin.from('daily_lesson_sequences').select('foundation_id,review_id,quiz_id').eq('course_id',a.course_id).or(`foundation_id.eq.${id},review_id.eq.${id}`).maybeSingle();if(b.error)throw b.error
 if(!b.data)return NextResponse.json({sequence:null},{headers:privateHeaders})
 const q=await supabaseAdmin.from('quiz_assignments').select('status,deleted_at').eq('id',b.data.quiz_id).single();if(q.error)throw q.error
 const missing=ctx.role==='student'?await missingDailyLessons([b.data.quiz_id],ctx.userId):[]
 return NextResponse.json({sequence:{...b.data,missing,quizAvailable:q.data.status==='published'&&!q.data.deleted_at}},{headers:privateHeaders})
})
