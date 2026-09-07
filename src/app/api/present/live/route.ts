import { createHash } from 'node:crypto'
import { currentPulse } from '@/lib/presentation-tools-server'
import type { InlineQuestion } from '@/data/content-blocks'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { classLesson } from '@/lib/present-server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/present/live?lesson_id=… — the live presentation a student should follow (P-4).
// A student sees a session only when it belongs to one of their classes (or has no
// class attached). Staff see their own. Polled every few seconds; cheap by design.
export const GET = withAuth(async (request, ctx) => {
  const lessonId = new URL(request.url).searchParams.get('lesson_id')
  if (!lessonId) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })

  const { data: memberships } = await supabaseAdmin.from('course_students').select('course_id').eq('student_id', ctx.userId)
  const courseIds = (memberships ?? []).map(m => m.course_id)
  if (ctx.realRole === 'student' && !courseIds.length) return NextResponse.json({ session: null })
  let q = supabaseAdmin.from('present_sessions')
    .select('id, course_id, teacher_id, current_slide, current_section, current_anchor, poll_run_id, poll_block_id, poll_locked, poll_revealed, blackout, timer_ends_at, updated_at')
    .eq('lesson_id', lessonId).eq('status', 'live').order('updated_at', { ascending: false })
  if (ctx.realRole !== 'student') q = q.eq('teacher_id', ctx.userId)
  if (ctx.realRole === 'student') q = q.in('course_id', courseIds)
  const { data } = await q.limit(5)
  type Row = { id: string; course_id: string | null; teacher_id: string; current_slide: number; current_section: number; current_anchor: string | null; poll_run_id: string | null; poll_block_id: string | null; poll_locked: boolean; poll_revealed: boolean; blackout: boolean; timer_ends_at: string | null; updated_at: string }
  let rows = (data ?? []) as Row[]

  if (ctx.realRole === 'student' && rows.length > 0) {
    const { data: cs } = await supabaseAdmin.from('course_students').select('course_id').eq('student_id', ctx.userId)
    const mine = new Set(((cs ?? []) as { course_id: string }[]).map((c) => c.course_id))
    rows = rows.filter((r) => r.course_id && mine.has(r.course_id))
  }
  const s = rows[0]
  if (!s) return NextResponse.json({ session: null })
  const lesson = s.course_id ? await classLesson(lessonId, s.course_id) : null
  const block = lesson?.original.blocks.find(b => b.id === s.poll_block_id && lesson.content_blocks.blocks.some(x => x.id === b.id))
  const reveal = s.poll_revealed && block?.type === 'question' ? { correctOptionId: (block.question as InlineQuestion).correctOptionId, feedback: Object.fromEntries(((block.question as InlineQuestion).options ?? []).map(o => [o.id, o.feedback ?? ''])) } : null
  const pulse = await currentPulse(s.id)
  let pulseChoice: number | null = null
  if (pulse) {
    const secret = await supabaseAdmin.from('present_pulses').select('salt').eq('id', pulse.id).single()
    if (secret.error) throw secret.error
    const key = createHash('md5').update(secret.data.salt + ctx.userId).digest('hex')
    const answer = await supabaseAdmin.from('present_pulse_responses').select('choice').eq('pulse_id', pulse.id).eq('respondent_key', key).maybeSingle()
    if (answer.error) throw answer.error
    pulseChoice = answer.data?.choice ?? null
  }
  const help = await supabaseAdmin.from('present_help_requests').select('resolved_at').eq('session_id', s.id).eq('user_id', ctx.userId).maybeSingle()
  if (help.error) throw help.error
  return NextResponse.json({ session: { pulse, pulseChoice, helpRequested: Boolean(help.data && !help.data.resolved_at), currentAnchor: s.current_anchor, pollRunId: s.poll_run_id, reveal, id: s.id, currentSlide: s.current_slide, currentSection: s.current_section, pollBlockId: s.poll_block_id, pollLocked: s.poll_locked, pollRevealed: s.poll_revealed, blackout: s.blackout, timerEndsAt: s.timer_ends_at, updatedAt: s.updated_at } })
})
