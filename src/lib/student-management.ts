/**
 * Student Management Utilities
 * Handles automatic student record creation and management
 */

import { supabaseAdmin } from './supabase'

interface StudentRecord {
  id: string
  email: string
  name: string
  created_at: string
}

interface EnsureStudentResult {
  success: boolean
  student?: StudentRecord
  error?: string
  isNew?: boolean
}

/**
 * Record (upsert) the OAuth sub a login presented as a linked identity for a
 * known student. Keyed on (provider, provider_sub) so re-logins are idempotent
 * and a drifted sub resolves back to this same student on the next sign-in.
 */
async function linkPresentedSub(
  studentId: string,
  presentedSub: string,
  email: string,
): Promise<void> {
  if (!presentedSub) return
  await supabaseAdmin
    .from('student_identities')
    .upsert(
      {
        student_id: studentId,
        provider: 'google',
        provider_sub: presentedSub,
        email_at_link: email,
        last_seen: new Date().toISOString(),
      },
      { onConflict: 'provider,provider_sub' },
    )
}

/**
 * Ensure student record exists in database
 * Creates record automatically on first sign-in if missing
 * @param email Student's email address
 * @param presentedSub Google OAuth sub (a credential, NOT the app id)
 * @param name Student's display name
 * @returns Student record and creation status
 */
export async function ensureStudentRecord(
  email: string,
  presentedSub: string,
  name?: string | null
): Promise<EnsureStudentResult> {
  try {
    // Check if student already exists by email (case-insensitive)
    const lookup = await supabaseAdmin
      .from('students')
      .select('*')
      .ilike('email', email)
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
    // email doesn't match what a real sign-in produces, so the email-lookup
    // above misses them and we'd otherwise create a duplicate account. Before
    // that, try a NAME-MATCH against any @classroom.local stub and reclaim it:
    // KEEP the stub row (and its stable students.id, which all enrollment +
    // work keys point at) and just relink the real email onto it, plus record
    // this session's presented sub as a linked identity. Only fires when exactly
    // ONE stub matches the name (so name collisions in a big roster fall through
    // to create-new safely).
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
      // Record the sub this device presented as a linked identity, keyed to the
      // student's stable id. We never write the sub onto the students row (that
      // column is gone); the app id is students.id. Recording the presented sub
      // here means a future login on a drifted sub resolves back to this same
      // student. Matching is by email, so this only ever links identities
      // belonging to the same person.
      await linkPresentedSub(existingStudent.id, presentedSub, email)
      await supabaseAdmin
        .from('students')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', existingStudent.id)

      return {
        success: true,
        student: existingStudent,
        isNew: false
      }
    }

    // Student doesn't exist - create new record. Let students.id default/gen;
    // it becomes this person's canonical app id. The presented sub is recorded
    // separately in student_identities (never on the students row).
    const studentName = name || email.split('@')[0] || 'Student'

    const { data: newStudent, error: createError } = await supabaseAdmin
      .from('students')
      .insert({
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
          .ilike('email', email)
          .single()

        if (raceStudent) {
          await linkPresentedSub(raceStudent.id, presentedSub, email)
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

    // Record the presented sub as this new student's first linked identity.
    await linkPresentedSub(newStudent.id, presentedSub, email)

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
 * Resolve the CANONICAL, stable app user id (students.id) for a signed-in person.
 *
 * The app keys every work table on `students.id` (a uuid). The raw OAuth `sub` a
 * device presents is only a CREDENTIAL — it lives in `student_identities` and may
 * drift across OAuth clients/environments, so it must NOT be used as the key.
 *
 * Resolution order:
 *   1) An existing identity for (provider='google', provider_sub) → its student_id.
 *      (Bumps last_seen.) This is what makes a drifted sub map back to the same person.
 *   2) Else a students row matching the verified email (case-insensitive): upsert the
 *      presented sub into student_identities linked to that student → students.id.
 *   3) Else null — brand-new person with no row yet; the row (and thus the id) is
 *      created in ensureStudentRecord during signIn, and the caller falls back to the
 *      presented sub only as a transient placeholder.
 */
export async function resolveCanonicalUserId(
  email: string | null | undefined,
  presentedSub: string,
): Promise<string | null> {
  // 1) Known identity → its student_id (the app id).
  if (presentedSub) {
    const { data: identity } = await supabaseAdmin
      .from('student_identities')
      .select('student_id')
      .eq('provider', 'google')
      .eq('provider_sub', presentedSub)
      .maybeSingle()
    const sid = (identity as { student_id?: string } | null)?.student_id
    if (sid) {
      await supabaseAdmin
        .from('student_identities')
        .update({ last_seen: new Date().toISOString() })
        .eq('provider', 'google')
        .eq('provider_sub', presentedSub)
      return sid
    }
  }

  // 2) Match by verified email, then link the presented sub to that student.
  const e = (email ?? '').trim()
  if (!e) return null

  const { data: student } = await supabaseAdmin
    .from('students')
    .select('id')
    .ilike('email', e)
    .maybeSingle()

  const studentId = (student as { id?: string } | null)?.id
  if (!studentId) return null // 3) brand-new — created in ensureStudentRecord.

  await linkPresentedSub(studentId, presentedSub, e)
  return studentId
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

