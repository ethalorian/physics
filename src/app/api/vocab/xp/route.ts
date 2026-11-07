import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { accessVocabTask } from '@/lib/vocab-access'
import { UUID } from '@/lib/vocab-learning'
import { supabaseAdmin } from '@/lib/supabase'
import { VOCAB_ASSIGNMENT_XP } from '@/lib/xp-policy'
import { MASTERY_WORK_XP } from '@/lib/assigned-mastery-xp'
import { assignmentXpReceipt } from '@/lib/assignment-xp-receipt-server'

export const GET = withAuth(async (req, ctx) => {
  const id = new URL(req.url).searchParams.get('task_id') ?? ''
  if (!UUID.test(id)) return NextResponse.json({ error: 'Choose an assignment.' }, { status: 400 })
  const task = await accessVocabTask(id, ctx)
  if (!task) return NextResponse.json({ error: 'Assignment unavailable.' }, { status: 403 })
  const course=await supabaseAdmin.from('courses').select('program').eq('id',task.course_id).single()
  if(course.error)throw course.error
  const physics=course.data.program==='physics'
  const quiz=task.task_kind==='quiz'||task.quiz_format==='checkpoint'
  if(ctx.realRole!=='student'){
    const active=physics?await supabaseAdmin.from('mastery_xp_courses').select('course_id').eq('course_id',task.course_id).maybeSingle():null
    if(active?.error)throw active.error
    return NextResponse.json({preview:true,available:active?.data?(quiz||!task.target_id?0:MASTERY_WORK_XP):VOCAB_ASSIGNMENT_XP})
  }
  const receipt=await assignmentXpReceipt('vocabulary',id,ctx.userId,task.course_id,physics,VOCAB_ASSIGNMENT_XP)
  if(receipt.earned===null)return NextResponse.json({error:'XP receipt unavailable.'},{status:503})
  return NextResponse.json(receipt,{headers:{'Cache-Control':'private, no-store'}})
})
