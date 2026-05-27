import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getEffectiveContext } from '@/lib/effective-context'
import { targetValue, MasteryRecord } from '@/data/curriculum-types'
import { resolveRosterScope } from '@/lib/teacher-scope'

// GET /api/mastery/grid?unit_id=unit-1
// Class mastery grid: every student (the teacher's roster) x every learning target
// in a unit, with the current rolled-up level per cell (decaying average of the
// student's records for that target). Powers the teacher control room centerpiece.

type StudentRow = { google_user_id: string | null; name: string; email: string }
type TargetRow = { id: string; statement: string; domain: string; order_index: number }
type RecordRow = { user_id: string; target_id: string; level: number; observed_at: string }
type UnitRow = { id: string; name: string; order_index: number }

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const ctx = await getEffectiveContext(session.user.email)
    const role = ctx.role
    if (role !== 'admin' && role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can view the grid' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get('unit_id') ?? 'unit-1'
    const classId = searchParams.get('class')

    // Units (for the switcher)
    const { data: unitRowsRaw } = await supabaseAdmin
      .from('units')
      .select('id, name, order_index')
      .order('order_index', { ascending: true })
    const units = ((unitRowsRaw ?? []) as UnitRow[]).map((u) => ({ id: u.id, name: u.name }))

    // Targets for the unit
    const { data: targetRowsRaw } = await supabaseAdmin
      .from('learning_targets')
      .select('id, statement, domain, order_index')
      .eq('unit_id', unitId)
      .order('order_index', { ascending: true })
    const targets = (targetRowsRaw ?? []) as TargetRow[]
    const targetIds = targets.map((t) => t.id)

    // Students (same scoping as /api/mastery/roster)
    let sQuery = supabaseAdmin
      .from('students')
      .select('google_user_id, name, email')
      .order('name', { ascending: true })
    const scope = await resolveRosterScope({ classId, role, scopeEmail: ctx.scopeEmail })
    if (scope.gids) sQuery = sQuery.in('google_user_id', scope.gids)
    const { data: studentRowsRaw } = await sQuery
    const students = ((studentRowsRaw ?? []) as StudentRow[])
      .filter((s) => s.google_user_id)
      .map((s) => ({ id: s.google_user_id as string, name: s.name, email: s.email }))
    const studentIds = students.map((s) => s.id)

    // All records for those students on those targets
    let records: RecordRow[] = []
    if (targetIds.length > 0 && studentIds.length > 0) {
      const { data: recRaw } = await supabaseAdmin
        .from('mastery_records')
        .select('user_id, target_id, level, observed_at')
        .in('target_id', targetIds)
        .in('user_id', studentIds)
        .order('observed_at', { ascending: true })
      records = (recRaw ?? []) as RecordRow[]
    }

    // Group records by student|target, compute the rolled value per cell
    const byKey = new Map<string, MasteryRecord[]>()
    for (const r of records) {
      const key = `${r.user_id}|${r.target_id}`
      const arr = byKey.get(key) ?? []
      arr.push({ studentId: r.user_id, targetId: r.target_id, level: r.level as 1 | 2 | 3, observedAt: r.observed_at })
      byKey.set(key, arr)
    }

    const cells: Record<string, Record<string, { value: number | null; count: number }>> = {}
    for (const s of students) {
      const row: Record<string, { value: number | null; count: number }> = {}
      for (const t of targets) {
        const arr = byKey.get(`${s.id}|${t.id}`) ?? []
        row[t.id] = { value: arr.length > 0 ? targetValue(arr) : null, count: arr.length }
      }
      cells[s.id] = row
    }

    return NextResponse.json({
      unitId,
      units,
      targets: targets.map((t) => ({ id: t.id, statement: t.statement, domain: t.domain })),
      students,
      cells,
    })
  } catch (error) {
    console.error('Error in GET /api/mastery/grid:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
