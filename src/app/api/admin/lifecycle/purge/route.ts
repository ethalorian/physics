import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/admin/lifecycle/purge   body: { school_year: string, confirm?: boolean }
// Admin-only, DESTRUCTIVE. Permanently deletes the students whose ONLY
// enrollments are in the given (archived) school year and who are inactive —
// i.e. did not return. One delete per student; all their work cascades away via
// the foreign keys added in the cutover migration.
//
// SAFETY: dry-run by default. With confirm !== true it returns the list/count of
// students that WOULD be purged and deletes nothing. The UI must show that
// preview and require an explicit confirm before sending confirm:true.
export const POST = withRole('admin', async (request) => {
  let body: { school_year?: string; confirm?: boolean }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
  const year = (body.school_year ?? '').trim()
  const confirm = body.confirm === true
  if (!year) return NextResponse.json({ error: 'school_year is required' }, { status: 400 })

  // Resolve purge candidates server-side (small dataset; a few hundred rows).
  const [{ data: courses }, { data: enroll }, { data: students }] = await Promise.all([
    supabaseAdmin.from('courses').select('id, school_year, archived_at'),
    supabaseAdmin.from('course_students').select('course_id, student_id'),
    supabaseAdmin.from('students').select('id, email, name, is_active'),
  ])

  const courseList = (courses ?? []) as { id: string; school_year: string | null; archived_at: string | null }[]
  const yearCourseIds = new Set(courseList.filter((c) => c.school_year === year).map((c) => c.id))
  const activeCourseIds = new Set(courseList.filter((c) => c.archived_at === null).map((c) => c.id))
  if (yearCourseIds.size === 0) {
    return NextResponse.json({ error: `No sections found for school_year ${year}` }, { status: 404 })
  }

  const enrollRows = (enroll ?? []) as { course_id: string; student_id: string }[]
  const inYear = new Set<string>()
  const hasActiveEnrollment = new Set<string>()
  for (const e of enrollRows) {
    if (yearCourseIds.has(e.course_id)) inYear.add(e.student_id)
    if (activeCourseIds.has(e.course_id)) hasActiveEnrollment.add(e.student_id)
  }

  const studentMap = new Map((students ?? []).map((s) => [(s as { id: string }).id, s as { id: string; email: string | null; name: string | null; is_active: boolean | null }]))
  const candidates = [...inYear].filter((id) => {
    const s = studentMap.get(id)
    return s && s.is_active === false && !hasActiveEnrollment.has(id)
  })

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, dry_run: !confirm, count: 0, students: [], message: 'No purgeable students (all are active or returned).' })
  }

  // Hand the resolved ids to the SQL function, which itself dry-runs unless confirmed.
  const { data, error } = await supabaseAdmin.rpc('purge_students', { p_student_ids: candidates, p_confirm: confirm })
  if (error) {
    console.error('[lifecycle] purge failed:', error)
    return NextResponse.json({ error: 'Purge failed' }, { status: 500 })
  }
  const row = Array.isArray(data) ? data[0] : data
  const preview = candidates.map((id) => {
    const s = studentMap.get(id)!
    return { id, email: s.email, name: s.name }
  })

  return NextResponse.json({
    ok: true,
    dry_run: !confirm,
    school_year: year,
    count: candidates.length,
    would_delete: row?.would_delete ?? candidates.length,
    deleted: row?.deleted ?? 0,
    students: preview,
  })
})
