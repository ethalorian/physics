import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { computePacing, computeFromElapsed, unitItems, totalPlanDays, elapsedInstructionalDays, PlanItem, Schedule } from '@/lib/pacing'
import { loadPlanItems, getCourseStudentGids, autoSuggestItem, loadRotationCalendar, isRotationConfigured } from '@/lib/pacing-server'
import { Block, blockMeetingsElapsed, upcomingMeetings } from '@/lib/rotation'

// GET  /api/pacing/section?course_id=... — planned-vs-actual for one section
// POST /api/pacing/section { course_id, current_lesson_id?, current_unit_order? } — teacher confirms/adjusts position

type CourseRow = { id: string; teacher_email: string | null }
type ScheduleRow = { start_date: string | null; meeting_days: number[] | null; no_school_dates: string[] | null; block: string | null }
type PacingRow = { current_lesson_id: string | null; current_unit_order: number | null; source: 'auto' | 'confirmed'; unit_start_date: string | null }

async function canAccessCourse(courseId: string, email: string, role: string): Promise<boolean> {
  if (role === 'admin') return true
  const { data } = await supabaseAdmin.from('courses').select('id, teacher_email').eq('id', courseId).maybeSingle()
  return Boolean((data as CourseRow | null)?.teacher_email === email)
}

function resolveActual(items: PlanItem[], pacing: PacingRow | null, auto: PlanItem | null): { item: PlanItem | null; source: 'auto' | 'confirmed' | 'none' } {
  if (pacing?.source === 'confirmed') {
    if (pacing.current_lesson_id) {
      const it = items.find((i) => i.lessonId === pacing.current_lesson_id)
      if (it) return { item: it, source: 'confirmed' }
    }
    if (pacing.current_unit_order != null) {
      const it = items.find((i) => i.kind === 'unit' && i.unitOrder === pacing.current_unit_order)
      if (it) return { item: it, source: 'confirmed' }
    }
  }
  if (auto) return { item: auto, source: 'auto' }
  return { item: null, source: 'none' }
}

export const GET = withAuth(async (request, ctx) => {
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const courseId = new URL(request.url).searchParams.get('course_id')
    if (!courseId) return NextResponse.json({ error: 'course_id required' }, { status: 400 })
    if (!(await canAccessCourse(courseId, ctx.scopeEmail, ctx.role))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const items = await loadPlanItems()
    const [{ data: schedRow }, { data: pacingRow }, gids, cal] = await Promise.all([
      supabaseAdmin.from('section_schedules').select('start_date, meeting_days, no_school_dates, block').eq('course_id', courseId).maybeSingle(),
      supabaseAdmin.from('section_pacing').select('current_lesson_id, current_unit_order, source, unit_start_date').eq('course_id', courseId).maybeSingle(),
      getCourseStudentGids(courseId),
      loadRotationCalendar(),
    ])
    const auto = await autoSuggestItem(items, gids)
    const sr = schedRow as ScheduleRow | null

    const schedule: Schedule | null = sr
      ? { start_date: sr.start_date, meeting_days: sr.meeting_days ?? [1, 2, 3, 4, 5], no_school_dates: sr.no_school_dates ?? [] }
      : null

    const actual = resolveActual(items, (pacingRow as PacingRow | null) ?? null, auto)
    const today = new Date()
    const block = (sr?.block as Block | null) ?? null
    const rotationOn = Boolean(block) && isRotationConfigured(cal)

    // Rotation path: "elapsed" = number of this block's meetings since start.
    let result
    let lineup: { date: string; long: boolean; title: string; index: number }[] = []
    if (rotationOn && block && sr?.start_date && today >= new Date(sr.start_date + 'T00:00:00Z')) {
      const elapsed = blockMeetingsElapsed(cal, block, sr.start_date, today)
      result = computeFromElapsed(items, elapsed, true, actual)
    } else {
      result = computePacing(items, schedule, today, actual)
    }

    // Lessons lined up against the next class meetings (rotation only).
    if (rotationOn && block) {
      const meetings = upcomingMeetings(cal, block, today, 12)
      const startDay = actual.item?.cumStart ?? 0
      lineup = meetings.map((m, k) => {
        const dayPos = startDay + k
        const it = items.find((i) => dayPos < i.cumStart + i.plannedDays) ?? items[items.length - 1]
        return { date: m.date, long: m.long, title: it?.title ?? '—', index: it?.index ?? -1 }
      })
    }

    // --- Unit-centric pacing (the primary readout) -------------------------
    const pr = pacingRow as PacingRow | null
    const currentUnitOrder = pr?.current_unit_order ?? null
    const unitStart = pr?.unit_start_date ?? null
    const currentLessonId = pr?.current_lesson_id ?? null

    const units = Array.from(new Map(items.map((i) => [i.unitOrder, i.unitName] as const)).entries())
      .map(([order, name]) => ({ order, name }))
      .sort((a, b) => a.order - b.order)

    let unitResult: ReturnType<typeof computeFromElapsed> | null = null
    let unitName: string | null = null
    let unitTotalDays = 0
    if (currentUnitOrder != null) {
      const ui = unitItems(items, currentUnitOrder)
      if (ui.length > 0) {
        unitName = ui[0].unitName
        unitTotalDays = totalPlanDays(ui)
        const uActual = currentLessonId ? (ui.find((i) => i.lessonId === currentLessonId) ?? null) : null
        const startedUnit = Boolean(unitStart) && today >= new Date(unitStart + 'T00:00:00Z')
        let uElapsed = 0
        if (startedUnit && unitStart) {
          uElapsed = rotationOn && block
            ? blockMeetingsElapsed(cal, block, unitStart, today)
            : elapsedInstructionalDays({ start_date: unitStart, meeting_days: schedule?.meeting_days ?? [1, 2, 3, 4, 5], no_school_dates: schedule?.no_school_dates ?? [] }, today)
        }
        unitResult = computeFromElapsed(ui, uElapsed, startedUnit, { item: uActual, source: uActual ? 'confirmed' : 'none' })
      }
    }

    return NextResponse.json({
      result,
      items: items.map((i) => ({ index: i.index, title: i.title, lessonId: i.lessonId, unitOrder: i.unitOrder, kind: i.kind, plannedDays: i.plannedDays, lessonNumber: i.lessonNumber })),
      autoIndex: auto?.index ?? null,
      confirmed: pacingRow?.source === 'confirmed',
      block,
      rotationConfigured: isRotationConfigured(cal),
      lineup,
      schedule: schedule ?? { start_date: null, meeting_days: [1, 2, 3, 4, 5], no_school_dates: [] },
      // unit-centric
      units,
      unitResult,
      unitName,
      unitTotalDays,
      currentUnitOrder,
      unitStartDate: unitStart,
      currentLessonId,
    })
})

export const POST = withAuth(async (request, ctx) => {
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = (await request.json()) as {
      course_id: string
      block?: string | null
      current_lesson_id?: string | null
      current_unit_order?: number | null
      unit_start_date?: string | null
    }
    if (!body.course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })
    if (!(await canAccessCourse(body.course_id, ctx.scopeEmail, ctx.role))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const row = {
      course_id: body.course_id,
      current_lesson_id: body.current_lesson_id ?? null,
      current_unit_order: body.current_unit_order ?? null,
      unit_start_date: body.unit_start_date ?? null,
      source: 'confirmed' as const,
      confirmed_by: ctx.email,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabaseAdmin.from('section_pacing').upsert(row, { onConflict: 'course_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // The rotation block lives on section_schedules (needed to count meetings).
    if (body.block !== undefined) {
      await supabaseAdmin.from('section_schedules')
        .upsert({ course_id: body.course_id, block: body.block || null }, { onConflict: 'course_id' })
        .then(() => {})
    }

    return NextResponse.json({ ok: true })
})
