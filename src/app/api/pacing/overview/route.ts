import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'
import { computePacing, computeFromElapsed, PlanItem, Schedule } from '@/lib/pacing'
import { loadPlanItems, furthestActiveItem, loadRotationCalendar, isRotationConfigured } from '@/lib/pacing-server'
import { Block, blockMeetingsElapsed } from '@/lib/rotation'

// GET /api/pacing/overview (ADMIN) — every section vs the master pace, in one pass.

type CourseRow = { id: string; name: string | null; section: string | null; teacher_email: string | null }
type CsRow = { course_id: string; student_id: string }
type StudentRow = { id: string; google_user_id: string | null }
type BrRow = { user_id: string; lesson_id: string }
type SchedRow = { course_id: string; start_date: string | null; meeting_days: number[] | null; no_school_dates: string[] | null; block: string | null }
type PacingRow = { course_id: string; current_lesson_id: string | null; current_unit_order: number | null; source: 'auto' | 'confirmed' }

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (getUserRole(session.user.email) !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    const items = await loadPlanItems()

    const [coursesRes, csRes, studentsRes, schedRes, pacingRes] = await Promise.all([
      supabaseAdmin.from('courses').select('id, name, section, teacher_email').order('teacher_email', { ascending: true }),
      supabaseAdmin.from('course_students').select('course_id, student_id'),
      supabaseAdmin.from('students').select('id, google_user_id'),
      supabaseAdmin.from('section_schedules').select('course_id, start_date, meeting_days, no_school_dates, block'),
      supabaseAdmin.from('section_pacing').select('course_id, current_lesson_id, current_unit_order, source'),
    ])
    const cal = await loadRotationCalendar()
    const rotationOn = isRotationConfigured(cal)

    const courses = (coursesRes.data ?? []) as CourseRow[]
    const courseStudents = (csRes.data ?? []) as CsRow[]
    const students = (studentsRes.data ?? []) as StudentRow[]
    const scheds = (schedRes.data ?? []) as SchedRow[]
    const pacings = (pacingRes.data ?? []) as PacingRow[]

    const gidByUuid = new Map<string, string>()
    for (const s of students) if (s.google_user_id) gidByUuid.set(s.id, s.google_user_id)

    // courseId -> gids
    const gidsByCourse = new Map<string, Set<string>>()
    for (const cs of courseStudents) {
      const gid = gidByUuid.get(cs.student_id)
      if (!gid) continue
      const set = gidsByCourse.get(cs.course_id) ?? new Set<string>()
      set.add(gid)
      gidsByCourse.set(cs.course_id, set)
    }

    // gid -> set(lessonId) from block activity (only for gids we care about)
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
      // active lesson ids across this course's students
      const active = new Set<string>()
      for (const gid of gidsByCourse.get(c.id) ?? []) for (const lid of lessonsByGid.get(gid) ?? []) active.add(lid)
      const auto = furthestActiveItem(items, active)

      const pr = pacingByCourse.get(c.id) ?? null
      let actualItem: PlanItem | null = auto
      let source: 'auto' | 'confirmed' | 'none' = auto ? 'auto' : 'none'
      if (pr?.source === 'confirmed') {
        const it = pr.current_lesson_id
          ? items.find((i) => i.lessonId === pr.current_lesson_id)
          : items.find((i) => i.kind === 'unit' && i.unitOrder === pr.current_unit_order)
        if (it) { actualItem = it; source = 'confirmed' }
      }

      const sr = schedByCourse.get(c.id)
      const schedule: Schedule | null = sr
        ? { start_date: sr.start_date, meeting_days: sr.meeting_days ?? [1, 2, 3, 4, 5], no_school_dates: sr.no_school_dates ?? [] }
        : null
      const block = (sr?.block as Block | null) ?? null

      const result = (rotationOn && block && sr?.start_date && today >= new Date(sr.start_date + 'T00:00:00Z'))
        ? computeFromElapsed(items, blockMeetingsElapsed(cal, block, sr.start_date, today), true, { item: actualItem, source })
        : computePacing(items, schedule, today, { item: actualItem, source })

      return {
        courseId: c.id,
        name: c.name ?? 'Class',
        section: c.section,
        teacher: c.teacher_email,
        block,
        hasSchedule: Boolean(sr?.start_date),
        students: (gidsByCourse.get(c.id) ?? new Set()).size,
        ...result,
      }
    })

    // most-behind first, then unscheduled, then the rest
    rows.sort((a, b) => {
      const rank = (s: string) => (s === 'behind' ? 0 : s === 'unknown' ? 1 : s === 'on' ? 2 : 3)
      if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status)
      return a.deltaDays - b.deltaDays
    })

    return NextResponse.json({ rows, totalDays: items.length > 0 ? items[items.length - 1].cumStart + items[items.length - 1].plannedDays : 0 })
  } catch (error) {
    console.error('Error in GET /api/pacing/overview:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
