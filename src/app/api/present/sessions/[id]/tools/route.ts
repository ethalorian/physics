import { randomInt, randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { presentationForActor, teachingTools } from '@/lib/presentation-tools-server'
import { PULSE_OPTIONS, uncalledStudents, type PulseKind } from '@/lib/presentation-tools'

export const GET = withRole<{ id: string }>(['teacher', 'admin'], async (request, ctx) => {
  const session = await presentationForActor((await ctx.params).id, ctx)
  if (!session) return NextResponse.json({ error: 'Presentation unavailable' }, { status: 403 })
  return NextResponse.json(await teachingTools(session, new URL(request.url).searchParams.get('display') === '1'))
})

export const POST = withRole<{ id: string }>(['teacher', 'admin'], async (request, ctx) => {
  const session = await presentationForActor((await ctx.params).id, ctx)
  if (!session) return NextResponse.json({ error: 'Presentation unavailable' }, { status: 403 })
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const action = body.action
  const now = new Date().toISOString()
  // Acknowledgments don't change the command revision, avoiding a feedback loop.
  if (action === 'ack') {
    if (typeof body.signature !== 'string' || body.signature.length > 1000 || !Number.isInteger(body.slide) || Number(body.slide) < 0 || typeof body.ready !== 'boolean') return NextResponse.json({ error: 'Invalid acknowledgment' }, { status: 400 })
    const result = await supabaseAdmin.from('present_projector_state').upsert({ session_id: session.id, signature: body.signature, slide: body.slide, ready: body.ready, seen_at: now })
    if (result.error) throw result.error
    return NextResponse.json({ saved: true })
  }
  if (session.status !== 'live' && action !== 'bookmark') return NextResponse.json({ error: 'Presentation has ended' }, { status: 409 })
  const roster = await teachingTools(session, false)
  if (body.student_id && !roster.roster.some(s => s.id === body.student_id)) return NextResponse.json({ error: 'Student is not in this class' }, { status: 403 })
  if (action === 'pulse') {
    if (typeof body.kind !== 'string' || !Object.hasOwn(PULSE_OPTIONS, body.kind) || typeof body.anonymous !== 'boolean') return NextResponse.json({ error: 'Invalid pulse check' }, { status: 400 })
    if (session.poll_block_id) return NextResponse.json({ error: 'Close the lesson poll before a pulse check' }, { status: 409 })
    const closed = await supabaseAdmin.from('present_pulses').update({ status: 'closed' }).eq('session_id', session.id).eq('status', 'open')
    if (closed.error) throw closed.error
    const result = await supabaseAdmin.from('present_pulses').insert({ session_id: session.id, kind: body.kind as PulseKind, anonymous: body.anonymous }).select('id').single()
    if (result.error) throw result.error
  } else if (action === 'close_pulse') {
    const result = await supabaseAdmin.from('present_pulses').update({ status: 'closed' }).eq('session_id', session.id).eq('status', 'open')
    if (result.error) throw result.error
  } else if (action === 'resolve_help') {
    if (!body.student_id) return NextResponse.json({ error: 'Choose a student' }, { status: 400 })
    const result = await supabaseAdmin.from('present_help_requests').update({ resolved_at: now }).eq('session_id', session.id).eq('user_id', body.student_id)
    if (result.error) throw result.error
  } else if (action === 'bookmark') {
    if (typeof body.note !== 'string' || !body.note.trim() || body.note.length > 1000) return NextResponse.json({ error: 'Write a note up to 1000 characters' }, { status: 400 })
    const result = await supabaseAdmin.from('present_teacher_marks').insert({ session_id: session.id, teacher_id: session.teacher_id, kind: 'bookmark', student_id: body.student_id ?? null, slide: session.current_slide, note: body.note.trim() })
    if (result.error) throw result.error
  } else if (action === 'pick' || action === 'skip_pick') {
    if (action === 'skip_pick' && body.student_id) {
      const skipped = await supabaseAdmin.from('present_teacher_marks').insert({ session_id: session.id, teacher_id: session.teacher_id, kind: 'skipped', student_id: body.student_id, slide: session.current_slide, note: 'Skipped this turn' })
      if (skipped.error) throw skipped.error
    }
    const available = uncalledStudents(roster.roster, roster.marks)
    if (!available.length) return NextResponse.json({ error: 'Everyone has had a turn in this session.' }, { status: 409 })
    const selected = available[randomInt(available.length)]
    const result = await supabaseAdmin.from('present_teacher_marks').insert({ session_id: session.id, teacher_id: session.teacher_id, kind: 'called', student_id: selected.id, slide: session.current_slide, note: 'Called on' })
    if (result.error) throw result.error
    return NextResponse.json({ selected, state: await teachingTools(session, false) })
  } else if (action === 'reconnect') {
    const result = await supabaseAdmin.from('present_session_tools').upsert({ session_id: session.id, reconnect_token: randomUUID(), updated_at: now })
    if (result.error) throw result.error
  } else return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  return NextResponse.json({ state: await teachingTools(session, false) })
})
