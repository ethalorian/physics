import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/present/sessions { lesson_id, course_id? }
// P-3 · start a live presentation for a lesson. Any earlier live session by this
// teacher for the same lesson is ended first, so students only ever see one.
export const POST = withRole(['teacher', 'admin'], async (request, ctx) => {
  const body = (await request.json().catch(() => ({}))) as { lesson_id?: string; course_id?: string | null }
  if (!body.lesson_id) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })

  await supabaseAdmin.from('present_sessions').update({ status: 'ended', updated_at: new Date().toISOString() })
    .eq('teacher_id', ctx.userId).eq('lesson_id', body.lesson_id).eq('status', 'live')

  const { data, error } = await supabaseAdmin.from('present_sessions')
    .insert({ lesson_id: body.lesson_id, course_id: body.course_id ?? null, teacher_id: ctx.userId })
    .select('*').single()
  if (error || !data) return NextResponse.json({ error: 'Could not start' }, { status: 500 })
  return NextResponse.json({ session: data })
})

// GET /api/present/sessions?lesson_id=… — this teacher's live session for a lesson (or null).
export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
  const lessonId = new URL(request.url).searchParams.get('lesson_id')
  if (!lessonId) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })
  const { data } = await supabaseAdmin.from('present_sessions').select('*')
    .eq('teacher_id', ctx.userId).eq('lesson_id', lessonId).eq('status', 'live')
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  return NextResponse.json({ session: data ?? null })
})
