import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/present/live?lesson_id=… — the live presentation a student should follow (P-4).
// A student sees a session only when it belongs to one of their classes (or has no
// class attached). Staff see their own. Polled every few seconds; cheap by design.
export const GET = withAuth(async (request, ctx) => {
  const lessonId = new URL(request.url).searchParams.get('lesson_id')
  if (!lessonId) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })

  let q = supabaseAdmin.from('present_sessions')
    .select('id, course_id, teacher_id, current_slide, current_section, poll_block_id, poll_locked, poll_revealed, blackout, timer_ends_at, updated_at')
    .eq('lesson_id', lessonId).eq('status', 'live').order('updated_at', { ascending: false })
  if (ctx.realRole !== 'student') q = q.eq('teacher_id', ctx.userId)
  const { data } = await q.limit(5)
  type Row = { id: string; course_id: string | null; teacher_id: string; current_slide: number; current_section: number; poll_block_id: string | null; poll_locked: boolean; poll_revealed: boolean; blackout: boolean; timer_ends_at: string | null; updated_at: string }
  let rows = (data ?? []) as Row[]

  if (ctx.realRole === 'student' && rows.length > 0) {
    const { data: cs } = await supabaseAdmin.from('course_students').select('course_id').eq('student_id', ctx.userId)
    const mine = new Set(((cs ?? []) as { course_id: string }[]).map((c) => c.course_id))
    rows = rows.filter((r) => !r.course_id || mine.has(r.course_id))
  }
  const s = rows[0]
  if (!s) return NextResponse.json({ session: null })
  return NextResponse.json({ session: { id: s.id, currentSlide: s.current_slide, currentSection: s.current_section, pollBlockId: s.poll_block_id, pollLocked: s.poll_locked, pollRevealed: s.poll_revealed, blackout: s.blackout, timerEndsAt: s.timer_ends_at, updatedAt: s.updated_at } })
})
