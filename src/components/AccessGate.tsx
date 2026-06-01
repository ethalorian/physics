"use client"

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { getUserRole } from '@/lib/permissions'
import { isSchoolStudentEmail } from '@/lib/access'
import SchoolAccountModal from '@/components/SchoolAccountModal'

// App-wide access gate. Blocks a signed-in STUDENT on a non-school account with
// the "use your school account" modal, covering every page (not just ones that
// opt into EnrollmentGate). Staff are recognized by role/allowlist and always
// pass; the "rostered by a teacher" requirement continues to be enforced by the
// existing EnrollmentGate + server gates.
//
// Pass-through cases (render children unchanged):
//   - not signed in / still loading  → public pages, sign-in, mid-auth
//   - staff (teacher/admin or allowlisted email)
//   - student on the school domain
//   - /embed/* (iframe surfaces) and development (test accounts)
export default function AccessGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname() ?? ''

  if (status !== 'authenticated' || !session?.user?.email) return <>{children}</>
  if (process.env.NODE_ENV === 'development') return <>{children}</>
  if (pathname.startsWith('/embed')) return <>{children}</>

  const email = session.user.email
  // Staff bypass: session role OR the email allowlist (covers the owner's
  // personal admin address, which isn't on a school domain).
  const isStaff = (session.user.role && session.user.role !== 'student') || getUserRole(email) !== 'student'
  if (isStaff) return <>{children}</>

  if (!isSchoolStudentEmail(email)) return <SchoolAccountModal email={email} />

  return <>{children}</>
}
