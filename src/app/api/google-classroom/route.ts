import { NextRequest, NextResponse } from 'next/server'
import { googleClassroomAPI } from '@/lib/google-classroom'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const courseId = searchParams.get('courseId')
    const accessToken = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 401 }
      )
    }

    googleClassroomAPI.setAccessToken(accessToken)

    switch (action) {
      case 'courses':
        const courses = await googleClassroomAPI.getCourses()
        return NextResponse.json({ courses })

      case 'students':
        if (!courseId) {
          return NextResponse.json(
            { error: 'Course ID is required for fetching students' },
            { status: 400 }
          )
        }
        const students = await googleClassroomAPI.getStudents(courseId)
        return NextResponse.json({ students })

      case 'teachers':
        if (!courseId) {
          return NextResponse.json(
            { error: 'Course ID is required for fetching teachers' },
            { status: 400 }
          )
        }
        const teachers = await googleClassroomAPI.getTeachers(courseId)
        return NextResponse.json({ teachers })

      case 'course':
        if (!courseId) {
          return NextResponse.json(
            { error: 'Course ID is required for fetching course details' },
            { status: 400 }
          )
        }
        const course = await googleClassroomAPI.getCourse(courseId)
        return NextResponse.json({ course })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: courses, students, teachers, course' },
          { status: 400 }
        )
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch data from Google Classroom' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, courseId, email } = body
    const accessToken = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 401 }
      )
    }

    googleClassroomAPI.setAccessToken(accessToken)

    switch (action) {
      case 'invite-student':
        if (!courseId || !email) {
          return NextResponse.json(
            { error: 'Course ID and email are required for inviting students' },
            { status: 400 }
          )
        }
        const invitation = await googleClassroomAPI.inviteStudent(courseId, email)
        return NextResponse.json({ invitation })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: invite-student' },
          { status: 400 }
        )
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to perform action on Google Classroom' },
      { status: 500 }
    )
  }
}
