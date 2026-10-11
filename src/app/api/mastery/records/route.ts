import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { teacherCanAccessStudent } from '@/lib/teacher-scope'
import { UUID } from '@/lib/vocab-learning'

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

    // Ratings come only from the teacher of record: the student must be on the
    // ACTOR'S own roster (courses they imported). This applies to admins too —
    // admin widens what you can SEE, never whose students you can rate.
    if (!(await teacherCanAccessStudent(ctx.scopeEmail, user_id))) {
      return NextResponse.json({ error: 'Forbidden - student not on your own roster' }, { status: 403 })
    }

    if (body.vocabulary) {
      const v = body.vocabulary
      if (!UUID.test(user_id) || !UUID.test(target_id) || !UUID.test(v.task_id ?? '') || !UUID.test(v.request_id ?? '') || typeof v.evidence_key !== 'string' || typeof v.note !== 'string' || v.note.length > 2000 || (v.previous_review_id != null && !UUID.test(v.previous_review_id))) {
        return NextResponse.json({ error: 'Invalid vocabulary review.' }, { status: 400 })
      }
      const { data, error } = await supabaseAdmin.rpc('submit_vocab_mastery_review', {
        p_id: v.request_id, p_task: v.task_id, p_user: user_id, p_target: target_id,
        p_reviewer: ctx.scopeEmail, p_level: level, p_note: v.note,
        p_evidence_key: v.evidence_key, p_previous: v.previous_review_id ?? null,
      })
      if (error) {
        const conflict = error.code === 'P0001'
        if (!conflict) console.error('Vocabulary mastery save failed', error)
        return NextResponse.json({ error: conflict ? error.message : 'Could not save the vocabulary rating. Please retry.' }, { status: conflict ? 409 : 500 })
      }
      return NextResponse.json(data, { status: 201 })
    }

    const row = {
      user_id,
      user_email: body.user_email ?? null,
      rated_by: ctx.scopeEmail,
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
