import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveRosterScope, getTeacherStudentGids } from '@/lib/teacher-scope'
import { decayingAverage, MathStrand } from '@/data/curriculum-types'
import { rungState, pickTargetRung, type RungState, type RungInput } from '@/lib/math-spine-picker'

// GET /api/math-spine/math-grid[?class=<courseId>]
// The control-room "Math" view: every roster student x every active competency,
// with the rolled-up whole-year value per cell (decaying average) and a count of
// pending warm-up submissions awaiting review. Mirrors /api/mastery/grid.
type StudentRow = { id: string | null; name: string; email: string }

export const GET = withAuth(async (request, ctx) => {
  const role = ctx.role
  if (role !== 'admin' && role !== 'teacher') {
    return NextResponse.json({ error: 'Only teachers can view the grid' }, { status: 403 })
  }
  const { searchParams } = new URL(request.url)
  const classId = searchParams.get('class')

  // Competencies (active) in LADDER order (sequence_order) — the snapshot
  // should read left→right the way students climb, not strand-alphabetically.
  const { data: compRows } = await supabaseAdmin
    .from('math_competencies')
    .select('id, code, statement, strand, order_index, sequence_order')
    .eq('is_active', true)
    .order('sequence_order', { ascending: true, nullsFirst: false })
    .order('order_index', { ascending: true })
  const competencies = (compRows ?? []).map((c, i) => ({
    id: c.id,
    code: c.code,
    statement: c.statement,
    strand: c.strand as MathStrand,
    sequence: (c.sequence_order ?? 900 + i) * 1000 + c.order_index,
  }))
  const competencyIds = competencies.map((c) => c.id)

  // Students (same scoping as the rest of the control room).
  let sQuery = supabaseAdmin.from('students').select('id, name, email').order('name', { ascending: true })
  const scope = await resolveRosterScope({ classId, role, scopeEmail: ctx.scopeEmail, teacherEmail: searchParams.get('teacher') })
  if (scope.gids) sQuery = sQuery.in('id', scope.gids)
  const { data: sr } = await sQuery
  // ratable = on the ACTOR'S own roster; others are view-only (admin monitor).
  const own = new Set(await getTeacherStudentGids(ctx.scopeEmail))
  const students = ((sr ?? []) as StudentRow[])
    .filter((s) => s.id)
    .map((s) => ({ id: s.id as string, name: s.name, email: s.email, ratable: own.has(s.id as string) }))
  const studentIds = students.map((s) => s.id)

  const cells: Record<string, Record<string, { value: number | null; count: number; pending: number; state: RungState | null }>> = {}
  for (const s of students) cells[s.id] = {}
  // The rung the daily picker would hand each student today — the row-level
  // "where this student IS" summary the grid alone can't show.
  const currentRung: Record<string, { competencyId: string; kind: string } | null> = {}

  if (studentIds.length > 0 && competencyIds.length > 0) {
    // Records → decaying value per (student, competency).
    const { data: recRows } = await supabaseAdmin
      .from('math_competency_records')
      .select('user_id, competency_id, level, observed_at')
      .in('user_id', studentIds)
      .in('competency_id', competencyIds)
      .order('observed_at', { ascending: true })
    const levelsByKey = new Map<string, number[]>()
    for (const r of recRows ?? []) {
      const key = `${r.user_id}|${r.competency_id}`
      const arr = levelsByKey.get(key) ?? []
      arr.push(r.level)
      levelsByKey.set(key, arr)
    }

    // Pending warm-up submissions per (student, competency).
    const { data: pendRows } = await supabaseAdmin
      .from('math_warmup_submissions')
      .select('user_id, competency_id')
      .eq('status', 'pending')
      .in('user_id', studentIds)
      .in('competency_id', competencyIds)
    const pendingByKey = new Map<string, number>()
    for (const p of pendRows ?? []) {
      const key = `${p.user_id}|${p.competency_id}`
      pendingByKey.set(key, (pendingByKey.get(key) ?? 0) + 1)
    }

    // Latest observation per key, for the picker's staleness logic.
    const latestByKey = new Map<string, string>()
    for (const r of recRows ?? []) latestByKey.set(`${r.user_id}|${r.competency_id}`, r.observed_at)

    for (const s of students) {
      const rungs: RungInput[] = []
      for (const c of competencies) {
        const key = `${s.id}|${c.id}`
        const levels = levelsByKey.get(key) ?? []
        cells[s.id][c.id] = {
          value: levels.length ? decayingAverage(levels) : null,
          count: levels.length,
          pending: pendingByKey.get(key) ?? 0,
          state: levels.length ? rungState(levels) : null,
        }
        rungs.push({ id: c.id, sequence: c.sequence, levels, latestObservedAt: latestByKey.get(key) ?? null })
      }
      const pick = pickTargetRung(rungs)
      currentRung[s.id] = pick ? { competencyId: pick.id, kind: pick.kind } : null
    }
  }

  return NextResponse.json({ competencies, students, cells, currentRung })
})
