import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { targetIdsForLesson } from '@/lib/lesson-targets'

// Lesson turn-in. Block saves are drafts; submitting is the explicit act that
// puts the student in the teacher's grading queue.
//
// LOCKED UNTIL GRADED: once a student submits, the lesson is locked — they can't
// re-submit until the teacher has acted on it (a mastery rating on the lesson's
// target, dated after the submission). This stops re-submit spam and keeps the
// queue honest. The app asserts no grades — mastery ratings are the only
// teacher act it recognizes; legacy gradebook scores still count for old work.
// A lesson with NO mapped target (e.g. transfer-task days, scored on paper)
// never locks — there is nothing in-app for the teacher to rate.
//
//   GET  ?lesson_id=… → { submittedAt, locked }
//   POST { lesson_id } → record a submission (409 if a pending one is locked)

// Has the teacher acted on this lesson since `sinceISO`? (rating on a mapped
// target, or a gradebook score for the lesson.)
async function gradedSince(userId: string, lessonId: string, sinceISO: string): Promise<boolean> {
  const targetIds = await targetIdsForLesson(lessonId) // owned ∪ referenced in blocks
  if (targetIds.length === 0) return true // nothing rateable in-app — never lock
  if (targetIds.length > 0) {
    const { data: recs } = await supabaseAdmin
      .from('mastery_records')
      .select('id')
      .eq('user_id', userId)
      .in('target_id', targetIds)
      .gt('observed_at', sinceISO)
      .limit(1)
    if ((recs ?? []).length > 0) return true
  }
  const { data: gb } = await supabaseAdmin
    .from('gradebook_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('item_type', 'lesson')
    .eq('item_id', lessonId)
    .gt('graded_at', sinceISO)
    .limit(1)
  return (gb ?? []).length > 0
}

async function latestSubmission(userId: string, lessonId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('lesson_submissions')
    .select('submitted_at')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .order('submitted_at', { ascending: false })
    .limit(1)
  return data?.[0]?.submitted_at ?? null
}

export const GET = withAuth(async (request, ctx) => {
  const lessonId = new URL(request.url).searchParams.get('lesson_id')
  if (!lessonId) return NextResponse.json({ error: 'Missing lesson_id' }, { status: 400 })
  const submittedAt = await latestSubmission(ctx.userId, lessonId)
  const locked = submittedAt ? !(await gradedSince(ctx.userId, lessonId, submittedAt)) : false
  return NextResponse.json({ submittedAt, locked })
})

export const POST = withAuth(async (request, ctx) => {
  const body = await request.json()
  const lessonId = body.lesson_id
  if (!lessonId) return NextResponse.json({ error: 'Missing lesson_id' }, { status: 400 })

  // Locked until graded: block a second submission while one is still pending review.
  const prev = await latestSubmission(ctx.userId, lessonId)
  if (prev && !(await gradedSince(ctx.userId, lessonId, prev))) {
    return NextResponse.json({ error: 'Already submitted — waiting for your teacher to review.', locked: true, submittedAt: prev }, { status: 409 })
  }

  const { data, error } = await supabaseAdmin
    .from('lesson_submissions')
    .insert({ user_id: ctx.userId, user_email: ctx.email, lesson_id: lessonId })
    .select('submitted_at')
    .single()
  if (error) {
    console.error('Error submitting lesson:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ submittedAt: data.submitted_at, locked: true }, { status: 201 })
})
