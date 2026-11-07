import 'server-only'
import { lookupDatabase } from '@/lib/lookup-database'
import { observedLookup, requestRead } from '@/lib/request-runtime'
import { asProgram, type Program } from '@/lib/program'

type Course = { id: string; name: string; section: string | null; archived_at: string | null; track: string | null; program: string | null }
type Membership = { id: string; course_id: string; enrollment_state: string; courses: Course | Course[] | null }

/** Keep inactive rows: the legacy enrollment, track and program gates include
 * them. Live sessions and lesson windows explicitly select ACTIVE below. */
export function studentMemberships(userId: string): Promise<Membership[]> {
  if (!userId) return Promise.resolve([])
  return requestRead(JSON.stringify(['studentMemberships', userId]), async () => {
    const rows: Membership[] = []
    for (let from = 0; from < 50000; from += 500) {
      const { data, error } = await observedLookup('memberships', () => lookupDatabase.from('course_students')
        .select('id,course_id,enrollment_state,courses(id,name,section,archived_at,track,program)')
        .eq('student_id', userId).order('id').range(from, from + 499))
      if (error) throw error
      rows.push(...(data ?? []) as Membership[])
      if (!data || data.length < 500) return rows
    }
    throw new Error('Enrollment data exceeded the page limit')
  })
}

export async function activeStudentCourseIds(userId: string): Promise<string[]> {
  return [...new Set((await studentMemberships(userId)).filter(row => row.enrollment_state === 'ACTIVE').map(row => row.course_id))]
}

/** Reuse the enrollment read, including its joined class metadata. Inactive
 * memberships still count for the legacy gate but never create invitations. */
export async function studentInvitationCourses(userId: string): Promise<Course[]> {
  const courses = new Map<string, Course>()
  for (const row of await studentMemberships(userId)) {
    if (row.enrollment_state !== 'ACTIVE') continue
    for (const course of Array.isArray(row.courses) ? row.courses : row.courses ? [row.courses] : []) {
      if (course.archived_at === null && course.id === row.course_id) courses.set(course.id, course)
    }
  }
  return [...courses.values()]
}

export async function studentCourses(userId: string): Promise<Course[]> {
  return (await studentMemberships(userId)).flatMap(row => Array.isArray(row.courses) ? row.courses : row.courses ? [row.courses] : [])
}

/** Same program precedence as getStudentProgram, with request-scoped reads. */
export async function studentProgram(userId: string): Promise<Program> {
  const programs = (await studentCourses(userId)).map(course => asProgram(course.program))
  return programs.includes('trades') ? 'trades' : programs.includes('projects') ? 'projects' : 'physics'
}
