import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getEffectiveContext } from '@/lib/effective-context'
import { getCourseStudentGids, getCourseOwnerEmail } from '@/lib/teacher-scope'
import { targetValue, MasteryRecord } from '@/data/curriculum-types'

// GET /api/classes/[courseId]
// The per-class drill-in: course meta + its roster + a compact mastery/completion
// summary. Admins can open any class; a teacher can only open a class they own.

type CourseRow = { id: string; name: string; section: string | null; teacher_email: string | null }
type StudentRow = { google_user_id: string | null; name: string; first_name: string | null; last_name: string | null }
type RecRow = { user_id: string; target_id: string; level: number; observed_at: string }

export async function GET(request: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await params
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ctx = await getEffectiveContext(session.user.email)
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Ownership check for teachers.
    const owner = await getCourseOwnerEmail(courseId)
    if (ctx.role === 'teacher' && owner !== ctx.scopeEmail) {
      return NextResponse.json({ error: 'Not your class' }, { status: 403 })
    }

    const { data: courseRaw } = await supabaseAdmin
      .from('courses')
      .select('id, name, section, teacher_email')
      .eq('id', courseId)
      .maybeSingle()
    const course = courseRaw as CourseRow | null
    if (!course) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

    // Roster (ordered by last name to match Aspen / the rest of the app).
    const gids = await getCourseStudentGids(courseId)
    let students: { id: string; name: string; firstName: string | null; lastName: string | null }[] = []
    if (gids.length > 0) {
      const { data: srRaw } = await supabaseAdmin
        .from('students')
        .select('google_user_id, name, first_name, last_name')
        .in('google_user_id', gids)
      students = ((srRaw ?? []) as StudentRow[])
        .filter((s) => s.google_user_id)
        .map((s) => ({ id: s.google_user_id as string, name: s.name, firstName: s.first_name, lastName: s.last_name }))
        .sort((a, b) => (a.lastName || a.name).toLowerCase().localeCompare((b.lastName || b.name).toLowerCase()))
    }

    // Mastery summary: per-(student,target) decaying average (same metric as the
    // grid), then the class mean. Plus how many lesson scores are in the gradebook.
    let classMasteryAvg: number | null = null
    let ratingsLogged = 0
    let lessonsGraded = 0
    if (gids.length > 0) {
      const { data: recRaw } = await supabaseAdmin
        .from('mastery_records')
        .select('user_id, target_id, level, observed_at')
        .in('user_id', gids)
        .order('observed_at', { ascending: true })
      const recs = (recRaw ?? []) as RecRow[]
      ratingsLogged = recs.length
      const byKey = new Map<string, MasteryRecord[]>()
      for (const r of recs) {
        const key = `${r.user_id}|${r.target_id}`
        const arr = byKey.get(key) ?? []
        arr.push({ studentId: r.user_id, targetId: r.target_id, level: r.level as 1 | 2 | 3, observedAt: r.observed_at })
        byKey.set(key, arr)
      }
      const cellValues = [...byKey.values()].map((arr) => targetValue(arr)).filter((v): v is number => v != null)
      if (cellValues.length > 0) classMasteryAvg = cellValues.reduce((a, b) => a + b, 0) / cellValues.length

      const { count } = await supabaseAdmin
        .from('gradebook_entries')
        .select('id', { count: 'exact', head: true })
        .eq('item_type', 'lesson')
        .eq('status', 'graded')
        .in('user_id', gids)
      lessonsGraded = count ?? 0
    }

    // Published lessons (ordered) so the per-class scheduler can list them with
    // their open/close windows.
    const { data: unitOrderRaw } = await supabaseAdmin.from('units').select('name, order_index')
    const unitOrder = new Map<string, number>(((unitOrderRaw ?? []) as { name: string; order_index: number }[]).map((u) => [u.name, u.order_index]))
    const { data: lessonRaw } = await supabaseAdmin
      .from('lessons')
      .select('id, title, lesson_number, unit')
      .eq('published', true)
    const lessons = ((lessonRaw ?? []) as { id: string; title: string; lesson_number: number | null; unit: string }[])
      .sort((a, b) => (unitOrder.get(a.unit) ?? 99) - (unitOrder.get(b.unit) ?? 99) || (a.lesson_number ?? 0) - (b.lesson_number ?? 0))
      .map((l) => ({ id: l.id, title: l.title, lessonNumber: l.lesson_number, unit: l.unit }))

    return NextResponse.json({
      course: { id: course.id, name: course.name, section: course.section, teacherEmail: course.teacher_email },
      students,
      lessons,
      summary: {
        studentCount: students.length,
        classMasteryAvg,
        ratingsLogged,
        lessonsGraded,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/classes/[courseId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
