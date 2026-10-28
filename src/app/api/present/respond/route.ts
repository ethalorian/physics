import { suggestAfterSubmission } from '@/lib/assessment-results/suggestions-server'
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
  if(body.action==='ticket'){
    if(typeof body.pulse_id!=='string'||typeof body.response!=='string'||!body.response.trim()||body.response.length>5000)return NextResponse.json({error:'Write a response of 1–5000 characters.'},{status:400})
    const result=await supabaseAdmin.rpc('submit_present_ticket',{p_session:session.id,p_pulse:body.pulse_id,p_user:ctx.userId,p_response:body.response.trim()})
    if(result.error)return NextResponse.json({error:result.error.code==='P0001'?result.error.message:'Could not save your response. Try again.'},{status:result.error.code==='P0001'?409:500})
    if(typeof result.data==='string') suggestAfterSubmission('presentation',result.data)
    return NextResponse.json({saved:true})
  }
  if (body.action !== 'pulse' || typeof body.pulse_id !== 'string' || typeof body.choice !== 'number' || !Number.isInteger(body.choice) || body.choice<0 || body.choice>5) return NextResponse.json({ error: 'Invalid response' }, { status: 400 })
  // The database locks the pulse while saving, so closing/replacing a round
  // cannot race a late answer. Anonymous responses store no user_id.
  const result = await supabaseAdmin.rpc('submit_present_pulse', { p_session: session.id, p_pulse: body.pulse_id, p_user: ctx.userId, p_choice: body.choice })
  if (result.error) return NextResponse.json({ error: 'This pulse is closed or changed. Refresh before responding.' }, { status: 409 })
  return NextResponse.json({ saved: true })
})

export const maxDuration = 180
