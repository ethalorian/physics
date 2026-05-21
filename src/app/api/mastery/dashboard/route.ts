import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { LearningTarget, MasteryRecord, Domain, RubricDimension } from '@/data/curriculum-types'

// GET /api/mastery/dashboard?unit_id=unit-1[&user_id=...]
// Returns everything a student view needs: the unit's targets, this student's
// mastery records, and the latest transfer-task result. Students always get their
// own data; teachers/admins may pass ?user_id= to view a specific student.
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = session.user.role
    const isStaff = role === 'admin' || role === 'teacher'

    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get('unit_id')
    if (!unitId) {
      return NextResponse.json({ error: 'Missing required query param: unit_id' }, { status: 400 })
    }

    // Students are locked to their own records; only staff may inspect another student.
    const requestedUserId = searchParams.get('user_id')
    const targetUserId = isStaff && requestedUserId ? requestedUserId : session.user.id

    // 1) Unit targets (source-of-truth content, projected from learning_targets).
    const { data: targetRows, error: targetErr } = await supabaseAdmin
      .from('learning_targets')
      .select('id, statement, domain, unit_id, content_strand, standard_refs, exclude_from_growth, order_index')
      .eq('unit_id', unitId)
      .order('order_index', { ascending: true })
    if (targetErr) {
      return NextResponse.json({ error: targetErr.message }, { status: 500 })
    }

    const targets: LearningTarget[] = (targetRows ?? []).map((t) => ({
      id: t.id,
      statement: t.statement,
      domain: t.domain as Domain,
      unitId: t.unit_id,
      contentStrand: t.content_strand ?? undefined,
      standardRefs: t.standard_refs ?? undefined,
      excludeFromGrowth: t.exclude_from_growth ?? false,
    }))
    const targetIds = targets.map((t) => t.id)

    // 2) This student's mastery records for those targets (append-only, chronological).
    let records: MasteryRecord[] = []
    if (targetIds.length > 0) {
      const { data: recRows, error: recErr } = await supabaseAdmin
        .from('mastery_records')
        .select('user_id, target_id, level, observed_at, evidence_source')
        .eq('user_id', targetUserId)
        .in('target_id', targetIds)
        .order('observed_at', { ascending: true })
      if (recErr) {
        return NextResponse.json({ error: recErr.message }, { status: 500 })
      }
      records = (recRows ?? []).map((r) => ({
        studentId: r.user_id,
        targetId: r.target_id,
        level: r.level,
        observedAt: r.observed_at,
        evidenceSource: r.evidence_source ?? undefined,
      }))
    }

    // 3) Latest transfer-task result for this unit's mastery task (stands alone).
    let taskResult: { scores: Record<RubricDimension, number>; overall?: number } | null = null
    const { data: taskRows } = await supabaseAdmin
      .from('mastery_tasks')
      .select('id')
      .eq('unit_id', unitId)
    const taskIds = (taskRows ?? []).map((t) => t.id)
    if (taskIds.length > 0) {
      const { data: resultRows } = await supabaseAdmin
        .from('mastery_task_results')
        .select('scores, overall, scored_at')
        .eq('user_id', targetUserId)
        .in('mastery_task_id', taskIds)
        .order('scored_at', { ascending: false })
        .limit(1)
      if (resultRows && resultRows.length > 0) {
        taskResult = {
          scores: resultRows[0].scores as Record<RubricDimension, number>,
          overall: resultRows[0].overall ?? undefined,
        }
      }
    }

    return NextResponse.json({ unitId, userId: targetUserId, targets, records, taskResult })
  } catch (error) {
    console.error('Error in GET /api/mastery/dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
