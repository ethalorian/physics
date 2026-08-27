import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { computeFromElapsed, unitItems, totalPlanDays, elapsedInstructionalDays, suggestCuts, PlanItem } from '@/lib/pacing'
import { loadPlanItems, loadUnits, loadCourseProgram, getCourseStudentGids, autoSuggestItem, loadRotationCalendar, isRotationConfigured, asProgram, PROGRAMS, patternFromRow } from '@/lib/pacing-server'
import { isBlock, isOnWeek, sectionMeetingsElapsed, upcomingSectionMeetings, nextOnWeekMonday } from '@/lib/rotation'

// GET  /api/pacing/section?course_id=... — where one section is inside its CURRENT UNIT
// POST /api/pacing/section { course_id, program?, blocks?, week_pattern?, current_unit_id?, unit_start_date?, current_lesson_id? }
//
// UNIT-LEVEL ONLY. A section is placed by (unit, unit start date, current
// lesson). Elapsed = this section's MEETINGS since the unit started (its blocks
// in the rotation, on its weeks — MVP sections are B+C on alternate weeks),
// or school weekdays when the rotation isn't configured. No-school dates and
// the alternating-week anchor come from the school-wide rotation calendar.

type CourseRow = { id: string; teacher_email: string | null }
type ScheduleRow = { block: string | null; blocks: string[] | null; week_pattern: string | null; on_week_anchor: string | null }
type PacingRow = { current_lesson_id: string | null; current_unit_id: string | null; source: 'auto' | 'confirmed'; unit_start_date: string | null }

async function canAccessCourse(courseId: string, email: string, role: string): Promise<boolean> {
  if (role === 'admin') return true
  const { data } = await supabaseAdmin.from('courses').select('id, teacher_email').eq('id', courseId).maybeSingle()
  return Boolean((data as CourseRow | null)?.teacher_email === email)
}

export const GET = withAuth(async (request, ctx) => {
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const courseId = new URL(request.url).searchParams.get('course_id')
    if (!courseId) return NextResponse.json({ error: 'course_id required' }, { status: 400 })
    if (!(await canAccessCourse(courseId, ctx.scopeEmail, ctx.role))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const program = await loadCourseProgram(courseId)
    const [items, units, { data: schedRow }, { data: pacingRow }, gids, cal] = await Promise.all([
      loadPlanItems(program),
      loadUnits(program),
      supabaseAdmin.from('section_schedules').select('block, blocks, week_pattern, on_week_anchor').eq('course_id', courseId).maybeSingle(),
      supabaseAdmin.from('section_pacing').select('current_lesson_id, current_unit_id, source, unit_start_date').eq('course_id', courseId).maybeSingle(),
      getCourseStudentGids(courseId),
      loadRotationCalendar(),
    ])

    const pr = (pacingRow as PacingRow | null) ?? null
    const pattern = patternFromRow(schedRow as ScheduleRow | null, program)
    const rotationOn = pattern.blocks.length > 0 && isRotationConfigured(cal)
    const today = new Date()
    const dayOn = (d: Date) => isOnWeek(cal, pattern, d)

    const currentUnitId = pr?.current_unit_id ?? null
    const unitStart = pr?.unit_start_date ?? null
    const currentLessonId = pr?.current_lesson_id ?? null

    // Where student work says the class is (furthest lesson with block activity).
    const auto = await autoSuggestItem(items, gids)

    let unitResult: ReturnType<typeof computeFromElapsed> | null = null
    let unitName: string | null = null
    let unitTotalDays = 0
    let ui: PlanItem[] = []
    let actual: { item: PlanItem | null; source: 'auto' | 'confirmed' | 'none' } = { item: null, source: 'none' }
    if (currentUnitId) {
      ui = unitItems(items, currentUnitId)
      if (ui.length > 0) {
        unitName = ui[0].unitName
        unitTotalDays = totalPlanDays(ui)
        const confirmedItem = currentLessonId ? (ui.find((i) => i.lessonId === currentLessonId) ?? null) : null
        const autoInUnit = auto && auto.unitId === currentUnitId ? (ui.find((i) => i.lessonId === auto.lessonId) ?? null) : null
        actual = confirmedItem ? { item: confirmedItem, source: 'confirmed' } : autoInUnit ? { item: autoInUnit, source: 'auto' } : { item: null, source: 'none' }
        const startedUnit = Boolean(unitStart) && today >= new Date(unitStart + 'T00:00:00Z')
        let uElapsed = 0
        if (startedUnit && unitStart) {
          uElapsed = rotationOn
            ? sectionMeetingsElapsed(cal, pattern, unitStart, today)
            : elapsedInstructionalDays({ start_date: unitStart, meeting_days: [1, 2, 3, 4, 5], no_school_dates: cal.no_school_dates }, today, dayOn)
        }
        unitResult = computeFromElapsed(ui, uElapsed, startedUnit, actual)
      }
    }

    // Behind? Name the flex days ahead that would close the gap.
    const deficitDays = unitResult && unitResult.status === 'behind' ? Math.abs(unitResult.deltaDays) : 0
    const cuts = deficitDays > 0 ? suggestCuts(ui, actual.item?.index ?? null, deficitDays) : []

    // Lessons lined up against the next class meetings (rotation only), from
    // wherever the class actually is in the unit.
    let lineup: { date: string; block: string; long: boolean; title: string; index: number }[] = []
    if (rotationOn && ui.length > 0) {
      const meetings = upcomingSectionMeetings(cal, pattern, today, 12)
      const startDay = actual.item?.cumStart ?? 0
      lineup = meetings.map((m, k) => {
        const dayPos = startDay + k
        const it = ui.find((i) => dayPos < i.cumStart + i.plannedDays) ?? ui[ui.length - 1]
        return { date: m.date, block: m.block, long: m.long, title: it?.title ?? '—', index: it?.index ?? -1 }
      })
    }

    return NextResponse.json({
      program,
      items: items.map((i) => ({ index: i.index, title: i.title, lessonId: i.lessonId, unitId: i.unitId, unitOrder: i.unitOrder, kind: i.kind, plannedDays: i.plannedDays, lessonNumber: i.lessonNumber, core: i.core })),
      units: units.map((u) => ({ id: u.id, name: u.name, allottedDays: u.allotted_days, defaultStartDate: u.default_start_date })),
      block: pattern.blocks[0] ?? null,
      blocks: pattern.blocks,
      weekPattern: pattern.weekPattern,
      onWeekAnchor: pattern.onWeekAnchor ?? null,
      countMode: pattern.countMode ?? 'meetings',
      nextOnWeek: nextOnWeekMonday(cal, pattern, today),
      thisWeekOn: isOnWeek(cal, pattern, today),
      rotationConfigured: isRotationConfigured(cal),
      confirmed: pr?.source === 'confirmed',
      lineup,
      unitResult,
      unitName,
      unitTotalDays,
      currentUnitId,
      unitStartDate: unitStart,
      currentLessonId,
      // What student activity suggests, so the teacher can accept it in one click.
      autoLessonId: auto?.lessonId ?? null,
      autoUnitId: auto?.unitId ?? null,
      autoTitle: auto?.title ?? null,
      // Flex lessons ahead of the current position that would cover the deficit.
      deficitDays,
      suggestedCuts: cuts.map((c) => ({ lessonId: c.lessonId, title: c.title, lessonNumber: c.lessonNumber, plannedDays: c.plannedDays })),
      flexAhead: ui.filter((i) => i.kind === 'lesson' && !i.core && i.index > (actual.item?.index ?? -1)).length,
    })
})

export const POST = withAuth(async (request, ctx) => {
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = (await request.json()) as {
      course_id: string
      program?: string | null
      block?: string | null
      blocks?: string[] | null
      week_pattern?: string | null
      on_week_anchor?: string | null
      current_unit_id?: string | null
      current_lesson_id?: string | null
      unit_start_date?: string | null
    }
    if (!body.course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })
    if (!(await canAccessCourse(body.course_id, ctx.scopeEmail, ctx.role))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Program change first — it decides which units are valid below.
    if (body.program !== undefined && body.program !== null) {
      if (!PROGRAMS.includes(asProgram(body.program)) || asProgram(body.program) !== body.program) {
        return NextResponse.json({ error: 'program must be physics or trades' }, { status: 400 })
      }
      const { error } = await supabaseAdmin.from('courses').update({ program: body.program }).eq('id', body.course_id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // The unit must belong to the course's program.
    if (body.current_unit_id) {
      const program = await loadCourseProgram(body.course_id)
      const { data: u } = await supabaseAdmin.from('units').select('id').eq('id', body.current_unit_id).eq('program', program).maybeSingle()
      if (!u) return NextResponse.json({ error: 'That unit is not in this class’s program' }, { status: 400 })
    }

    const row = {
      course_id: body.course_id,
      current_lesson_id: body.current_lesson_id ?? null,
      current_unit_id: body.current_unit_id ?? null,
      unit_start_date: body.unit_start_date ?? null,
      source: 'confirmed' as const,
      confirmed_by: ctx.email,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabaseAdmin.from('section_pacing').upsert(row, { onConflict: 'course_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // The meeting pattern lives on section_schedules (needed to count meetings).
    if (body.blocks !== undefined || body.block !== undefined || body.week_pattern !== undefined || body.on_week_anchor !== undefined) {
      const raw = body.blocks !== undefined ? (body.blocks ?? []) : (body.block ? [body.block] : [])
      const blocks = [...new Set(raw.map((b) => String(b).toUpperCase()))]
      if (!blocks.every(isBlock)) return NextResponse.json({ error: 'Blocks must be A–G' }, { status: 400 })
      const weekPattern = body.week_pattern === 'alternate' ? 'alternate' : 'every'
      const onWeekAnchor = body.on_week_anchor && /^\d{4}-\d{2}-\d{2}$/.test(body.on_week_anchor) ? body.on_week_anchor : null
      const { error: sErr } = await supabaseAdmin.from('section_schedules')
        .upsert({ course_id: body.course_id, block: blocks[0] ?? null, blocks, week_pattern: weekPattern, on_week_anchor: onWeekAnchor, updated_at: new Date().toISOString() }, { onConflict: 'course_id' })
      if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
})
