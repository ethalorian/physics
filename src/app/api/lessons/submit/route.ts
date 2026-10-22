import { missingLessonAnswers, type SavedLessonAnswer } from '@/lib/lesson-completion'
import { readLessonRows } from '@/lib/lesson-completion-server'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { authorizeLesson } from '@/lib/lesson-access'
import { submissionStatus } from '@/lib/lesson-review'

export const GET = withAuth(async (request, ctx) => {
  const lessonId = new URL(request.url).searchParams.get('lesson_id')
  if (!lessonId) return NextResponse.json({ error: 'Missing lesson_id' }, { status: 400 })
  const access = await authorizeLesson(ctx, lessonId)
  if (!access.ok) return access.response
  return NextResponse.json(await submissionStatus(ctx.userId, lessonId))
})

export const POST = withAuth(async (request, ctx) => {
  const body = await request.json()
  if (body.expected_user_id && body.expected_user_id !== ctx.userId) return NextResponse.json({ error: 'Account changed. Reload before submitting.' }, { status: 409 })
  const lessonId = body.lesson_id
  if (!lessonId) return NextResponse.json({ error: 'Missing lesson_id' }, { status: 400 })
  const access = await authorizeLesson(ctx, lessonId, true)
  if (!access.ok) return access.response
  // A snapshot must never silently omit changed work. DB trigger repeats this check under the submission lock.
  const visibleIds = (access.document?.blocks ?? []).map((b) => b.id)
  if (visibleIds.length) {
    const { count, error } = await supabaseAdmin.from('block_drafts').select('block_id', { count: 'exact', head: true }).eq('user_id', ctx.userId).eq('lesson_id', lessonId).in('block_id', visibleIds)
    if (error) throw error
    if (count) return NextResponse.json({ error: 'Save your changed answers before submitting.' }, { status: 422 })
  }
  if (access.document?.presentation === 'physics-path' || access.document?.reflection) {
    const answers = await readLessonRows<SavedLessonAnswer>((from,to) => supabaseAdmin.from('block_responses').select('block_id,response,created_at').eq('user_id',ctx.userId).eq('lesson_id',lessonId).order('created_at').order('id').range(from,to))
    const missing = missingLessonAnswers(access.document.blocks,answers)
    if (missing.length) return NextResponse.json({ error: `Finish the ${missing.length} remaining required response${missing.length===1?'':'s'} before submitting. Your saved work is kept.`, missingBlockIds: missing.map(b=>b.id) }, {status:422})
  }
  // An atomic database trigger captures the document and latest explicit responses.
  const { data, error } = await supabaseAdmin.from('lesson_submissions')
    .insert({ user_id: ctx.userId, user_email: ctx.email, lesson_id: lessonId, content_snapshot: access.document }).select('id, submitted_at').single()
  if (error) {
    if (error.message.includes('locked') || error.message.includes('pending')) return NextResponse.json({ error: 'This lesson is already awaiting review.', ...(await submissionStatus(ctx.userId, lessonId)) }, { status: 409 })
    if (error.message.includes('draft')) return NextResponse.json({ error: 'Save your changed answers before submitting.' }, { status: 422 })
    throw error
  }
  // The submission itself remains authoritative if this display cache cannot update.
  if (access.document?.presentation === 'physics-path' || access.document?.reflection) {
    const result = await supabaseAdmin.from('lesson_progress').upsert({user_id:ctx.userId,user_email:ctx.email,lesson_id:lessonId,lesson_slug:access.lesson.slug,status:'completed',progress_percentage:100,completed_at:data.submitted_at,last_accessed_at:data.submitted_at},{onConflict:'user_id,lesson_id'})
    if(result.error) console.error('Could not update submitted lesson progress:',result.error)
  }
  return NextResponse.json({ submissionId: data.id, submittedAt: data.submitted_at, locked: true }, { status: 201 })
})
