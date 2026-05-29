import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { getEnrollment } from '@/lib/student-enrollment'

// GET /api/me/enrollment
// Lightweight check the EnrollmentGate component fetches on mount. Returns
// {enrolled, courseCount, isStudent}. Staff (teacher/admin) always read as
// `isStudent: false` so the gate component knows to skip them.

export const GET = withAuth(async (request, ctx) => {
    const isStudent = ctx.realRole === 'student'
    if (!isStudent) {
      return NextResponse.json({ enrolled: true, courseCount: 0, isStudent: false })
    }
    const enrollment = await getEnrollment(ctx.userId)
    return NextResponse.json({
      enrolled: enrollment.enrolled,
      courseCount: enrollment.courseCount,
      isStudent: true,
    })
})
