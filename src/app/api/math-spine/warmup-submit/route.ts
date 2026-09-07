import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAnswerWithMode } from '@/lib/math-answer-check'
import { hasMathWork, summarizeMathResponse, validateMathResponse } from '@/lib/math-response'
import { matchSlip, type Slip } from '@/lib/math-misconceptions'
import type { ItemTemplate } from '@/lib/math-item-template'

export const POST = withAuth(async (request, ctx) => {
  if (ctx.role !== 'student') return NextResponse.json({ error: 'Student submissions only' }, { status: 403 })
  const body = await request.json()
  if (typeof body.instance_id !== 'string' || !validateMathResponse(body.response_json)) return NextResponse.json({ error: 'Reload the task and enter valid work before submitting.' }, { status: 400 })
  const { data: instance, error } = await supabaseAdmin.from('math_warmup_instances').select('id,item,checking').eq('id', body.instance_id).eq('user_id', ctx.userId).maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not load the task. Please retry.' }, { status: 503 })
  if (!instance) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  const r = { ...body.response_json, needsGraph: instance.item.needsGraph === true }
  const workShown = hasMathWork(r)
  const answer = r.answer?.trim() ?? ''
  const check = instance.checking
  const teacherOnly = check.mode === 'teacher-only'
  if (teacherOnly ? !workShown && !answer : !workShown || !answer) return NextResponse.json({ error: 'Enter your answer and show your reasoning in text or on the board.' }, { status: 400 })
  const selfCheck = teacherOnly ? null : checkAnswerWithMode(answer, check.key, check.mode)
  const feedback = selfCheck === 'mismatch' ? matchSlip(answer, check.slips as Slip[], check.template as ItemTemplate, check.values, check.mode, check.fallback) : null
  const saved = await supabaseAdmin.rpc('submit_math_warmup', { p_instance: instance.id, p_user: ctx.userId, p_email: ctx.email, p_response: r, p_summary: summarizeMathResponse(r), p_check: selfCheck, p_tag: feedback?.tag ?? null })
  if (saved.error) return NextResponse.json({ error: 'Your work was not saved. Please retry.' }, { status: 503 })
  // A retry returns the original evidence; never report a verdict for an unsaved change.
  return NextResponse.json({ ...saved.data, selfCheck: saved.data.self_check, selfCheckReason: saved.data.self_check === 'unknown' ? 'unparsed' : null, workShown, feedback: saved.data.response_json?.answer === answer ? feedback : null })
})
