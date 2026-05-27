import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getEffectiveContext } from '@/lib/effective-context'
import { resolveRosterScope } from '@/lib/teacher-scope'

// GET /api/mastery/lesson-grid?unit_id=unit-1
// The COMPLETION lens for the control room: every roster student x every
// published lesson in the unit, with each cell's completion status (from
// lesson_progress) and a "needs grading" flag (the student has submitted work
// for that lesson newer than the teacher's latest rating on the lesson's target).
// Each lesson also carries its targetId so a cell-click can open the same
// rate-from-work drawer the mastery grid uses.

type StudentRow = { google_user_id: string | null; name: string; email: string; first_name: string | null; last_name: string | null }
type UnitRow = { id: string; name: string; order_index: number }
type LessonRow = { id: string; slug: string; title: string; lesson_number: number }
type TargetRow = { id: string; lesson_id: string | null; order_index: number }
type ProgRow = { user_id: string; lesson_id: string; status: string | null; progress_percentage: number | null }
type RespRow = { user_id: string; lesson_id: string; created_at: string }
type GbRow = { user_id: string; item_id: string; percentage: number | null; graded_at: string | null }

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ctx = await getEffectiveContext(session.user.email)
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can view the grid' }, { status: 403 })
    }

    const lgParams = new URL(request.url).searchParams
    const unitId = lgParams.get('unit_id') ?? 'unit-1'
    const classId = lgParams.get('class')

    const { data: unitRowsRaw } = await supabaseAdmin.from('units').select('id, name, order_index').order('order_index', { ascending: true })
    const units = ((unitRowsRaw ?? []) as UnitRow[]).map((u) => ({ id: u.id, name: u.name }))
    const unitName = ((unitRowsRaw ?? []) as UnitRow[]).find((u) => u.id === unitId)?.name ?? null

    // published lessons in the unit, in teaching order
    let lessons: LessonRow[] = []
    if (unitName) {
      const { data: lr } = await supabaseAdmin
        .from('lessons')
        .select('id, slug, title, lesson_number')
        .eq('unit', unitName)
        .eq('published', true)
        .order('lesson_number', { ascending: true })
      lessons = (lr ?? []) as LessonRow[]
    }
    const lessonIds = lessons.map((l) => l.id)

    // lesson -> target (first target mapped to each lesson)
    const { data: tr } = await supabaseAdmin
      .from('learning_targets')
      .select('id, lesson_id, order_index')
      .eq('unit_id', unitId)
      .order('order_index', { ascending: true })
    const lessonTarget = new Map<string, string>()
    for (const t of (tr ?? []) as TargetRow[]) {
      if (t.lesson_id && !lessonTarget.has(t.lesson_id)) lessonTarget.set(t.lesson_id, t.id)
    }

    // roster (same scoping as the mastery grid)
    let sQuery = supabaseAdmin.from('students').select('google_user_id, name, email, first_name, last_name').order('name', { ascending: true })
    const scope = await resolveRosterScope({ classId, role: ctx.role, scopeEmail: ctx.scopeEmail })
    if (scope.gids) sQuery = sQuery.in('google_user_id', scope.gids)
    const { data: srRaw } = await sQuery
    const students = ((srRaw ?? []) as StudentRow[]).filter((s) => s.google_user_id).map((s) => ({ id: s.google_user_id as string, name: s.name, email: s.email, firstName: s.first_name, lastName: s.last_name }))
    const studentIds = students.map((s) => s.id)

    const noData = lessonIds.length === 0 || studentIds.length === 0
    const progByKey = new Map<string, { status: string; pct: number }>()
    const respLatest = new Map<string, string>()                       // student|lesson -> latest response ts
    const gradeByKey = new Map<string, { pct: number | null; at: string | null }>() // student|lesson -> gradebook score

    if (!noData) {
      const { data: pr } = await supabaseAdmin.from('lesson_progress')
        .select('user_id, lesson_id, status, progress_percentage').in('user_id', studentIds).in('lesson_id', lessonIds)
      for (const p of (pr ?? []) as ProgRow[]) progByKey.set(`${p.user_id}|${p.lesson_id}`, { status: p.status ?? 'in_progress', pct: Number(p.progress_percentage ?? 0) })

      const { data: rr } = await supabaseAdmin.from('block_responses')
        .select('user_id, lesson_id, created_at').in('user_id', studentIds).in('lesson_id', lessonIds)
        .order('created_at', { ascending: true })
      for (const r of (rr ?? []) as RespRow[]) respLatest.set(`${r.user_id}|${r.lesson_id}`, r.created_at) // asc → last wins = latest

      // gradebook scores for completion grading (item_type 'lesson', item_id = lesson uuid)
      const { data: gb } = await supabaseAdmin.from('gradebook_entries')
        .select('user_id, item_id, percentage, graded_at').eq('item_type', 'lesson').in('user_id', studentIds).in('item_id', lessonIds)
      for (const g of (gb ?? []) as GbRow[]) gradeByKey.set(`${g.user_id}|${g.item_id}`, { pct: g.percentage, at: g.graded_at })
    }

    const cells: Record<string, Record<string, { status: string; pct: number; needsGrading: boolean; gradePct: number | null }>> = {}
    for (const s of students) {
      const row: Record<string, { status: string; pct: number; needsGrading: boolean; gradePct: number | null }> = {}
      for (const l of lessons) {
        const prog = progByKey.get(`${s.id}|${l.id}`)
        const status = prog?.status ?? 'not_started'
        const pct = prog?.pct ?? 0
        const latestResp = respLatest.get(`${s.id}|${l.id}`)
        const grade = gradeByKey.get(`${s.id}|${l.id}`)
        // needs grading = work submitted, and not yet gradebook-scored (or work is newer than the score)
        const needsGrading = !!latestResp && (!grade || !grade.at || latestResp > grade.at)
        row[l.id] = { status, pct, needsGrading, gradePct: grade?.pct ?? null }
      }
      cells[s.id] = row
    }

    return NextResponse.json({
      unitId, units,
      lessons: lessons.map((l) => ({ id: l.id, slug: l.slug, title: l.title, lessonNumber: l.lesson_number, targetId: lessonTarget.get(l.id) ?? null })),
      students,
      cells,
    })
  } catch (error) {
    console.error('Error in GET /api/mastery/lesson-grid:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
