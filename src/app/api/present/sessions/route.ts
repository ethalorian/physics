import { currentLessonIds } from '@/lib/current-lesson-catalog-server'
import type { InlineQuestion } from '@/data/content-blocks'
import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { classPresentation, resolveClassLesson } from '@/lib/present-server'
import { resolveClassPlan } from '@/lib/course-plan-presentation-server'

type ResolvedPresentation = NonNullable<Awaited<ReturnType<typeof classPresentation>>>
function documentPayload(lesson: ResolvedPresentation | null) {
  return {deck:lesson?.deck??null,lesson:lesson?{id:lesson.id,title:lesson.title,content_blocks:lesson.content_blocks}:null,
    answerKeys:lesson?Object.fromEntries(lesson.original.blocks.filter(b=>b.type==='question'&&lesson.content_blocks.blocks.some(x=>x.id===b.id)).map(b=>[b.id,b.type==='question'?(b.question as InlineQuestion).correctOptionId:null])):{}}
}

// Course Plans is the default target; explicit legacy lesson sessions remain readable.
export const POST = withRole(['teacher','admin'],async(request,ctx)=>{
  const body=await request.json().catch(()=>({})) as {lesson_id?:string;course_id?:string;plan_unit_id?:string;plan_day?:number}
  const planRequested=body.plan_unit_id!==undefined||body.plan_day!==undefined
  if(!body.course_id || (planRequested&&body.lesson_id) || (!planRequested&&!body.lesson_id))return NextResponse.json({error:'Choose a class and one presentation target.'},{status:400})
  const result=planRequested
    ?await resolveClassPlan({plan_unit_id:body.plan_unit_id!,plan_day:body.plan_day!},body.course_id,ctx)
    :await resolveClassLesson(body.lesson_id!,body.course_id,ctx)
  if(!result.ok)return NextResponse.json({error:result.error},{status:result.status})
  const plan='plan' in result?result.plan:null
  const ended=await supabaseAdmin.from('present_sessions').update({status:'ended',updated_at:new Date().toISOString()}).eq('teacher_id',ctx.userId).eq('course_id',body.course_id).eq('status','live')
  if(ended.error)return NextResponse.json({error:'Could not finish the previous presentation. Please retry.'},{status:500})
  const {data,error}=await supabaseAdmin.from('present_sessions').insert({
    lesson_id:plan?null:body.lesson_id,course_id:body.course_id,teacher_id:ctx.userId,
    ...(plan?{plan_unit_id:plan.plan_unit_id,plan_day:plan.plan_day,plan_track:plan.plan_track}:{}),
  }).select('*').single()
  if(error||!data)return NextResponse.json({error:'Could not start the presentation.'},{status:500})
  return NextResponse.json({session:data,plan,...documentPayload(result.lesson)})
})

export const GET=withRole(['teacher','admin'],async(request,ctx)=>{
  const params=new URL(request.url).searchParams,lessonId=params.get('lesson_id'),courseId=params.get('course_id')
  const planRequested=params.has('plan_unit_id')||params.has('plan_day')
  const identityFields='id,lesson_id,course_id,plan_unit_id,plan_day,plan_track,current_slide,created_at,status'
  if(params.get('active')==='1'||(params.get('history')==='1'&&courseId)){
    let q=supabaseAdmin.from('present_sessions').select(identityFields).eq('teacher_id',ctx.userId)
    q=params.get('active')==='1'?q.eq('status','live'):q.eq('course_id',courseId!)
    const result=await q.order('created_at',{ascending:false}).limit(20)
    if(result.error)throw result.error
    const rows=result.data??[],currentIds=rows.some(s=>s.lesson_id)?await currentLessonIds():new Set<string>()
    return NextResponse.json({sessions:rows.filter(s=>s.plan_unit_id&&s.plan_day||currentIds.has(s.lesson_id))})
  }
  if(planRequested&&(!courseId||lessonId))return NextResponse.json({error:'Choose a class and one Course Plans day.'},{status:400})
  if(!planRequested&&!lessonId)return NextResponse.json({error:'Choose a presentation.'},{status:400})
  const planTarget={plan_unit_id:params.get('plan_unit_id')??'',plan_day:Number(params.get('plan_day'))}
  if(planRequested&&(!planTarget.plan_unit_id||!Number.isSafeInteger(planTarget.plan_day)||planTarget.plan_day<1))return NextResponse.json({error:'Choose a valid Course Plans day.'},{status:400})
  let query=supabaseAdmin.from('present_sessions').select('*').eq('teacher_id',ctx.userId).eq('status','live')
  query=planRequested?query.eq('plan_unit_id',planTarget.plan_unit_id).eq('plan_day',planTarget.plan_day).is('lesson_id',null):query.eq('lesson_id',lessonId!)
  if(courseId)query=query.eq('course_id',courseId)
  const {data,error}=await query.order('created_at',{ascending:false}).limit(1).maybeSingle()
  if(error)return NextResponse.json({error:'Could not check the live presentation.'},{status:503})
  const prepare=params.get('prepare')==='1'
  const result=courseId?(planRequested?await resolveClassPlan(planTarget,courseId,ctx,prepare?undefined:data?.plan_track):await resolveClassLesson(lessonId!,courseId,ctx)):null
  if(result&&!result.ok)return NextResponse.json({error:result.error},{status:result.status})
  const lesson=result?.ok?result.lesson:data?await classPresentation(data,ctx):null
  return NextResponse.json({session:prepare?null:lesson?data:null,plan:result?.ok&&'plan' in result?result.plan:null,...documentPayload(lesson)})
})
