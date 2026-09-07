import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveTargetStudent } from '@/lib/teacher-scope'

export const GET = withAuth(async (request, ctx) => {
  const params = new URL(request.url).searchParams
  const target = await resolveTargetStudent({ role: ctx.role, selfId: ctx.userId, scopeEmail: ctx.scopeEmail, requestedUserId: params.get('user_id') })
  if (!target.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const columns = 'id,competency_id,prompt,response,response_json,status,resulting_level,submitted_at,reviewed_at,tested_competency_ids,rated_competency_ids,self_check,revision_requested'
  const query = () => {
    let q = supabaseAdmin.from('math_warmup_submissions').select(columns).eq('user_id', target.userId)
    if (params.get('submission_id')) q = q.eq('id', params.get('submission_id')!)
    if (params.get('competency_id') && !params.get('submission_id')) q = q.eq('competency_id', params.get('competency_id')!)
    return q
  }
  const [pending, recent, feedback, revisions, requested] = await Promise.all([
    query().eq('status', 'pending').order('submitted_at', { ascending: true }).limit(100),
    query().neq('status', 'pending').order('submitted_at', { ascending: false }).limit(20),
    supabaseAdmin.from('teacher_feedback').select('id,submission_id,message,created_at').eq('user_id', target.userId).not('submission_id', 'is', null).order('created_at', { ascending: false }).limit(100),
    supabaseAdmin.from('math_warmup_revisions').select('id,submission_id,response_json,message,needs_help,status,submitted_at,teacher_reply,next_step').eq('user_id', target.userId).order('submitted_at', { ascending: false }).limit(100),
    query().eq('revision_requested',true).order('submitted_at',{ascending:false}).limit(100),
  ])
  if ([pending, recent, feedback, revisions, requested].some(r => r.error)) return NextResponse.json({ error: 'Could not load work and feedback. Please retry.' }, { status: 503 })
  // Include old originals with a response waiting, even outside recent history.
  const rows = new Map([...(pending.data ?? []), ...(recent.data ?? []), ...(requested.data ?? [])].map(r => [r.id, r]))
  const missing = (revisions.data ?? []).filter(r => r.status === 'pending' && !rows.has(r.submission_id)).map(r => r.submission_id)
  if (missing.length) {
    const extra = await query().in('id', missing)
    if (extra.error) return NextResponse.json({ error: 'Could not load pending responses' }, { status: 503 })
    for (const row of extra.data ?? []) rows.set(row.id, row)
  }
  return NextResponse.json({ userId: target.userId, submissions: [...rows.values()], feedback: feedback.data ?? [], revisions: revisions.data ?? [] })
})
