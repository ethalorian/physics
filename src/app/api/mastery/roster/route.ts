import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getTeacherStudentGids } from '@/lib/teacher-scope'

// GET /api/mastery/roster
// Returns the signed-in teacher's students as { id, name, email }.
//
// CRITICAL: `id` is students.id — the SAME value stored as session.user.id
// (token.sub) when the student signs in, and therefore the value that
// mastery_records.user_id must use. Work tables key by students.id, so this
// returns it directly.
export const GET = withAuth(async (_request, ctx) => {
    const role = ctx.role
    if (role !== 'admin' && role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can view a roster' }, { status: 403 })
    }

    let query = supabaseAdmin
      .from('students')
      .select('id, name, email')
      .order('name', { ascending: true })

    // Admins see all students; teachers see students enrolled in courses they own
    // (students has no teacher_email column — scope flows through courses).
    if (role === 'teacher') {
      query = query.in('id', await getTeacherStudentGids(ctx.scopeEmail))
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching roster:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const students = (data ?? [])
      .filter((s) => s.id)
      .map((s) => ({ id: s.id, name: s.name, email: s.email }))

    return NextResponse.json({ students })
})
