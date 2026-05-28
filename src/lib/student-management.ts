/**
 * Student Management Utilities
 * Handles automatic student record creation and management
 */

import { supabaseAdmin } from './supabase'

interface StudentRecord {
  id: string
  email: string
  name: string
  google_user_id: string
  created_at: string
}

interface EnsureStudentResult {
  success: boolean
  student?: StudentRecord
  error?: string
  isNew?: boolean
}

/**
 * Ensure student record exists in database
 * Creates record automatically on first sign-in if missing
 * @param email Student's email address
 * @param userId Google user ID (from OAuth)
 * @param name Student's display name
 * @returns Student record and creation status
 */
export async function ensureStudentRecord(
  email: string,
  userId: string,
  name?: string | null
): Promise<EnsureStudentResult> {
  try {
    // Check if student already exists by email
    const lookup = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('email', email)
      .maybeSingle()
    const fetchError = lookup.error
    // `existingStudent` is `let` because the stub-reclaim path below may
    // reassign it to a Classroom-imported row found by name match.
    let existingStudent = lookup.data

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking for existing student:', fetchError)
      return { success: false, error: fetchError.message }
    }

    // RECLAIM CLASSROOM-IMPORTED STUB.
    // The Google Classroom roster sync writes synthetic emails of the form
    // `<google_sub>@classroom.local` when Classroom doesn't return a real
    // address. Those rows are correctly enrolled in course_students but their
    // email and google_user_id don't match what a real sign-in produces, so
    // the email-lookup above misses them and we'd otherwise create a duplicate
    // account. Before that, try a NAME-MATCH against any @classroom.local stub
    // and reclaim it: take it over with the real email + this session's
    // google_user_id. Only fires when exactly ONE stub matches the name (so
    // name collisions in a big roster fall through to create-new safely).
    if (!existingStudent && name) {
      const cleanName = name.trim()
      if (cleanName.length > 0) {
        const { data: stubMatches } = await supabaseAdmin
          .from('students')
          .select('*')
          .ilike('name', cleanName)
          .like('email', '%@classroom.local')
        if (stubMatches && stubMatches.length === 1) {
          const stub = stubMatches[0]
          console.log(`🔗 Reclaiming Classroom stub for ${cleanName}: ${stub.email} → ${email}`)
          const { data: reclaimed, error: reclaimErr } = await supabaseAdmin
            .from('students')
            .update({
              email,
              google_user_id: userId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', stub.id)
            .select()
            .single()
          if (!reclaimErr && reclaimed) {
            // Treat as a normal "found existing" path from here on.
            existingStudent = reclaimed
          }
        }
      }
    }

    // Student exists - return existing record.
    if (existingStudent) {
      // SELF-HEAL the identity link. Every mastery/gradebook surface keys a
      // student by students.google_user_id, while block work is stamped with
      // session.user.id (the Google `sub`). If the row's google_user_id has
      // drifted from the current auth id (stale seed, a re-created OAuth client,
      // or an env repoint), the student's submitted work becomes invisible to
      // grading. When we match a row by email but its id differs from the
      // current auth userId, realign it so the roster identity tracks the auth
      // identity. (Matching is by email, so this only fires for the same person.)
      const patch: { updated_at: string; google_user_id?: string } = {
        updated_at: new Date().toISOString(),
      }
      if (userId && existingStudent.google_user_id !== userId) {
        patch.google_user_id = userId
        console.log(`🔗 Realigning student ${email}: google_user_id ${existingStudent.google_user_id} → ${userId}`)
      }
      await supabaseAdmin
        .from('students')
        .update(patch)
        .eq('id', existingStudent.id)

      return {
        success: true,
        student: { ...existingStudent, ...(patch.google_user_id ? { google_user_id: userId } : {}) },
        isNew: false
      }
    }

    // Student doesn't exist - create new record
    const studentName = name || email.split('@')[0] || 'Student'
    
    const { data: newStudent, error: createError } = await supabaseAdmin
      .from('students')
      .insert({
        google_user_id: userId,
        email: email,
        name: studentName,
        photo_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      // Check if it's a unique constraint violation (race condition)
      if (createError.code === '23505') {
        // Another process created the record, fetch it
        const { data: raceStudent } = await supabaseAdmin
          .from('students')
          .select('*')
          .eq('email', email)
          .single()
        
        if (raceStudent) {
          return {
            success: true,
            student: raceStudent,
            isNew: false
          }
        }
      }

      console.error('Error creating student record:', createError)
      return { success: false, error: createError.message }
    }

    console.log(`✅ Created new student record for ${email}`)
    
    return {
      success: true,
      student: newStudent,
      isNew: true
    }

  } catch (error) {
    console.error('Unexpected error in ensureStudentRecord:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if student is assigned to any courses
 * @param studentId Student's database ID
 * @returns Object with assignment status and course count
 */
export async function checkStudentCourseAssignment(
  studentId: string
): Promise<{ hasAssignment: boolean; courseCount: number; courses: any[] }> {
  try {
    // Check ACTIVE enrollments
    const { data: enrollments, error } = await supabaseAdmin
      .from('course_students')
      .select(`
        id,
        enrollment_state,
        enrolled_via,
        course:courses(id, name, section, teacher_email)
      `)
      .eq('student_id', studentId)
      .eq('enrollment_state', 'ACTIVE')

    if (error) {
      console.error('Error checking course assignments:', error)
      return { hasAssignment: false, courseCount: 0, courses: [] }
    }

    return {
      hasAssignment: (enrollments?.length || 0) > 0,
      courseCount: enrollments?.length || 0,
      courses: enrollments || []
    }
  } catch (error) {
    console.error('Unexpected error checking assignments:', error)
    return { hasAssignment: false, courseCount: 0, courses: [] }
  }
}

/**
 * Get student by email
 * @param email Student's email address
 * @returns Student record or null
 */
export async function getStudentByEmail(
  email: string
): Promise<StudentRecord | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('Error fetching student:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error fetching student:', error)
    return null
  }
}

/**
 * Get student enrollment status and details
 * Used for dashboard personalization
 */
export async function getStudentEnrollmentStatus(email: string) {
  const student = await getStudentByEmail(email)
  
  if (!student) {
    return {
      hasAccount: false,
      hasAssignment: false,
      needsEnrollment: true,
      student: null,
      courses: []
    }
  }

  const assignment = await checkStudentCourseAssignment(student.id)

  return {
    hasAccount: true,
    hasAssignment: assignment.hasAssignment,
    needsEnrollment: !assignment.hasAssignment,
    student: student,
    courses: assignment.courses
  }
}

