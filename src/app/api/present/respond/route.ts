import { NextResponse } from 'next/server'
import { withEnrolledStudent } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { presentationForStudent } from '@/lib/presentation-tools-server'

export const POST = withEnrolledStudent(async (request, ctx) => {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  if (typeof body.session_id !== 'string') return NextResponse.json({ error: 'Session required' }, { status: 400 })
  const session = await presentationForStudent(body.session_id, ctx.userId)
  if (!session) return NextResponse.json({ error: 'This live class is unavailable' }, { status: 403 })
  if (body.action === 'help' || body.action === 'cancel_help') {
    const result = await supabaseAdmin.from('present_help_requests').upsert({ session_id: session.id, user_id: ctx.userId, requested_at: new Date().toISOString(), resolved_at: body.action === 'cancel_help' ? new Date().toISOString() : null })
    if (result.error) throw result.error
    return NextResponse.json({ saved: true })
  }
  if (body.action !== 'pulse' || typeof body.pulse_id !== 'string' || ![0,1,2].includes(Number(body.choice)) || typeof body.choice !== 'number') return NextResponse.json({ error: 'Invalid response' }, { status: 400 })
  // The database locks the pulse while saving, so closing/replacing a round
  // cannot race a late answer. Anonymous responses store no user_id.
  const result = await supabaseAdmin.rpc('submit_present_pulse', { p_session: session.id, p_pulse: body.pulse_id, p_user: ctx.userId, p_choice: body.choice })
  if (result.error) return NextResponse.json({ error: 'This pulse is closed or changed. Refresh before responding.' }, { status: 409 })
  return NextResponse.json({ saved: true })
})
