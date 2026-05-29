import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { targetValue, MasteryRecord } from '@/data/curriculum-types'
import { withAuth } from '@/lib/api-auth'

// GET /api/analytics/mastery
// App-wide mastery analytics dataset (ADMIN ONLY). Returns the structural maps
// needed to disaggregate performance by teacher, class/section, learning-target
// domain (K/R/S/P), individual target, and time — plus the current rolled value
// per (student, target) and a compact record list for weekly trends.
//
// Keys: mastery_records.user_id === students.google_user_id === session.user.id.
// course_students.student_id references students.id (UUID), so we bridge
// UUID -> google_user_id to attach class membership to the analytics students.

// NOTE: the students table has NO teacher_email column — a student's teacher is
// derived from the course(s) they're enrolled in (courses.teacher_email).
type StudentRow = { id: string; google_user_id: string | null; name: string | null }
type TargetRow = { id: string; statement: string; domain: string; unit_id: string; order_index: number }
type UnitRow = { id: string; name: string; order_index: number }
type CourseRow = { id: string; name: string | null; section: string | null; teacher_email: string | null }
type CourseStudentRow = { course_id: string; student_id: string }
type RecordRow = { user_id: string; target_id: string; level: number; observed_at: string }

export const GET = withAuth(async (_request, ctx) => {
    if (ctx.role !== 'admin') {
      return NextResponse.json({ error: 'App-wide analytics is admin only' }, { status: 403 })
    }

    const [unitsRes, targetsRes, studentsRes, coursesRes, csRes] = await Promise.all([
      supabaseAdmin.from('units').select('id, name, order_index').order('order_index', { ascending: true }),
      supabaseAdmin.from('learning_targets').select('id, statement, domain, unit_id, order_index').order('order_index', { ascending: true }),
      supabaseAdmin.from('students').select('id, google_user_id, name'),
      supabaseAdmin.from('courses').select('id, name, section, teacher_email'),
      supabaseAdmin.from('course_students').select('course_id, student_id'),
    ])

    const units = ((unitsRes.data ?? []) as UnitRow[]).map((u) => ({ id: u.id, name: u.name }))
    const targets = ((targetsRes.data ?? []) as TargetRow[]).map((t) => ({
      id: t.id, statement: t.statement, domain: t.domain, unitId: t.unit_id,
    }))
    const studentRows = (studentsRes.data ?? []) as StudentRow[]
    const courseRows = (coursesRes.data ?? []) as CourseRow[]
    const courseStudents = (csRes.data ?? []) as CourseStudentRow[]

    // student UUID -> google_user_id (the analytics key)
    const gidByUuid = new Map<string, string>()
    for (const s of studentRows) if (s.google_user_id) gidByUuid.set(s.id, s.google_user_id)

    // class membership: courseId -> [google_user_id]
    const classMembers = new Map<string, string[]>()
    for (const cs of courseStudents) {
      const gid = gidByUuid.get(cs.student_id)
      if (!gid) continue
      const arr = classMembers.get(cs.course_id) ?? []
      arr.push(gid)
      classMembers.set(cs.course_id, arr)
    }
    // google_user_id -> [courseId], and google_user_id -> teacher (first course wins)
    const teacherByCourse = new Map<string, string | null>()
    for (const c of courseRows) teacherByCourse.set(c.id, c.teacher_email)
    const classIdsByStudent = new Map<string, string[]>()
    const teacherByStudent = new Map<string, string>()
    for (const [courseId, gids] of classMembers) {
      for (const gid of gids) {
        const arr = classIdsByStudent.get(gid) ?? []
        arr.push(courseId)
        classIdsByStudent.set(gid, arr)
        const t = teacherByCourse.get(courseId)
        if (t && !teacherByStudent.has(gid)) teacherByStudent.set(gid, t)
      }
    }

    const classes = courseRows.map((c) => ({
      id: c.id,
      name: c.name ?? 'Class',
      section: c.section,
      teacher: c.teacher_email,
      studentCount: (classMembers.get(c.id) ?? []).length,
    }))

    const students = studentRows
      .filter((s) => s.google_user_id)
      .map((s) => {
        const gid = s.google_user_id as string
        return {
          id: gid,
          name: s.name ?? 'Student',
          teacher: teacherByStudent.get(gid) ?? null,
          classIds: classIdsByStudent.get(gid) ?? [],
        }
      })

    // teachers: from the courses (the only place teacher_email lives)
    const teacherSet = new Set<string>()
    for (const c of courseRows) if (c.teacher_email) teacherSet.add(c.teacher_email)
    const teachers = [...teacherSet].sort()

    // all mastery records (compact) + per-cell rolled values
    const studentIds = students.map((s) => s.id)
    const targetIds = targets.map((t) => t.id)
    let recordRows: RecordRow[] = []
    if (studentIds.length > 0 && targetIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('mastery_records')
        .select('user_id, target_id, level, observed_at')
        .in('user_id', studentIds)
        .in('target_id', targetIds)
        .order('observed_at', { ascending: true })
      recordRows = (data ?? []) as RecordRow[]
    }

    const byKey = new Map<string, MasteryRecord[]>()
    for (const r of recordRows) {
      const key = `${r.user_id}|${r.target_id}`
      const arr = byKey.get(key) ?? []
      arr.push({ studentId: r.user_id, targetId: r.target_id, level: r.level as 1 | 2 | 3, observedAt: r.observed_at })
      byKey.set(key, arr)
    }

    const cells: Record<string, Record<string, { value: number | null; count: number; last: string | null }>> = {}
    for (const s of students) {
      const row: Record<string, { value: number | null; count: number; last: string | null }> = {}
      for (const t of targets) {
        const arr = byKey.get(`${s.id}|${t.id}`) ?? []
        row[t.id] = {
          value: arr.length > 0 ? targetValue(arr) : null,
          count: arr.length,
          last: arr.length > 0 ? arr[arr.length - 1].observedAt : null,
        }
      }
      cells[s.id] = row
    }

    // compact records for trend (u = student gid, t = target, l = level, d = date)
    const records = recordRows.map((r) => ({ u: r.user_id, t: r.target_id, l: r.level, d: r.observed_at }))

    return NextResponse.json({ units, targets, teachers, classes, students, cells, records })
})
