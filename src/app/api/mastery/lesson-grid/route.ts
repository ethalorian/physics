import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getEffectiveContext } from '@/lib/effective-context'
import { getTeacherStudentGids } from '@/lib/teacher-scope'

// GET /api/mastery/lesson-grid?unit_id=unit-1
// The COMPLETION lens for the control room: every roster student x every
// published lesson in the unit, with each cell's completion status (from
// lesson_progress) and a "needs grading" flag (the student has submitted work
// for that lesson newer than the teacher's latest rating on the lesson's target).
// Each lesson also carries its targetId so a cell-click can open the same
// rate-from-work drawer the mastery grid uses.

type StudentRow = { google_user_id: string | null; name: string; email: string }
type UnitRow = { id: string; name: string; order_index: number }
type LessonRow = { id: string; slug: string; title: string; lesson_number: number }
type TargetRow = { id: string; lesson_id: string | null; order_index: number }
type ProgRow = { user_id: string; lesson_id: string; status: string | null; progress_percentage: number | null }
type RespRow = { user_id: string; lesson_id: string; created_at: string }
type RecRow = { user_id: string; target_id: string; observed_at: string }

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ctx = await getEffectiveContext(session.user.email)
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can view the grid' }, { status: 403 })
    }

    const unitId = new URL(request.url).searchParams.get('unit_id') ?? 'unit-1'

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
    let sQuery = supabaseAdmin.from('students').select('google_user_id, name, email').order('name', { ascending: true })
    if (ctx.role === 'teacher') sQuery = sQuery.in('google_user_id', await getTeacherStudentGids(ctx.scopeEmail))
    const { data: srRaw } = await sQuery
    const students = ((srRaw ?? []) as StudentRow[]).filter((s) => s.google_user_id).map((s) => ({ id: s.google_user_id as string, name: s.name, email: s.email }))
    const studentIds = students.map((s) => s.id)

    const noData = lessonIds.length === 0 || studentIds.length === 0
    const progByKey = new Map<string, { status: string; pct: number }>()
    const respLatest = new Map<string, string>()    // student|lesson -> latest response ts
    const rateLatest = new Map<string, string>()     // student|target -> latest rating ts

    if (!noData) {
      const { data: pr } = await supabaseAdmin.from('lesson_progress')
        .select('user_id, lesson_id, status, progress_percentage').in('user_id', studentIds).in('lesson_id', lessonIds)
      for (const p of (pr ?? []) as ProgRow[]) progByKey.set(`${p.user_id}|${p.lesson_id}`, { status: p.status ?? 'in_progress', pct: Number(p.progress_percentage ?? 0) })

      const { data: rr } = await supabaseAdmin.from('block_responses')
        .select('user_id, lesson_id, created_at').in('user_id', studentIds).in('lesson_id', lessonIds)
        .order('created_at', { ascending: true })
      for (const r of (rr ?? []) as RespRow[]) respLatest.set(`${r.user_id}|${r.lesson_id}`, r.created_at) // asc → last wins = latest

      const targetIds = Array.from(new Set(Array.from(lessonTarget.values())))
      if (targetIds.length > 0) {
        const { data: mr } = await supabaseAdmin.from('mastery_records')
          .select('user_id, target_id, observed_at').in('user_id', studentIds).in('target_id', targetIds)
          .order('observed_at', { ascending: true })
        for (const m of (mr ?? []) as RecRow[]) rateLatest.set(`${m.user_id}|${m.target_id}`, m.observed_at)
      }
    }

    const cells: Record<string, Record<string, { status: string; pct: number; needsGrading: boolean }>> = {}
    for (const s of students) {
      const row: Record<string, { status: string; pct: number; needsGrading: boolean }> = {}
      for (const l of lessons) {
        const prog = progByKey.get(`${s.id}|${l.id}`)
        const status = prog?.status ?? 'not_started'
        const pct = prog?.pct ?? 0
        const latestResp = respLatest.get(`${s.id}|${l.id}`)
        const tId = lessonTarget.get(l.id)
        const latestRate = tId ? rateLatest.get(`${s.id}|${tId}`) : undefined
        const needsGrading = !!latestResp && (!latestRate || latestResp > latestRate)
        row[l.id] = { status, pct, needsGrading }
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
