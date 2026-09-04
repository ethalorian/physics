import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { lessonsByTarget } from '@/lib/lesson-targets'
import { targetValue, MasteryRecord } from '@/data/curriculum-types'
import { resolveRosterScope, getTeacherStudentGids } from '@/lib/teacher-scope'
import { currentUnitForCourse } from '@/lib/pacing-server'

// GET /api/mastery/grid?unit_id=unit-1
// Class mastery grid: every student (the teacher's roster) x every learning target
// in a unit, with the current rolled-up level per cell (decaying average of the
// student's records for that target). Powers the teacher control room centerpiece.

type StudentRow = { id: string | null; name: string; email: string }
type TargetRow = { id: string; statement: string; domain: string; order_index: number }
type RecordRow = { user_id: string; target_id: string; level: number; observed_at: string }
type UnitRow = { id: string; name: string; order_index: number; program: string | null }

export const GET = withAuth(async (request, ctx) => {
    const role = ctx.role
    if (role !== 'admin' && role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can view the grid' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('class')
    // unit_id=auto → the unit the picked class is working in (its program's, never
    // physics unit-1 for a Trades / Project Physics class). Echoed back as `unitId`.
    let unitId = searchParams.get('unit_id') ?? 'unit-1'
    let program: string | null = null
    if (classId) {
      const cur = await currentUnitForCourse(classId)
      program = cur.program
      if (unitId === 'auto' || !unitId) unitId = cur.unitId ?? 'unit-1'
    } else if (unitId === 'auto') unitId = 'unit-1'

    // Units (for the switcher)
    const { data: unitRowsRaw } = await supabaseAdmin
      .from('units')
      .select('id, name, order_index, program')
      .order('program', { ascending: true })
      .order('order_index', { ascending: true })
    // Both programs are listed (staff see everything); `label` carries the
    // program tag so pickers make Trades units unmistakable.
    const units = ((unitRowsRaw ?? []) as UnitRow[])
      .sort((a, b) => ((a.program ?? 'physics') === 'physics' ? 0 : 1) - ((b.program ?? 'physics') === 'physics' ? 0 : 1) || a.order_index - b.order_index)
      .map((u) => ({ id: u.id, name: u.name, program: u.program ?? 'physics', label: `${(u.program ?? 'physics') === 'trades' ? 'Trades' : (u.program ?? 'physics') === 'projects' ? 'Projects' : 'Physics'} · ${u.name}` }))

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
      .select('id, name, email')
      .order('name', { ascending: true })
    const scope = await resolveRosterScope({ classId, role, scopeEmail: ctx.scopeEmail, teacherEmail: searchParams.get('teacher') })
    if (scope.gids) sQuery = sQuery.in('id', scope.gids)
    const { data: studentRowsRaw } = await sQuery
    // ratable = on the ACTOR'S own roster. Everyone else is view-only data.
    const own = new Set(await getTeacherStudentGids(ctx.scopeEmail))
    const students = ((studentRowsRaw ?? []) as StudentRow[])
      .filter((s) => s.id)
      .map((s) => ({ id: s.id as string, name: s.name, email: s.email, ratable: own.has(s.id as string) }))
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

    // Per-target "needs grading": the student has submitted work on the target's
    // lesson that's newer than the teacher's latest rating on that target. Mirrors
    // the lessons grid's needsGrading so the control room can grade student-first.
    // A target's work can live on several lessons (MVP day lessons share their
    // week's targets), so map target → every carrier (lib/lesson-targets).
    let targetLessons = new Map<string, string[]>()
    {
      const { data: tl } = await supabaseAdmin
        .from('learning_targets')
        .select('id, slug, lesson_id')
        .eq('unit_id', unitId)
      const { data: ul } = await supabaseAdmin.from('lessons').select('id, content_blocks').eq('unit_id', unitId)
      targetLessons = lessonsByTarget(
        (ul ?? []) as { id: string; content_blocks?: { blocks?: unknown[] } | null }[],
        (tl ?? []) as { id: string; slug: string; lesson_id: string | null }[],
      )
    }
    const lessonIdsForPending = [...new Set([...targetLessons.values()].flat())]
    const latestRespByKey = new Map<string, number>() // student|lesson -> ts
    if (lessonIdsForPending.length > 0 && studentIds.length > 0) {
      const { data: rr } = await supabaseAdmin
        .from('block_responses')
        .select('user_id, lesson_id, created_at')
        .in('user_id', studentIds)
        .in('lesson_id', lessonIdsForPending)
      for (const r of (rr ?? []) as { user_id: string; lesson_id: string; created_at: string }[]) {
        const t = new Date(r.created_at).getTime()
        const k = `${r.user_id}|${r.lesson_id}`
        if (t > (latestRespByKey.get(k) ?? 0)) latestRespByKey.set(k, t)
      }
    }
    const lastRatedByKey = new Map<string, number>() // student|target -> ts
    for (const r of records) {
      const k = `${r.user_id}|${r.target_id}`
      const t = new Date(r.observed_at).getTime()
      if (t > (lastRatedByKey.get(k) ?? 0)) lastRatedByKey.set(k, t)
    }
    const pending: Record<string, Record<string, boolean>> = {}
    for (const s of students) {
      for (const t of targets) {
        const lids = targetLessons.get(t.id) ?? []
        if (lids.length === 0) continue
        const submittedAt = Math.max(0, ...lids.map((lid) => latestRespByKey.get(`${s.id}|${lid}`) ?? 0))
        if (!submittedAt) continue
        const ratedAt = lastRatedByKey.get(`${s.id}|${t.id}`) ?? 0
        if (submittedAt > ratedAt) (pending[s.id] ??= {})[t.id] = true
      }
    }

    return NextResponse.json({
      unitId,
      program,
      units,
      targets: targets.map((t) => ({ id: t.id, statement: t.statement, domain: t.domain })),
      students,
      cells,
      pending,
    })
})
