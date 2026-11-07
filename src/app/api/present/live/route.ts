import { visibleTeachingTools, type TeachingToolStates } from '@/lib/teaching-tool-spec'
import { createHash } from 'node:crypto'
import type { Pulse } from '@/lib/presentation-tools'
import type { InlineQuestion } from '@/data/content-blocks'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { classLesson } from '@/lib/present-server'
import { supabaseAdmin } from '@/lib/supabase'
import { lookupDatabase } from '@/lib/lookup-database'
import { observedDatabase, observedLookup } from '@/lib/request-runtime'

async function studentPulse(sessionId: string, userId: string) {
  const { data, error } = await observedDatabase(() => supabaseAdmin.from('present_pulses')
    .select('id,kind,anonymous,status,created_at,prompt,options,required,locked,revealed,target_id,salt')
    .eq('session_id', sessionId).order('created_at', { ascending: false }).limit(1).maybeSingle())
  if (error) throw error
  if (!data) return { pulse: null, pulseChoice: null }
  // The salt is used only on the server and never appears in the response.
  const { salt, ...pulse } = data as Pulse & { salt: string }
  const key = createHash('md5').update(salt + userId).digest('hex')
  const answer = await observedDatabase(() => supabaseAdmin.from('present_pulse_responses')
    .select('choice').eq('pulse_id', pulse.id).eq('respondent_key', key).maybeSingle())
  if (answer.error) throw answer.error
  return { pulse, pulseChoice: answer.data?.choice ?? null }
}

// GET /api/present/live?lesson_id=… — the live presentation a student should follow (P-4).
// Students see sessions in their active classes. Staff see their own, including
// classless sessions. Enrollment is checked fresh in the session query itself.
export const GET = withAuth(async (request, ctx) => {
  const lessonId = new URL(request.url).searchParams.get('lesson_id')
  if (!lessonId) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })

  const student = ctx.realRole === 'student'
  const fields = 'id, course_id, teacher_id, current_slide, current_section, current_anchor, poll_run_id, poll_block_id, poll_locked, poll_revealed, blackout, timer_ends_at, updated_at, command_revision, teaching_tool_state'
  let q = lookupDatabase.from('present_sessions')
    .select(student ? `${fields},courses!inner(course_students!inner(student_id))` as const : fields)
    .eq('lesson_id', lessonId).eq('status', 'live').order('updated_at', { ascending: false })
  if (ctx.realRole !== 'student') q = q.eq('teacher_id', ctx.userId)
  if (student) q = q.eq('courses.course_students.student_id', ctx.userId).eq('courses.course_students.enrollment_state', 'ACTIVE')
  const { data, error: sessionError } = await observedLookup('poll_sessions', () => q.limit(5))
  if (sessionError) return NextResponse.json({ error: 'Live class unavailable' }, { status: 503 })
  type Row = { command_revision: number; teaching_tool_state?: TeachingToolStates; id: string; course_id: string | null; teacher_id: string; current_slide: number; current_section: number; current_anchor: string | null; poll_run_id: string | null; poll_block_id: string | null; poll_locked: boolean; poll_revealed: boolean; blackout: boolean; timer_ends_at: string | null; updated_at: string }
  // Both projections contain these same scalar fields; the SDK's select parser
  // cannot infer the conditional nested-join projection above.
  const rows = (data ?? []) as unknown as Row[]

  const s = rows[0]
  if (!s) return NextResponse.json({ session: null })
  const [lesson, { pulse, pulseChoice }, help] = await Promise.all([
    s.course_id ? classLesson(lessonId, s.course_id) : null,
    studentPulse(s.id, ctx.userId),
    observedDatabase(() => supabaseAdmin.from('present_help_requests').select('resolved_at').eq('session_id', s.id).eq('user_id', ctx.userId).maybeSingle()),
  ])
  const block = lesson?.original.blocks.find(b => b.id === s.poll_block_id && lesson.content_blocks.blocks.some(x => x.id === b.id))
  const reveal = s.poll_revealed && block?.type === 'question' ? { correctOptionId: (block.question as InlineQuestion).correctOptionId, feedback: Object.fromEntries(((block.question as InlineQuestion).options ?? []).map(o => [o.id, o.feedback ?? ''])) } : null
  if (help.error) throw help.error
  return NextResponse.json({ session: { commandRevision: s.command_revision, teachingTools: visibleTeachingTools(lesson?.content_blocks.blocks??[],s.teaching_tool_state), pulse, pulseChoice, helpRequested: Boolean(help.data && !help.data.resolved_at), currentAnchor: s.current_anchor, pollRunId: s.poll_run_id, reveal, id: s.id, currentSlide: s.current_slide, currentSection: s.current_section, pollBlockId: s.poll_block_id, pollLocked: s.poll_locked, pollRevealed: s.poll_revealed, blackout: s.blackout, timerEndsAt: s.timer_ends_at, updatedAt: s.updated_at } })
})
