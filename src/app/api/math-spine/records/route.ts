import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { recordMathObservation } from '@/lib/math-spine-server'
import { teacherCanAccessStudent } from '@/lib/teacher-scope'

// POST /api/math-spine/records
// Records a single Marzano observation (1-3) for a student on a math competency,
// then awards any celebration milestones it unlocks (idempotently). Teacher/admin
// only. APPEND-ONLY. Returns { record, awarded } where `awarded` is the grants
// that were NEW this call (so the UI can celebrate exactly those).
export const POST = withAuth(async (request, ctx) => {
  const role = ctx.role
  if (role !== 'admin' && role !== 'teacher') {
    return NextResponse.json({ error: 'Only teachers can record mastery' }, { status: 403 })
  }

  const body = await request.json()
  const { user_id, competency_id, level } = body
  if (!user_id || !competency_id || ![1, 2, 3].includes(level)) {
    return NextResponse.json(
      { error: 'Missing or invalid fields: user_id, competency_id, level (1, 2, or 3)' },
      { status: 400 },
    )
  }

  // A teacher may only rate a student on their own roster (admins unrestricted).
  if (role === 'teacher' && !(await teacherCanAccessStudent(ctx.scopeEmail, user_id))) {
    return NextResponse.json({ error: 'Forbidden - student not in your roster' }, { status: 403 })
  }

  const result = await recordMathObservation({
    userId: user_id,
    userEmail: body.user_email ?? null,
    competencyId: competency_id,
    level,
    unitId: body.unit_id ?? null,
    evidenceSource: body.evidence_source ?? null,
    observedAt: body.observed_at,
  })
  if (result.error) {
    console.error('Error recording math mastery:', result.error)
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ record: result.record, awarded: result.awarded }, { status: 201 })
})
