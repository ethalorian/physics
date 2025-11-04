import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getStudentEnrollmentStatus } from '@/lib/student-management'

// GET - Check current user's enrollment status
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ 
        hasAccount: false,
        hasAssignment: false,
        needsEnrollment: true,
        student: null,
        courses: []
      })
    }

    // Get enrollment status using the server-side function
    const enrollmentStatus = await getStudentEnrollmentStatus(session.user.email)
    
    return NextResponse.json(enrollmentStatus)

  } catch (error) {
    console.error('Enrollment status API error:', error)
    return NextResponse.json({ 
      hasAccount: false,
      hasAssignment: false,
      needsEnrollment: true,
      student: null,
      courses: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

