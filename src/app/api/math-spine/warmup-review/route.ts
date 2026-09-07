import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { recordMathObservation } from '@/lib/math-spine-server'
import { teacherCanAccessStudent } from '@/lib/teacher-scope'

export const POST = withAuth(async (request, ctx) => {
  if (!['teacher', 'admin'].includes(ctx.role) || ctx.viewingAsTeacher) return NextResponse.json({ error: 'Only the teacher of record can review work' }, { status: 403 })
  const body = await request.json()
  const level = body.level ?? null
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const revision = body.request_revision === true
  if (typeof body.submission_id !== 'string' || (level !== null && ![1, 2, 3].includes(level)) || (level === null && !revision) || (revision && !message) || message.length > 2000) return NextResponse.json({ error: 'Choose a rating, or request more evidence with a next step (2000 characters maximum).' }, { status: 400 })
  const { data: sub, error } = await supabaseAdmin.from('math_warmup_submissions').select('id,user_id,user_email,competency_id').eq('id', body.submission_id).maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not load this submission' }, { status: 503 })
  if (!sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  if (!(await teacherCanAccessStudent(ctx.scopeEmail, sub.user_id))) return NextResponse.json({ error: 'Student not on your roster' }, { status: 403 })
  const saved = await supabaseAdmin.rpc('review_math_warmup', { p_submission: sub.id, p_teacher: ctx.email, p_level: level, p_message: message, p_revision: revision })
  if (saved.error) return NextResponse.json({ error: 'Review was not saved. Your draft is safe; please retry.' }, { status: 503 })
  const result = await recordMathObservation({ userId: sub.user_id, userEmail: sub.user_email, competencyId: sub.competency_id, level: level ?? 1, existingSubmissionId: sub.id })
  return NextResponse.json({ ...saved.data, awarded: result.awarded })
})
