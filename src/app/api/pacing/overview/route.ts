import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { computeFromElapsed, unitItems, totalPlanDays, elapsedInstructionalDays, PlanItem } from '@/lib/pacing'
import { loadPlanItems, furthestActiveItem, loadRotationCalendar, isRotationConfigured, asProgram, type Program } from '@/lib/pacing-server'
import { Block, blockMeetingsElapsed } from '@/lib/rotation'

// GET /api/pacing/overview (ADMIN) — every section inside its CURRENT UNIT, in
// one pass. Same unit-level model as /api/pacing/section: a section with no
// unit or no unit start date can't be placed yet.

type CourseRow = { id: string; name: string | null; section: string | null; teacher_email: string | null; program: string | null }
type CsRow = { course_id: string; student_id: string }
type BrRow = { user_id: string; lesson_id: string }
type SchedRow = { course_id: string; block: string | null }
type PacingRow = { course_id: string; current_lesson_id: string | null; current_unit_id: string | null; unit_start_date: string | null; source: 'auto' | 'confirmed' }

export const GET = withAuth(async (_request, ctx) => {
    if (ctx.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    const [coursesRes, csRes, schedRes, pacingRes, cal] = await Promise.all([
      supabaseAdmin.from('courses').select('id, name, section, teacher_email, program').order('teacher_email', { ascending: true }),
      supabaseAdmin.from('course_students').select('course_id, student_id'),
      supabaseAdmin.from('section_schedules').select('course_id, block'),
      supabaseAdmin.from('section_pacing').select('course_id, current_lesson_id, current_unit_id, unit_start_date, source'),
      loadRotationCalendar(),
    ])
    const rotationOn = isRotationConfigured(cal)

    const courses = (coursesRes.data ?? []) as CourseRow[]
    const courseStudents = (csRes.data ?? []) as CsRow[]
    const scheds = (schedRes.data ?? []) as SchedRow[]
    const pacings = (pacingRes.data ?? []) as PacingRow[]

    // One plan per program actually in use.
    const programs = [...new Set(courses.map((c) => asProgram(c.program)))]
    const planByProgram = new Map<Program, PlanItem[]>()
    for (const p of programs) planByProgram.set(p, await loadPlanItems(p))

    // courseId -> student ids (course_students.student_id IS the work-table user_id)
    const gidsByCourse = new Map<string, Set<string>>()
    for (const cs of courseStudents) {
      if (!cs.student_id) continue
      const set = gidsByCourse.get(cs.course_id) ?? new Set<string>()
      set.add(cs.student_id)
      gidsByCourse.set(cs.course_id, set)
    }

    // gid -> set(lessonId) from block activity
    const allGids = [...new Set([...gidsByCourse.values()].flatMap((s) => [...s]))]
    const lessonsByGid = new Map<string, Set<string>>()
    if (allGids.length > 0) {
      const { data: br } = await supabaseAdmin.from('block_responses').select('user_id, lesson_id').in('user_id', allGids)
      for (const r of (br ?? []) as BrRow[]) {
        const set = lessonsByGid.get(r.user_id) ?? new Set<string>()
        set.add(r.lesson_id)
        lessonsByGid.set(r.user_id, set)
      }
    }

    const schedByCourse = new Map<string, SchedRow>(scheds.map((s) => [s.course_id, s]))
    const pacingByCourse = new Map<string, PacingRow>(pacings.map((p) => [p.course_id, p]))
    const today = new Date()

    const rows = courses.map((c) => {
      const program = asProgram(c.program)
      const items = planByProgram.get(program) ?? []
      const pr = pacingByCourse.get(c.id) ?? null
      const block = (schedByCourse.get(c.id)?.block as Block | null) ?? null
      const unitId = pr?.current_unit_id ?? null
      const unitStart = pr?.unit_start_date ?? null

      const active = new Set<string>()
      for (const gid of gidsByCourse.get(c.id) ?? []) for (const lid of lessonsByGid.get(gid) ?? []) active.add(lid)
      const auto = furthestActiveItem(items, active)

      const ui = unitId ? unitItems(items, unitId) : []
      const confirmedItem = pr?.current_lesson_id ? (ui.find((i) => i.lessonId === pr.current_lesson_id) ?? null) : null
      const autoInUnit = auto && unitId && auto.unitId === unitId ? (ui.find((i) => i.lessonId === auto.lessonId) ?? null) : null
      const actual = confirmedItem ? { item: confirmedItem, source: 'confirmed' as const } : autoInUnit ? { item: autoInUnit, source: 'auto' as const } : { item: null, source: 'none' as const }

      const started = Boolean(unitStart) && today >= new Date(unitStart + 'T00:00:00Z')
      let elapsed = 0
      if (started && unitStart) {
        elapsed = rotationOn && block
          ? blockMeetingsElapsed(cal, block, unitStart, today)
          : elapsedInstructionalDays({ start_date: unitStart, meeting_days: [1, 2, 3, 4, 5], no_school_dates: cal.no_school_dates }, today)
      }
      const result = ui.length > 0 ? computeFromElapsed(ui, elapsed, started, actual) : computeFromElapsed([], 0, false, actual)

      return {
        courseId: c.id,
        name: c.name ?? 'Class',
        section: c.section,
        teacher: c.teacher_email,
        program,
        block,
        unitName: ui[0]?.unitName ?? null,
        unitStartDate: unitStart,
        unitTotalDays: totalPlanDays(ui),
        hasUnit: ui.length > 0 && Boolean(unitStart),
        students: (gidsByCourse.get(c.id) ?? new Set()).size,
        ...result,
      }
    })

    // most-behind first, then unplaced, then the rest
    rows.sort((a, b) => {
      const rank = (s: string) => (s === 'behind' ? 0 : s === 'unknown' ? 1 : s === 'on' ? 2 : 3)
      if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status)
      return a.deltaDays - b.deltaDays
    })

    return NextResponse.json({ rows })
})
