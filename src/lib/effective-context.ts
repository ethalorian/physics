import { cookies } from 'next/headers'
import { getUserRole, type UserRole } from '@/lib/permissions'
import { getGrantedRole } from '@/lib/roles'
import { VIEW_AS_COOKIE } from '@/lib/view-as-shared'

// "View as teacher" support. An ADMIN may preview the app as a teacher (optionally
// scoped to a specific colleague's email). This is NOT an escalation: admins
// already have full access, so downgrading themselves to a narrower view is safe.
// A non-admin's cookie is ignored entirely.
//
// The view_as_teacher cookie holds the teacher email to scope to (or is absent).

export interface EffectiveContext {
  realEmail: string
  realRole: UserRole
  role: UserRole          // effective role (admin may be downgraded to teacher)
  scopeEmail: string      // email to scope teacher-owned data by
  viewingAsTeacher: boolean
}

export async function getEffectiveContext(realEmail: string): Promise<EffectiveContext> {
  // Hardcoded admin/teacher allowlist first (owner can never be locked out),
  // then a DB grant can raise a student → teacher (earned via Classroom or an
  // admin approval). Purely additive — a grant never lowers a role.
  let realRole = getUserRole(realEmail)
  if (realRole === 'student') {
    const granted = await getGrantedRole(realEmail)
    if (granted) realRole = granted
  }
  let role = realRole
  let scopeEmail = realEmail
  let viewingAsTeacher = false

  if (realRole === 'admin') {
    const cookieVal = (await cookies()).get(VIEW_AS_COOKIE)?.value
    if (cookieVal) {
      role = 'teacher'
      scopeEmail = cookieVal
      viewingAsTeacher = true
    }
  }

  return { realEmail, realRole, role, scopeEmail, viewingAsTeacher }
}
