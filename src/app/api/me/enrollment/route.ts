import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getEffectiveContext } from '@/lib/effective-context'
import { getEnrollment } from '@/lib/student-enrollment'

// GET /api/me/enrollment
// Lightweight check the EnrollmentGate component fetches on mount. Returns
// {enrolled, courseCount, isStudent}. Staff (teacher/admin) always read as
// `isStudent: false` so the gate component knows to skip them.

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ctx = await getEffectiveContext(session.user.email)
    const isStudent = ctx.realRole === 'student'
    if (!isStudent) {
      return NextResponse.json({ enrolled: true, courseCount: 0, isStudent: false })
    }
    const enrollment = await getEnrollment(session.user.id)
    return NextResponse.json({
      enrolled: enrollment.enrolled,
      courseCount: enrollment.courseCount,
      isStudent: true,
    })
  } catch (error) {
    console.error('Error in GET /api/me/enrollment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
