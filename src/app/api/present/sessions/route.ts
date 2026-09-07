import type { InlineQuestion } from '@/data/content-blocks'
import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { classLesson } from '@/lib/present-server'

// POST /api/present/sessions { lesson_id, course_id? }
// P-3 · start a live presentation for a lesson. Any earlier live session by this
// teacher for the same lesson is ended first, so students only ever see one.
export const POST = withRole(['teacher', 'admin'], async (request, ctx) => {
  const body = (await request.json().catch(() => ({}))) as { lesson_id?: string; course_id?: string | null }
  if (!body.lesson_id || !body.course_id) return NextResponse.json({ error: 'lesson_id and course_id required' }, { status: 400 })

  const lesson = await classLesson(body.lesson_id, body.course_id!, ctx)
  if (!lesson) return NextResponse.json({ error: 'Class or lesson unavailable' }, { status: 403 })

  await supabaseAdmin.from('present_sessions').update({ status: 'ended', updated_at: new Date().toISOString() })
    .eq('teacher_id', ctx.userId).eq('course_id', body.course_id).eq('status', 'live')

  const { data, error } = await supabaseAdmin.from('present_sessions')
    .insert({ lesson_id: body.lesson_id, course_id: body.course_id ?? null, teacher_id: ctx.userId })
    .select('*').single()
  if (error || !data) return NextResponse.json({ error: 'Could not start' }, { status: 500 })
  return NextResponse.json({ session: data, deck: lesson.deck, lesson: { id: lesson.id, title: lesson.title, content_blocks: lesson.content_blocks }, answerKeys: Object.fromEntries(lesson.original.blocks.filter(b => b.type === 'question' && lesson.content_blocks.blocks.some(x => x.id === b.id)).map(b => [b.id, b.type === 'question' ? (b.question as InlineQuestion).correctOptionId : null])) })
})

// GET /api/present/sessions?lesson_id=… — this teacher's live session for a lesson (or null).
export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
  const lessonId = new URL(request.url).searchParams.get('lesson_id')
  if (!lessonId) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })
  const { data } = await supabaseAdmin.from('present_sessions').select('*')
    .eq('teacher_id', ctx.userId).eq('lesson_id', lessonId).eq('status', 'live')
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  const lesson = data?.course_id ? await classLesson(lessonId, data.course_id, ctx) : null
  return NextResponse.json({ session: lesson ? data : null, deck: lesson?.deck ?? null, lesson: lesson ? { id: lesson.id, title: lesson.title, content_blocks: lesson.content_blocks } : null, answerKeys: lesson ? Object.fromEntries(lesson.original.blocks.filter(b => b.type === 'question' && lesson.content_blocks.blocks.some(x => x.id === b.id)).map(b => [b.id, b.type === 'question' ? (b.question as InlineQuestion).correctOptionId : null])) : {} })
})
