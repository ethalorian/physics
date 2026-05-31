import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
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

export const GET = withAuth(async (request, ctx) => {
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

    // Per-target "needs grading": the student has submitted work on the target's
    // lesson that's newer than the teacher's latest rating on that target. Mirrors
    // the lessons grid's needsGrading so the control room can grade student-first.
    const targetLesson = new Map<string, string>()
    {
      const { data: tl } = await supabaseAdmin
        .from('learning_targets')
        .select('id, lesson_id')
        .eq('unit_id', unitId)
      for (const t of (tl ?? []) as { id: string; lesson_id: string | null }[]) {
        if (t.lesson_id) targetLesson.set(t.id, t.lesson_id)
      }
    }
    const lessonIdsForPending = [...new Set(targetLesson.values())]
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
        const lid = targetLesson.get(t.id)
        if (!lid) continue
        const submittedAt = latestRespByKey.get(`${s.id}|${lid}`)
        if (!submittedAt) continue
        const ratedAt = lastRatedByKey.get(`${s.id}|${t.id}`) ?? 0
        if (submittedAt > ratedAt) (pending[s.id] ??= {})[t.id] = true
      }
    }

    return NextResponse.json({
      unitId,
      units,
      targets: targets.map((t) => ({ id: t.id, statement: t.statement, domain: t.domain })),
      students,
      cells,
      pending,
    })
})
