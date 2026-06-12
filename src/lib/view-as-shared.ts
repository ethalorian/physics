// Client-safe constants/helpers for "view as teacher". Kept separate from
// effective-context.ts (which imports next/headers and is server-only).

export const VIEW_AS_COOKIE = 'view_as_teacher'

export function readViewAsCookie(): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|; )view_as_teacher=([^;]*)/)
  return m ? decodeURIComponent(m[1]) : null
}

export function setViewAs(email: string): void {
  document.cookie = `${VIEW_AS_COOKIE}=${encodeURIComponent(email)}; path=/; max-age=86400; samesite=lax`
}

export function clearViewAs(): void {
  document.cookie = `${VIEW_AS_COOKIE}=; path=/; max-age=0; samesite=lax`
}

// "View as student" — a UI-ONLY preview for staff (teacher or admin): the navbar
// and page chrome render the student experience, but the server never downgrades
// the caller's role (APIs still see a teacher/admin). Cookie-backed so the choice
// survives reloads; mutually exclusive with "view as teacher" (the toggles clear
// each other). Real students never read this cookie — ViewModeContext ignores it
// unless the session role is staff.

export const STUDENT_VIEW_COOKIE = 'view_as_student'

export function readStudentViewCookie(): boolean {
  if (typeof document === 'undefined') return false
  return /(?:^|; )view_as_student=1(?:;|$)/.test(document.cookie)
}

export function setStudentView(): void {
  clearViewAs() // mutually exclusive with "view as teacher"
  document.cookie = `${STUDENT_VIEW_COOKIE}=1; path=/; max-age=86400; samesite=lax`
}

export function clearStudentView(): void {
  document.cookie = `${STUDENT_VIEW_COOKIE}=; path=/; max-age=0; samesite=lax`
}
