import 'server-only'
import { cookies } from 'next/headers'
import { EXPERIENCE_COOKIE } from './experience'
import { verifyExperience } from './experience-token'

export async function readExperience() {
  return verifyExperience((await cookies()).get(EXPERIENCE_COOKIE)?.value, process.env.NEXTAUTH_SECRET)
}
