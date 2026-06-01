// School-account access policy — single source of truth for "who may use the app".
//
// Students sign in with Google on the district student domain. Staff sign in on
// the staff domain (and the owner via an allowlisted personal address), so staff
// are recognized by ROLE (the email allowlist in permissions.ts), never by this
// domain check. The domain rule therefore applies only to students: a student
// signed in with any non-school account is shown the "use your school account"
// modal instead of the app.

/** District student sign-in domain. Students authenticate as <name>@this. */
export const STUDENT_EMAIL_DOMAIN = 'student.fitchburgschools.org'

/** True if the email is a district student account. Case-insensitive. */
export function isSchoolStudentEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.trim().toLowerCase().endsWith(`@${STUDENT_EMAIL_DOMAIN}`)
}
