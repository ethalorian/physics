import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { teacherCanAccessStudent } from '@/lib/teacher-scope'

// POST /api/mastery/records
// Records a single Marzano observation (1-3) for a student on a target.
// Teacher/admin only — mastery is teacher-assessed, never student self-reported.
// APPEND-ONLY: always inserts a new row so the longitudinal history is preserved
// and the decaying-average rollup has a full trail.
export const POST = withAuth(async (request, ctx) => {
    const role = ctx.role
    if (role !== 'admin' && role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can record mastery' }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, target_id, level } = body

    if (!user_id || !target_id || ![1, 2, 3].includes(level)) {
      return NextResponse.json(
        { error: 'Missing or invalid fields: user_id, target_id, level (1, 2, or 3)' },
        { status: 400 },
      )
    }

    // A teacher may only rate a student on their own roster (admins unrestricted).
    if (role === 'teacher' && !(await teacherCanAccessStudent(ctx.scopeEmail, user_id))) {
      return NextResponse.json({ error: 'Forbidden - student not in your roster' }, { status: 403 })
    }

    const row = {
      user_id,
      user_email: body.user_email ?? null,
      target_id,
      level,
      evidence_source: body.evidence_source ?? null,
      observed_at: body.observed_at ?? new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('mastery_records')
      .insert(row)
      .select()
      .single()

    if (error) {
      console.error('Error recording mastery:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
})
