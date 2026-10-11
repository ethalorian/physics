import 'server-only'
import { cookies } from 'next/headers'
import { EXPERIENCE_COOKIE, registerExperienceDatabaseGuard } from './experience-db-fetch'

registerExperienceDatabaseGuard(async () => {
  try { return (await cookies()).has(EXPERIENCE_COOKIE) }
  catch (error) {
    // Build scripts and background jobs have no request context, hence no
    // preview identity. Any other failure must not silently enable writes.
    if (error instanceof Error && /outside a request scope/.test(error.message)) return false
    throw error
  }
})
