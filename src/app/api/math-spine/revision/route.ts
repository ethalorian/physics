import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { teacherCanAccessStudent } from '@/lib/teacher-scope'
import { isRevisionOutcome } from '@/lib/math-student-view'
import { validateMathResponse } from '@/lib/math-response'

export const POST = withAuth(async (request, ctx) => {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  if (body.action !== undefined && body.action !== 'acknowledge') return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (typeof body.submission_id !== 'string' || !message || message.length > 2000) return NextResponse.json({ error: 'Include a response of 1–2000 characters.' }, { status: 400 })
  const { data: sub, error } = await supabaseAdmin.from('math_warmup_submissions').select('id,user_id,status,revision_requested,response_json').eq('id', body.submission_id).maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not load this work' }, { status: 503 })
  if (!sub) return NextResponse.json({ error: 'Work not found' }, { status: 404 })
  if (body.action === 'acknowledge') {
    if (!['admin','teacher'].includes(ctx.role) || ctx.viewingAsTeacher || !(await teacherCanAccessStudent(ctx.scopeEmail, sub.user_id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!isRevisionOutcome(body.next_step)) return NextResponse.json({ error: 'Choose what happens next.' }, { status: 400 })
    const saved = await supabaseAdmin.from('math_warmup_revisions').update({ status: 'acknowledged', next_step: body.next_step, teacher_reply: message, acknowledged_by: ctx.email, acknowledged_at: new Date().toISOString() }).eq('submission_id', sub.id).eq('status', 'pending').select('id')
    if (saved.error) return NextResponse.json({ error: 'Acknowledgment was not saved. Please retry.' }, { status: 503 })
    if (!saved.data?.length) return NextResponse.json({ error: 'This response has already been reviewed or is no longer available. Refresh before continuing.' }, { status: 409 })
    return NextResponse.json({ saved: true })
  }
  if (ctx.role !== 'student' || ctx.userId !== sub.user_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (sub.status !== 'reviewed') return NextResponse.json({ error: 'Wait for teacher review before responding to this work.' }, { status: 409 })
  if (!validateMathResponse(body.response_json)) return NextResponse.json({ error: 'Invalid response' }, { status: 400 })
  const saved = await supabaseAdmin.from('math_warmup_revisions').upsert({ submission_id: sub.id, user_id: ctx.userId, response_json: { ...body.response_json, needsGraph: sub.response_json?.needsGraph === true }, message, needs_help: body.needs_help === true }, { onConflict: 'submission_id', ignoreDuplicates: true }).select('id')
  if (saved.error) return NextResponse.json({ error: 'Response was not saved. Your draft is safe; please retry.' }, { status: 503 })
  return NextResponse.json({ saved: true })
})
