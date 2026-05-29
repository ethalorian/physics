import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { loadPlanItems, loadRotationCalendar } from '@/lib/pacing-server'

// GET /api/pacing/calendar
// Everything the month-grid calendar needs, scoped to the viewer's OWN sections
// (teacher_email = effective scope email). The client computes which lesson lands
// on which date using src/lib/rotation.ts — no per-day work on the server.

type CourseRow = { id: string; name: string | null; section: string | null }
type SchedRow = { course_id: string; block: string | null; start_date: string | null }

export const GET = withAuth(async (_request, ctx) => {
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // the viewer's own courses
    const { data: courseRows } = await supabaseAdmin
      .from('courses')
      .select('id, name, section')
      .eq('teacher_email', ctx.scopeEmail)
      .order('section', { ascending: true })
    const courses = (courseRows ?? []) as CourseRow[]
    const courseIds = courses.map((c) => c.id)

    const schedByCourse = new Map<string, SchedRow>()
    if (courseIds.length > 0) {
      const { data: schedRows } = await supabaseAdmin
        .from('section_schedules')
        .select('course_id, block, start_date')
        .in('course_id', courseIds)
      for (const s of (schedRows ?? []) as SchedRow[]) schedByCourse.set(s.course_id, s)
    }

    const sections = courses.map((c) => {
      const s = schedByCourse.get(c.id)
      return {
        courseId: c.id,
        name: c.name ?? 'Class',
        section: c.section,
        block: s?.block ?? null,
        startDate: s?.start_date ?? null,
      }
    })

    const planItems = await loadPlanItems()
    const items = planItems.map((i) => ({
      index: i.index, cumStart: i.cumStart, plannedDays: i.plannedDays,
      lessonId: i.lessonId, title: i.title, unitName: i.unitName, kind: i.kind,
    }))

    const calendar = await loadRotationCalendar()

    return NextResponse.json({ sections, items, calendar })
})
