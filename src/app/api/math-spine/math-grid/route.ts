import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveRosterScope } from '@/lib/teacher-scope'
import { decayingAverage, MathStrand } from '@/data/curriculum-types'

// GET /api/math-spine/math-grid[?class=<courseId>]
// The control-room "Math" view: every roster student x every active competency,
// with the rolled-up whole-year value per cell (decaying average) and a count of
// pending warm-up submissions awaiting review. Mirrors /api/mastery/grid.
type StudentRow = { google_user_id: string | null; name: string; email: string }

export const GET = withAuth(async (request, ctx) => {
  const role = ctx.role
  if (role !== 'admin' && role !== 'teacher') {
    return NextResponse.json({ error: 'Only teachers can view the grid' }, { status: 403 })
  }
  const classId = new URL(request.url).searchParams.get('class')

  // Competencies (active), ordered for a stable column layout.
  const { data: compRows } = await supabaseAdmin
    .from('math_competencies')
    .select('id, code, statement, strand, order_index')
    .eq('is_active', true)
    .order('strand', { ascending: true })
    .order('order_index', { ascending: true })
  const competencies = (compRows ?? []).map((c) => ({
    id: c.id,
    code: c.code,
    statement: c.statement,
    strand: c.strand as MathStrand,
  }))
  const competencyIds = competencies.map((c) => c.id)

  // Students (same scoping as the rest of the control room).
  let sQuery = supabaseAdmin.from('students').select('google_user_id, name, email').order('name', { ascending: true })
  const scope = await resolveRosterScope({ classId, role, scopeEmail: ctx.scopeEmail })
  if (scope.gids) sQuery = sQuery.in('google_user_id', scope.gids)
  const { data: sr } = await sQuery
  const students = ((sr ?? []) as StudentRow[])
    .filter((s) => s.google_user_id)
    .map((s) => ({ id: s.google_user_id as string, name: s.name, email: s.email }))
  const studentIds = students.map((s) => s.id)

  const cells: Record<string, Record<string, { value: number | null; count: number; pending: number }>> = {}
  for (const s of students) cells[s.id] = {}

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

    for (const s of students) {
      for (const c of competencies) {
        const key = `${s.id}|${c.id}`
        const levels = levelsByKey.get(key) ?? []
        cells[s.id][c.id] = {
          value: levels.length ? decayingAverage(levels) : null,
          count: levels.length,
          pending: pendingByKey.get(key) ?? 0,
        }
      }
    }
  }

  return NextResponse.json({ competencies, students, cells })
})
