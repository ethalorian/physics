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
      // PIN the identity link. The student's stable app id is the
      // google_user_id already on their (unique-email) roster row — NOT whatever
      // sub this particular login presented. (We used to overwrite it with the
      // incoming sub, which made the roster "chase the newest sub" and stranded a
      // person's avatar/XP/work under older ids whenever the sub drifted across
      // OAuth-client changes or environments.) We now KEEP the canonical id and
      // instead record the presented sub in student_identities, so a future login
      // on a drifted sub resolves back to this same student. Matching is by email,
      // so this only ever links identities belonging to the same person.
      if (userId && existingStudent.google_user_id && existingStudent.google_user_id !== userId) {
        await supabaseAdmin
          .from('student_identities')
          .upsert(
            {
              student_id: existingStudent.id,
              provider: 'google',
              provider_sub: userId,
              email_at_link: email,
              last_seen: new Date().toISOString(),
            },
            { onConflict: 'provider,provider_sub' },
          )
        console.log(`🔗 Linked alternate sub for ${email}: ${userId} → canonical ${existingStudent.google_user_id}`)
      }
      await supabaseAdmin
        .from('students')
        .update({ updated_at: new Date().toISOString() })
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
 * Resolve the CANONICAL, stable app user id for a signed-in person.
 *
 * The app keys every work table on a single id per person. That id is pinned on
 * the student's (unique-email) roster row as `google_user_id`; the raw OAuth
 * `sub` a given device presents may differ (sub drift across OAuth clients or
 * environments) and must NOT be used directly as the key. This resolves the
 * verified email to the pinned id and records the presented sub for audit and
 * future drift-mapping. Falls back to the presented sub only for a brand-new
 * person with no roster row yet (their first login seeds it as canonical).
 */
export async function resolveCanonicalUserId(
  email: string | null | undefined,
  presentedSub: string,
): Promise<string> {
  const e = (email ?? '').trim()
  if (!e) return presentedSub

  const { data: student } = await supabaseAdmin
    .from('students')
    .select('id, google_user_id')
    .ilike('email', e)
    .maybeSingle()

  // No roster row yet (e.g. a race before ensureStudentRecord): the presented
  // sub becomes this person's canonical id when their row is created.
  if (!student?.google_user_id) return presentedSub

  // Record the sub this device presented, linked to the canonical student, so a
  // future login on a drifted sub resolves back here instead of forking.
  if (presentedSub && presentedSub !== student.google_user_id) {
    await supabaseAdmin
      .from('student_identities')
      .upsert(
        {
          student_id: student.id,
          provider: 'google',
          provider_sub: presentedSub,
          email_at_link: e,
          last_seen: new Date().toISOString(),
        },
        { onConflict: 'provider,provider_sub' },
      )
  }

  return student.google_user_id
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

