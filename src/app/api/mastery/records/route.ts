import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// POST /api/mastery/records
// Records a single Marzano observation (1-3) for a student on a target.
// Teacher/admin only — mastery is teacher-assessed, never student self-reported.
// APPEND-ONLY: always inserts a new row so the longitudinal history is preserved
// and the decaying-average rollup has a full trail.
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = getUserRole(session.user.email)
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
  } catch (error) {
    console.error('Error in POST /api/mastery/records:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
