import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { experienceDatabaseFetch } from './experience-db-fetch'
import { lookupTransport, type LookupName } from './request-runtime'

const paths = new Map<string, LookupName>([
  ['/rest/v1/user_roles', 'roles'],
  ['/rest/v1/course_students', 'memberships'],
  ['/rest/v1/present_sessions', 'poll_sessions'],
])

export const lookupDatabaseFetch: typeof fetch = (input, init) => {
  const url = input instanceof Request ? input.url : String(input)
  const method = init?.method ?? (input instanceof Request ? input.method : 'GET')
  const name = method.toUpperCase() === 'GET' ? paths.get(new URL(url).pathname) : undefined
  const send = () => experienceDatabaseFetch(input, init)
  return name ? lookupTransport(name, send) : send()
}

// Separate server-only transport keeps telemetry out of the shared browser
// client. Preserve the existing preview write guard and service-role behavior.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Server database configuration is required for account lookups.')
export const lookupDatabase = createClient(url, key, {
  global: { fetch: lookupDatabaseFetch },
  auth: { autoRefreshToken: false, persistSession: false },
})
