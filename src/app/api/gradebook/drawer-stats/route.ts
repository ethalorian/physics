import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getEffectiveContext } from '@/lib/effective-context'
import { resolveRosterScope } from '@/lib/teacher-scope'

// GET /api/gradebook/drawer-stats?user_id=&lesson_id=&unit_id=&class=
// Gradebook-mode analytics for the completion drawer. Everything here is a
// gradebook PERCENTAGE (toward the letter grade) — NOT the formative mastery
// rating — so "one meaning per number" holds. Class figures respect the active
// class/section scope (and the teacher/admin roster scope).

type UnitRow = { id: string; name: string }
type LessonRow = { id: string }
type GbRow = { user_id: string; item_id: string; percentage: number | null }
type ProgRow = { progress_percentage: number | null }

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ctx = await getEffectiveContext(session.user.email)
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const sp = new URL(request.url).searchParams
    const userId = sp.get('user_id')
    const lessonId = sp.get('lesson_id')
    const unitId = sp.get('unit_id') ?? 'unit-1'
    const classId = sp.get('class')
    if (!userId || !lessonId) return NextResponse.json({ error: 'user_id and lesson_id are required' }, { status: 400 })

    // Unit → its published lessons (the denominator for unit averages/progress).
    const { data: unitRows } = await supabaseAdmin.from('units').select('id, name').eq('id', unitId)
    const unitName = ((unitRows ?? []) as UnitRow[])[0]?.name ?? null
    let lessonIds: string[] = []
    if (unitName) {
      const { data: lr } = await supabaseAdmin.from('lessons').select('id').eq('unit', unitName).eq('published', true)
      lessonIds = ((lr ?? []) as LessonRow[]).map((l) => l.id)
    }
    if (lessonIds.length === 0) lessonIds = [lessonId]

    // Who counts toward the "class" figures (respects class + teacher/admin scope).
    const scope = await resolveRosterScope({ classId, role: ctx.role, scopeEmail: ctx.scopeEmail })

    // Gradebook entries for this unit's lessons, scoped to the class roster.
    let gbQuery = supabaseAdmin
      .from('gradebook_entries')
      .select('user_id, item_id, percentage')
      .eq('item_type', 'lesson')
      .eq('status', 'graded')
      .in('item_id', lessonIds)
    if (scope.gids) gbQuery = gbQuery.in('user_id', scope.gids)
    const { data: gbRaw } = await gbQuery
    const rows = (gbRaw ?? []) as GbRow[]

    const pct = (r: GbRow) => (typeof r.percentage === 'number' ? r.percentage : null)
    const studentRows = rows.filter((r) => r.user_id === userId)
    const studentVals = studentRows.map(pct).filter((v): v is number => v != null)
    const studentLessonPct = pct(studentRows.find((r) => r.item_id === lessonId) ?? { user_id: '', item_id: '', percentage: null })

    const classDayVals = rows.filter((r) => r.item_id === lessonId).map(pct).filter((v): v is number => v != null)
    const classUnitVals = rows.map(pct).filter((v): v is number => v != null)

    // This student's completion % on this lesson (from lesson_progress).
    const { data: progRaw } = await supabaseAdmin
      .from('lesson_progress')
      .select('progress_percentage')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle()
    const completionPct = (progRaw as ProgRow | null)?.progress_percentage ?? null

    return NextResponse.json({
      studentLessonPct,
      studentUnitAvg: mean(studentVals),
      classDayAvg: mean(classDayVals),
      classUnitAvg: mean(classUnitVals),
      completionPct,
      unitLessons: lessonIds.length,
      studentGraded: studentVals.length,
      classDayGraded: classDayVals.length,
    })
  } catch (error) {
    console.error('Error in GET /api/gradebook/drawer-stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
