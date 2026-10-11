import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { classPresentation } from '@/lib/present-server'
export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
  const params = new URL(request.url).searchParams
  const { data: session } = await supabaseAdmin.from('present_sessions').select('teacher_id, lesson_id, course_id, plan_unit_id, plan_day, plan_track').eq('id', params.get('session_id') ?? '').maybeSingle()
  if (!session || (params.has('lesson_id') && session.lesson_id !== params.get('lesson_id')) || !session.course_id || (ctx.role !== 'admin' && session.teacher_id !== ctx.userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const lesson = await classPresentation(session, ctx)
  if (!lesson) return NextResponse.json({ error: 'Class presentation unavailable' }, { status: 403 })
  return NextResponse.json({ lesson: { id: lesson.id, title: lesson.title, content_blocks: lesson.content_blocks }, deck: lesson.deck })
})
