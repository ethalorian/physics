import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withRole } from '@/lib/api-auth'
import { getTeacherStudentGids } from '@/lib/teacher-scope'

// GET /api/admin/search
// Index for the admin command palette: every lesson (staff can navigate to any)
// plus students — all of them for admins, roster-only for teachers (and for an
// admin previewing as a teacher, since ctx.role reflects the impersonation).
// The client filters this list; we just return a bounded, role-scoped index.

type LessonHit = { id: string; slug: string | null; title: string; published: boolean }
type StudentHit = { id: string; name: string | null; email: string | null }

export const GET = withRole(['admin', 'teacher'], async (_request, ctx) => {
  const { data: lessonRows } = await supabaseAdmin
    .from('lessons')
    .select('id, slug, title, published')
    .order('lesson_number', { ascending: true })
    .limit(500)
  const lessons: LessonHit[] = (lessonRows ?? []).map((l) => ({
    id: l.id, slug: l.slug, title: l.title ?? '(untitled lesson)', published: !!l.published,
  }))

  let students: StudentHit[] = []
  if (ctx.role === 'admin') {
    const { data } = await supabaseAdmin
      .from('students')
      .select('id, name, email')
      .order('name', { ascending: true })
      .limit(2000)
    students = (data ?? []) as StudentHit[]
  } else {
    // Teacher (or admin-as-teacher): only their roster, matched by google user id.
    const gids = await getTeacherStudentGids(ctx.scopeEmail)
    if (gids.length > 0) {
      const { data } = await supabaseAdmin
        .from('students')
        .select('id, name, email, google_user_id')
        .in('google_user_id', gids)
        .order('name', { ascending: true })
        .limit(2000)
      students = (data ?? []).map((s) => ({ id: s.id, name: s.name, email: s.email }))
    }
  }

  return NextResponse.json({ lessons, students })
})
