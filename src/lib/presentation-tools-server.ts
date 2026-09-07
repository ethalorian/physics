import { supabaseAdmin } from '@/lib/supabase'
import type { Pulse, TeachingMark, TeachingStudent, TeachingNeed } from '@/lib/presentation-tools'

export async function presentationForActor(id: string, actor: { role: string; userId: string }) {
  const { data, error } = await supabaseAdmin.from('present_sessions').select('id, teacher_id, lesson_id, course_id, status, current_slide, poll_block_id, poll_run_id, updated_at').eq('id', id).maybeSingle()
  if (error) throw error
  return data && (actor.role === 'admin' || data.teacher_id === actor.userId) ? data : null
}
export async function presentationForStudent(id: string, userId: string) {
  const { data, error } = await supabaseAdmin.from('present_sessions').select('id, course_id, status').eq('id', id).eq('status', 'live').maybeSingle()
  if (error) throw error
  if (!data?.course_id) return null
  const member = await supabaseAdmin.from('course_students').select('student_id').eq('course_id', data.course_id).eq('student_id', userId).maybeSingle()
  if (member.error) throw member.error
  return member.data ? data : null
}
export async function currentPulse(sessionId: string): Promise<Pulse | null> {
  const { data, error } = await supabaseAdmin.from('present_pulses').select('id, kind, anonymous, status, created_at').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data as Pulse | null
}
export async function teachingTools(session: NonNullable<Awaited<ReturnType<typeof presentationForActor>>>, displayOnly: boolean) {
  const [pulse, tools, projector] = await Promise.all([
    currentPulse(session.id),
    supabaseAdmin.from('present_session_tools').select('reconnect_token, discussion_block_id, discussion_poll_run_id, updated_at').eq('session_id', session.id).maybeSingle(),
    supabaseAdmin.from('present_projector_state').select('signature, seen_at, slide, ready').eq('session_id', session.id).maybeSingle(),
  ])
  if (tools.error || projector.error) throw tools.error || projector.error
  let answers: { user_id: string | null; choice: number }[] = []
  if (pulse) {
    const result = await supabaseAdmin.from('present_pulse_responses').select('user_id, choice').eq('pulse_id', pulse.id)
    if (result.error) throw result.error
    answers = result.data ?? []
    pulse.tally = {}; pulse.saved = answers.length
    for (const answer of answers) pulse.tally[answer.choice] = (pulse.tally[answer.choice] ?? 0) + 1
  }
  const base = { pulse, tools: tools.data, projector: projector.data }
  if (displayOnly) return { ...base, roster: [], needs: [], marks: [] }
  const [members, help, marks] = await Promise.all([
    supabaseAdmin.from('course_students').select('student_id').eq('course_id', session.course_id),
    supabaseAdmin.from('present_help_requests').select('user_id, requested_at').eq('session_id', session.id).is('resolved_at', null),
    supabaseAdmin.from('present_teacher_marks').select('id, kind, student_id, slide, note, created_at').eq('session_id', session.id).eq('teacher_id', session.teacher_id).order('created_at', { ascending: false }),
  ])
  if (members.error || help.error || marks.error) throw members.error || help.error || marks.error
  const ids = (members.data ?? []).map(m => m.student_id)
  const students = ids.length ? await supabaseAdmin.from('students').select('id, name').in('id', ids).order('name') : { data: [], error: null }
  if (students.error) throw students.error
  const roster = students.data as TeachingStudent[]
  const needs = new Map<string, TeachingNeed>()
  const add = (id: string, reason: string, requestedAt?: string) => {
    const student = roster.find(s => s.id === id)
    if (!student) return
    const row = needs.get(id) ?? { ...student, reasons: [], requestedAt }
    row.reasons.push(reason); needs.set(id, row)
  }
  for (const request of help.data ?? []) add(request.user_id, 'Asked for help', request.requested_at)
  if (pulse && !pulse.anonymous) {
    for (const answer of answers) if (answer.user_id && answer.choice === 0) add(answer.user_id, pulse.kind === 'readiness' ? 'Needs help on pulse check' : 'Low confidence on pulse check')
    if (pulse.status === 'open') for (const id of ids) if (!answers.some(a => a.user_id === id)) add(id, 'No pulse response yet')
  }
  let targetId: string | null = null
  if (session.poll_block_id) {
    const responses = await supabaseAdmin.from('block_responses').select('user_id, response, confidence, target_id').eq('present_session_id', session.id).eq('poll_run_id', session.poll_run_id ?? '__none__').eq('block_id', session.poll_block_id).eq('evidence_source', 'live_poll').order('created_at', { ascending: false })
    if (responses.error) throw responses.error
    const seen = new Set<string>()
    for (const row of responses.data ?? []) {
      if (seen.has(row.user_id)) continue
      seen.add(row.user_id); targetId ??= row.target_id
      if ((row.response as { autoCheck?: string } | null)?.autoCheck === 'mismatch') add(row.user_id, row.confidence === 'sure' ? 'Incorrect and confident on poll' : 'Check understanding on poll')
    }
    for (const id of ids) if (!seen.has(id)) add(id, 'No poll response yet')
  }
  return { ...base, roster, needs: [...needs.values()], marks: marks.data as TeachingMark[], targetId }
}
