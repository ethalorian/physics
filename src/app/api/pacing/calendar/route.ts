import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { loadPlanItems, loadRotationCalendar } from '@/lib/pacing-server'
import { unitItems } from '@/lib/pacing'

// GET /api/pacing/calendar
// Month-grid data scoped to the viewer's own sections. UNIT-CENTRIC: each section
// carries the lessons of the unit it is currently on, anchored to that unit's
// start date (section_pacing.unit_start_date). A section with no unit/start set
// carries no items and is not placed on the calendar. The client maps meetings →
// lessons using src/lib/rotation.ts.

type CourseRow = { id: string; name: string | null; section: string | null }
type SchedRow = { course_id: string; block: string | null }
type PacingRow = { course_id: string; current_unit_order: number | null; unit_start_date: string | null }

export const GET = withAuth(async (_request, ctx) => {
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: courseRows } = await supabaseAdmin
      .from('courses')
      .select('id, name, section')
      .eq('teacher_email', ctx.scopeEmail)
      .order('section', { ascending: true })
    const courses = (courseRows ?? []) as CourseRow[]
    const courseIds = courses.map((c) => c.id)

    const blockByCourse = new Map<string, string | null>()
    const pacingByCourse = new Map<string, PacingRow>()
    if (courseIds.length > 0) {
      const [{ data: schedRows }, { data: pacingRows }] = await Promise.all([
        supabaseAdmin.from('section_schedules').select('course_id, block').in('course_id', courseIds),
        supabaseAdmin.from('section_pacing').select('course_id, current_unit_order, unit_start_date').in('course_id', courseIds),
      ])
      for (const s of (schedRows ?? []) as SchedRow[]) blockByCourse.set(s.course_id, s.block)
      for (const p of (pacingRows ?? []) as PacingRow[]) pacingByCourse.set(p.course_id, p)
    }

    const planItems = await loadPlanItems()

    const sections = courses.map((c) => {
      const block = blockByCourse.get(c.id) ?? null
      const p = pacingByCourse.get(c.id)
      const unitOrder = p?.current_unit_order ?? null
      const unitStart = p?.unit_start_date ?? null
      // Only sections with a current unit + start date get a placeable sequence.
      const items = unitOrder != null && unitStart
        ? unitItems(planItems, unitOrder).map((i) => ({
            index: i.index, cumStart: i.cumStart, plannedDays: i.plannedDays,
            lessonId: i.lessonId, title: i.title, unitName: i.unitName, kind: i.kind,
          }))
        : []
      return {
        courseId: c.id,
        name: c.name ?? 'Class',
        section: c.section,
        block,
        startDate: unitStart, // anchor the unit's lessons here
        items,
      }
    })

    const calendar = await loadRotationCalendar()
    return NextResponse.json({ sections, calendar })
})
