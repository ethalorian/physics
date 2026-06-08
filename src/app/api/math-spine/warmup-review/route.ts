import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { recordMathObservation } from '@/lib/math-spine-server'
import { teacherCanAccessStudent } from '@/lib/teacher-scope'

// POST /api/math-spine/warmup-review
// The teacher reviews a submitted warm-up and assigns a Marzano fluency level.
// One action, two effects: it writes a normal math_competency_record
// (evidence_source='warm-up', so milestones + points fire) and resolves the
// submission (status='reviewed'). Teacher/admin only.
export const POST = withAuth(async (request, ctx) => {
  const role = ctx.role
  if (role !== 'admin' && role !== 'teacher') {
    return NextResponse.json({ error: 'Only teachers can review warm-ups' }, { status: 403 })
  }

  const body = await request.json()
  const { submission_id, competency_id, level } = body
  if (!submission_id || !competency_id || ![1, 2, 3].includes(level)) {
    return NextResponse.json(
      { error: 'Missing or invalid fields: submission_id, competency_id, level (1, 2, or 3)' },
      { status: 400 },
    )
  }

  // Load the submission (student + which competencies it is evidence for).
  const { data: sub, error: subErr } = await supabaseAdmin
    .from('math_warmup_submissions')
    .select('id, user_id, user_email, status, tested_competency_ids, rated_competency_ids')
    .eq('id', submission_id)
    .single()
  if (subErr || !sub) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  // A teacher may only review a warm-up from a student on their own roster.
  if (role === 'teacher' && !(await teacherCanAccessStudent(ctx.scopeEmail, sub.user_id))) {
    return NextResponse.json({ error: 'Forbidden - student not in your roster' }, { status: 403 })
  }

  const tested: string[] = sub.tested_competency_ids ?? []
  if (tested.length > 0 && !tested.includes(competency_id)) {
    return NextResponse.json({ error: 'That competency is not tested by this warm-up' }, { status: 400 })
  }

  // Write the observation for THIS competency (milestones + points fire here).
  const result = await recordMathObservation({
    userId: sub.user_id,
    userEmail: sub.user_email,
    competencyId: competency_id,
    level,
    evidenceSource: 'warm-up',
  })
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // Track which tested competencies are now rated; resolve only when all are.
  const rated = new Set<string>(sub.rated_competency_ids ?? [])
  rated.add(competency_id)
  const allRated = tested.length > 0 && tested.every((id) => rated.has(id))

  const { error: updErr } = await supabaseAdmin
    .from('math_warmup_submissions')
    .update({
      rated_competency_ids: [...rated],
      status: allRated ? 'reviewed' : 'pending',
      resulting_level: level,
      reviewed_by: ctx.email,
      reviewed_at: allRated ? new Date().toISOString() : null,
    })
    .eq('id', submission_id)
  if (updErr) {
    console.error('Error updating warm-up submission:', updErr)
  }

  return NextResponse.json({ awarded: result.awarded, resolved: allRated }, { status: 201 })
})
