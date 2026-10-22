import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getEffectiveContext } from '@/lib/effective-context'

export default async function HomeLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (session?.user?.email && (await getEffectiveContext(session.user.email)).role === 'observer') redirect('/admin/analytics')
  return children
}
