import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// Ownership guards: admins may act on anything; a teacher only on sections/courses
// they own. Section ownership flows from section.teacher_email or the owning course.
async function staffCanAccessSection(role: string, scopeEmail: string, sectionId: string): Promise<boolean> {
  if (role === 'admin') return true
  const { data } = await supabaseAdmin.from('sections').select('course_id, teacher_email').eq('id', sectionId).maybeSingle()
  const sec = data as { course_id: string | null; teacher_email: string | null } | null
  if (!sec) return false
  if (sec.teacher_email && sec.teacher_email === scopeEmail) return true
  if (sec.course_id) {
    const { data: course } = await supabaseAdmin.from('courses').select('teacher_email').eq('id', sec.course_id).maybeSingle()
    return (course as { teacher_email: string | null } | null)?.teacher_email === scopeEmail
  }
  return false
}
async function staffCanAccessCourse(role: string, scopeEmail: string, courseId: string): Promise<boolean> {
  if (role === 'admin') return true
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)
  let q = supabaseAdmin.from('courses').select('teacher_email')
  q = isUuid ? q.eq('id', courseId) : q.eq('google_course_id', courseId)
  const { data } = await q.maybeSingle()
  return (data as { teacher_email: string | null } | null)?.teacher_email === scopeEmail
}
const forbiddenSection = () => NextResponse.json({ error: 'Forbidden - not your section' }, { status: 403 })

// GET - Get sections for a course or all sections
export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')

    if (courseId) {
      // A teacher may only list sections for a course they own.
      if (!(await staffCanAccessCourse(ctx.role, ctx.scopeEmail, courseId))) {
        return NextResponse.json({ error: 'Forbidden - not your course' }, { status: 403 })
      }
      // Get sections for a specific course using the RPC function
      const { data, error } = await supabaseAdmin
        .rpc('get_course_sections', { p_course_id: courseId })

      if (error) {
        console.error('Error fetching course sections:', error)
        return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
      }

      return NextResponse.json({ sections: data || [] })
    } else {
      // Get all sections with course info — a teacher sees only their own.
      let q = supabaseAdmin
        .from('sections')
        .select(`
          id,
          name,
          description,
          google_section_name,
          teacher_email,
          max_capacity,
          is_active,
          created_at,
          course:courses(id, name, google_course_id)
        `)
        .eq('is_active', true)
        .order('name')
      if (ctx.role === 'teacher') q = q.eq('teacher_email', ctx.scopeEmail)
      const { data, error } = await q

      if (error) {
        console.error('Error fetching sections:', error)
        return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
      }

      return NextResponse.json({ sections: data || [] })
    }
})

// POST - Create a new section or assign student to section
export const POST = withRole(['teacher', 'admin'], async (request, ctx) => {
    const body = await request.json()
    const { action } = body

    if (action === 'create_section') {
      // Create a new section
      const { courseId, name, description, maxCapacity } = body

      if (!courseId || !name) {
        return NextResponse.json({ error: 'Course ID and section name are required' }, { status: 400 })
      }
      if (!(await staffCanAccessCourse(ctx.role, ctx.scopeEmail, courseId))) {
        return NextResponse.json({ error: 'Forbidden - not your course' }, { status: 403 })
      }

      const { data, error } = await supabaseAdmin
        .from('sections')
        .insert({
          course_id: courseId,
          name,
          description: description || null,
          teacher_email: ctx.email,
          max_capacity: maxCapacity || null,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'A section with this name already exists for this course' }, { status: 409 })
        }
        console.error('Error creating section:', error)
        return NextResponse.json({ error: 'Failed to create section' }, { status: 500 })
      }

      return NextResponse.json({ success: true, section: data })

    } else if (action === 'assign_student') {
      // Assign a student to a section
      const { studentId, sectionId } = body

      if (!studentId || !sectionId) {
        return NextResponse.json({ error: 'Student ID and section ID are required' }, { status: 400 })
      }
      if (!(await staffCanAccessSection(ctx.role, ctx.scopeEmail, sectionId))) return forbiddenSection()

      const { data, error } = await supabaseAdmin
        .rpc('assign_student_to_section', {
          p_student_id: studentId,
          p_section_id: sectionId,
          p_assigned_by: ctx.email
        })

      if (error) {
        console.error('Error assigning student to section:', error)
        return NextResponse.json({ error: 'Failed to assign student' }, { status: 500 })
      }

      return NextResponse.json({ success: true, assignmentId: data })

    } else if (action === 'bulk_assign') {
      // Bulk assign students to a section
      const { studentIds, sectionId } = body

      if (!Array.isArray(studentIds) || studentIds.length === 0 || !sectionId) {
        return NextResponse.json({ error: 'Student IDs array and section ID are required' }, { status: 400 })
      }
      if (!(await staffCanAccessSection(ctx.role, ctx.scopeEmail, sectionId))) return forbiddenSection()

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      }

      for (const studentId of studentIds) {
        const { error } = await supabaseAdmin
          .rpc('assign_student_to_section', {
            p_student_id: studentId,
            p_section_id: sectionId,
            p_assigned_by: ctx.email
          })

        if (error) {
          results.failed++
          results.errors.push(`Failed to assign student ${studentId}: ${error.message}`)
        } else {
          results.success++
        }
      }

      return NextResponse.json({ 
        success: true, 
        assigned: results.success,
        failed: results.failed,
        errors: results.errors.length > 0 ? results.errors : undefined
      })

    } else {
      return NextResponse.json({ error: 'Invalid action. Use create_section, assign_student, or bulk_assign' }, { status: 400 })
    }
})

// PUT - Update a section
export const PUT = withRole(['teacher', 'admin'], async (request, ctx) => {
    const body = await request.json()
    const { sectionId, name, description, maxCapacity, isActive } = body

    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 })
    }
    if (!(await staffCanAccessSection(ctx.role, ctx.scopeEmail, sectionId))) return forbiddenSection()

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (maxCapacity !== undefined) updateData.max_capacity = maxCapacity
    if (isActive !== undefined) updateData.is_active = isActive

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('sections')
      .update(updateData)
      .eq('id', sectionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating section:', error)
      return NextResponse.json({ error: 'Failed to update section' }, { status: 500 })
    }

    return NextResponse.json({ success: true, section: data })
})

// DELETE - Remove student from section or delete section
export const DELETE = withRole(['teacher', 'admin'], async (request, ctx) => {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const sectionId = searchParams.get('section_id')
    const studentId = searchParams.get('student_id')

    if (action === 'remove_student') {
      // Remove student from section
      if (!sectionId || !studentId) {
        return NextResponse.json({ error: 'Section ID and student ID are required' }, { status: 400 })
      }
      if (!(await staffCanAccessSection(ctx.role, ctx.scopeEmail, sectionId))) return forbiddenSection()

      const { error } = await supabaseAdmin
        .from('student_sections')
        .update({ is_active: false })
        .eq('section_id', sectionId)
        .eq('student_id', studentId)

      if (error) {
        console.error('Error removing student from section:', error)
        return NextResponse.json({ error: 'Failed to remove student' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Student removed from section' })

    } else if (action === 'delete_section') {
      // Soft delete section (set is_active to false)
      if (!sectionId) {
        return NextResponse.json({ error: 'Section ID is required' }, { status: 400 })
      }
      if (!(await staffCanAccessSection(ctx.role, ctx.scopeEmail, sectionId))) return forbiddenSection()

      const { error } = await supabaseAdmin
        .from('sections')
        .update({ is_active: false })
        .eq('id', sectionId)

      if (error) {
        console.error('Error deleting section:', error)
        return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Section deleted' })

    } else {
      return NextResponse.json({ error: 'Invalid action. Use remove_student or delete_section' }, { status: 400 })
    }
})

