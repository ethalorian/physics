import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import { supabase, supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/courses - Fetch courses for the current teacher/admin
 * 
 * Returns Google Classroom courses that have been imported
 * or mock data for development/testing
 */
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    
    // Students can only see their enrolled courses
    // Teachers/Admins can see all their courses
    if (!userRole) {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 403 })
    }

    // Try to fetch from database first.
    // Staff read with the service-role client: this route already enforces role
    // server-side, and the courses table has RLS keyed to Supabase auth (which
    // we don't use — auth is NextAuth), so the anon client returns nothing and
    // would silently fall back to mock data.
    const dbClient = userRole === 'student' ? supabase : supabaseAdmin
    try {
      let query = dbClient
        .from('courses')
        .select('*')
        .order('name', { ascending: true })

      // Filter based on role
      if (userRole === 'student') {
        // Get courses where student is enrolled
        const { data: enrollments } = await supabase
          .from('student_courses')
          .select('course_id')
          .eq('student_email', session.user.email)

        if (enrollments && enrollments.length > 0) {
          const courseIds = enrollments.map(e => e.course_id)
          query = query.in('id', courseIds)
        } else {
          // No enrollments, return empty
          return NextResponse.json({ courses: [] })
        }
      } else if (userRole === 'teacher') {
        // Get courses where teacher is the instructor
        query = query.eq('teacher_email', session.user.email)
      }
      // Admins see all courses (no additional filter)

      const { data: courses, error } = await query

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      if (courses && courses.length > 0) {
        // courses.student_count is unreliable (the count RPC is a no-op), so for
        // staff compute live enrollment counts from course_students.
        const countByCourse = new Map<string, number>()
        if (userRole !== 'student') {
          const { data: cs } = await supabaseAdmin
            .from('course_students')
            .select('course_id')
            .in('course_id', courses.map((c) => c.id))
          for (const row of (cs ?? []) as { course_id: string }[]) {
            countByCourse.set(row.course_id, (countByCourse.get(row.course_id) ?? 0) + 1)
          }
        }

        // Transform to consistent format
        const formattedCourses = courses.map(course => ({
          id: course.id || course.google_course_id,
          google_course_id: course.google_course_id,
          name: course.name,
          section: course.section,
          description: course.description,
          student_count: countByCourse.get(course.id) ?? course.student_count ?? 0,
          teacher_email: course.teacher_email,
          created_at: course.created_at,
          updated_at: course.updated_at
        }))

        return NextResponse.json({ courses: formattedCourses })
      }
    } catch {
      console.log('Database not available or no courses found, using mock data')
    }

    // Fallback to mock data for development/demo
    const mockCourses = getMockCourses(userRole)
    return NextResponse.json({ courses: mockCourses })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/courses - Create a new course
 * 
 * For teachers/admins to manually create courses
 * or import from Google Classroom
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can create courses' }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Course name is required' }, { status: 400 })
    }

    // Create course in database
    const courseData = {
      name: body.name,
      section: body.section || null,
      description: body.description || null,
      google_course_id: body.google_course_id || null,
      teacher_email: session.user.email,
      student_count: 0,
      is_active: true
    }

    const { data: course, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single()

    if (error) {
      console.error('Error creating course:', error)
      
      // If table doesn't exist, return helpful message
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return NextResponse.json({
          error: 'Database not configured',
          message: 'The courses table has not been created yet. Using mock data instead.',
          mockCourse: {
            id: `mock-${Date.now()}`,
            ...courseData
          }
        }, { status: 201 })
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ course }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}

/**
 * Mock data for development/testing
 */
function getMockCourses(role: string | null) {
  const allMockCourses = [
    {
      id: 'physics-101-p1',
      google_course_id: null,
      name: 'Physics 101',
      section: 'Period 1',
      description: 'Introduction to Physics - Morning class',
      student_count: 25,
      teacher_email: 'teacher@school.edu',
      created_at: new Date('2024-09-01').toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'physics-101-p2',
      google_course_id: null,
      name: 'Physics 101',
      section: 'Period 2',
      description: 'Introduction to Physics - Afternoon class',
      student_count: 28,
      teacher_email: 'teacher@school.edu',
      created_at: new Date('2024-09-01').toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ap-physics',
      google_course_id: null,
      name: 'AP Physics',
      section: null,
      description: 'Advanced Placement Physics C: Mechanics',
      student_count: 18,
      teacher_email: 'teacher@school.edu',
      created_at: new Date('2024-09-01').toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'physics-honors',
      google_course_id: null,
      name: 'Honors Physics',
      section: null,
      description: 'Accelerated physics course for advanced students',
      student_count: 22,
      teacher_email: 'teacher@school.edu',
      created_at: new Date('2024-09-01').toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  // Filter based on role
  if (role === 'student') {
    // Students see first two courses
    return allMockCourses.slice(0, 2)
  } else if (role === 'teacher') {
    // Teachers see all their courses
    return allMockCourses.filter(c => c.teacher_email === 'teacher@school.edu')
  } else if (role === 'admin') {
    // Admins see everything
    return allMockCourses
  }

  return []
}

/**
 * PUT /api/courses/:id - Update a course
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can update courses' }, { status: 403 })
    }

    const body = await request.json()
    const courseId = body.id

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    // Update course in database
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.section !== undefined) updateData.section = body.section
    if (body.description !== undefined) updateData.description = body.description
    if (body.student_count !== undefined) updateData.student_count = body.student_count
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data: course, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', courseId)
      .select()
      .single()

    if (error) {
      console.error('Error updating course:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ course })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/courses/:id - Delete a course (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete courses' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('id')

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (error) {
      console.error('Error deleting course:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    )
  }
}