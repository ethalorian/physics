import { experienceAllowsDatabaseRequest } from './experience-db-policy'
import { EXPERIENCE_COOKIE, EXPERIENCE_READ_ONLY } from './experience'

// A request-scoped cookie reader is registered by server instrumentation. Only
// the function is global; no user's identity or preview state is held globally.
const guardKey = Symbol.for('antocci.experience.readOnlyRequest')
type GuardGlobal = typeof globalThis & { [guardKey]?: () => Promise<boolean> }
export function registerExperienceDatabaseGuard(reader: () => Promise<boolean>) {
  ;(globalThis as GuardGlobal)[guardKey] = reader
}
export const experienceDatabaseFetch: typeof fetch = async (input, init) => {
  const url = input instanceof Request ? input.url : String(input)
  const method = init?.method ?? (input instanceof Request ? input.method : 'GET')
  const browserPreview = typeof document !== 'undefined' && document.cookie.split('; ').some(c => c.startsWith('role_experience_id='))
  const readOnly = browserPreview || await (globalThis as GuardGlobal)[guardKey]?.() || false
  if (readOnly && !experienceAllowsDatabaseRequest(url, method)) {
    return Response.json({ code: 'EXPERIENCE_READ_ONLY', message: EXPERIENCE_READ_ONLY, details: null, hint: 'Exit the walkthrough to make changes.' }, { status: 403 })
  }
  return fetch(input, init)
}
export { EXPERIENCE_COOKIE }
