import { lessonsByTarget, targetIdsForLesson } from '@/lib/lesson-targets'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { teacherCanAccessStudent } from '@/lib/teacher-scope'

// Reviewing is an explicit acknowledgement; it never creates a mastery score.
export const POST = withAuth(async (request, ctx) => {
  if (ctx.role !== 'teacher' && ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  const isEvidence = typeof body.response_id === 'string'
  const id = isEvidence ? body.response_id : body.submission_id
  if (typeof id !== 'string' || !id) return NextResponse.json({ error: 'A submission_id or response_id is required.' }, { status: 400 })
  const { data: row, error } = await supabaseAdmin.from(isEvidence ? 'block_responses' : 'lesson_submissions').select('id, user_id, lesson_id').eq('id', id).maybeSingle()
  if (error) throw error
  if (!row) return NextResponse.json({ error: 'Work not found' }, { status: 404 })
  if (!(await teacherCanAccessStudent(ctx.scopeEmail, row.user_id))) return NextResponse.json({ error: 'Only the teacher of record may review this work.' }, { status: 403 })
  if (body.action === 'link') {
    if (!isEvidence) return NextResponse.json({ error: 'Only individual evidence attribution can be repaired.' }, { status: 400 })
    const lessonId = typeof body.lesson_id === 'string' && body.lesson_id ? body.lesson_id : row.lesson_id
    const targetId = typeof body.target_id === 'string' && body.target_id ? body.target_id : null
    if (!lessonId && !targetId) return NextResponse.json({ error: 'Choose a lesson or learning target.' }, { status: 400 })
    if (row.lesson_id && lessonId !== row.lesson_id) return NextResponse.json({ error: 'Evidence already belongs to a lesson. Its original lesson cannot be changed.' }, { status: 422 })
    if (lessonId) {
      const { data: lesson, error } = await supabaseAdmin.from('lessons').select('id').eq('id', lessonId).maybeSingle()
      if (error) throw error
      if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }
    if (targetId) {
      const { data: target, error } = await supabaseAdmin.from('learning_targets').select('id').eq('id', targetId).maybeSingle()
      if (error) throw error
      if (!target || (lessonId && !(await targetIdsForLesson(lessonId)).includes(targetId))) return NextResponse.json({ error: 'Choose a target used by this lesson.' }, { status: 422 })
    }
    const { error: linkError } = await supabaseAdmin.from('lesson_evidence_links').upsert({ response_id: row.id, lesson_id: lessonId, target_id: targetId, linked_by: ctx.scopeEmail, linked_at: new Date().toISOString() }, { onConflict: 'response_id' })
    if (linkError) throw linkError
    return NextResponse.json({ linked: true })
  }
  const { error: reviewError } = isEvidence
    ? await supabaseAdmin.from('lesson_evidence_reviews').upsert({ response_id: row.id, reviewer_email: ctx.scopeEmail }, { onConflict: 'response_id', ignoreDuplicates: true })
    : await supabaseAdmin.from('lesson_reviews').upsert({ submission_id: row.id, user_id: row.user_id, lesson_id: row.lesson_id, reviewer_email: ctx.scopeEmail }, { onConflict: 'submission_id', ignoreDuplicates: true })
  if (reviewError) throw reviewError
  return NextResponse.json({ reviewed: true })
})

// The repair picker only returns identifiers and authored labels, never student records.
export const GET = withAuth(async (request, ctx) => {
  if (ctx.role !== 'teacher' && ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const unitId = new URL(request.url).searchParams.get('unit_id')
  if (!unitId) return NextResponse.json({ error: 'unit_id required' }, { status: 400 })
  const [{ data: lessons, error: lessonError }, { data: targets, error: targetError }] = await Promise.all([
    supabaseAdmin.from('lessons').select('id, title, content_blocks').eq('unit_id', unitId),
    supabaseAdmin.from('learning_targets').select('id, slug, statement, lesson_id').eq('unit_id', unitId),
  ])
  if (lessonError) throw lessonError
  if (targetError) throw targetError
  const carriers = lessonsByTarget(lessons ?? [], targets ?? [])
  return NextResponse.json({ lessons: (lessons ?? []).map((l) => ({ id: l.id, title: l.title })), targets: (targets ?? []).map((t) => ({ id: t.id, statement: t.statement, lessonIds: carriers.get(t.id) ?? [] })) })
})
