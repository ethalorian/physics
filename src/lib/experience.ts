import type { UserRole } from './permissions'

export const EXPERIENCE_COOKIE = 'role_experience'
export const EXPERIENCE_MARKER = 'role_experience_id'
export const EXPERIENCE_HEADER = 'x-role-experience'
export const EXPERIENCE_MAX_AGE = 60 * 60
export const EXPERIENCE_READ_ONLY = 'This walkthrough is read-only. No answers, XP, purchases, grades, or settings were saved.'
export type ExperienceUser = { id: string; email: string; name: string; role: UserRole }
export type RoleExperience = {
  id: string
  actor: ExperienceUser
  user: ExperienceUser
  expiresAt: number
  readOnly: true
}
export const ROLE_HOME: Record<UserRole, string> = { student: '/home', teacher: '/admin/classes', observer: '/admin/analytics', admin: '/admin/home' }
export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && ['student', 'teacher', 'observer', 'admin'].includes(value)
}
export function experienceActorMatches(experience: RoleExperience, actor: { id?: string; email?: string | null; role?: string }): boolean {
  return actor.role === 'admin' && actor.id === experience.actor.id && actor.email?.toLowerCase() === experience.actor.email.toLowerCase()
}
export function isExperienceControl(path: string) {
  return path === '/api/admin/experience' || path.startsWith('/api/auth/')
}
// The preview marker is deliberately not an authorization credential. It stops
// a stale tab from submitting work after another tab changes or exits a role.
export function experienceRequestError(path: string, method: string, cookieId: string | null, pageId: string | null): 'changed' | 'read_only' | null {
  if (isExperienceControl(path)) return null
  if (pageId && cookieId !== pageId) return 'changed'
  if (cookieId && !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) return 'read_only'
  return null
}
