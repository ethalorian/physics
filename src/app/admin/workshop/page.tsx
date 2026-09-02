import { auth } from '@/lib/auth'
import { getEffectiveContext } from '@/lib/effective-context'
import { redirect } from 'next/navigation'
import WorkshopStudio from '@/components/admin/WorkshopStudio'

// Workshop — admin-only curriculum studio. The nav already hides it from
// teachers, but a direct URL used to hang on "Loading the shelf…" because the
// API 403s silently; gate it server-side like /admin/collaborators instead.
export default async function WorkshopPage() {
  const session = await auth()
  const email = session?.user?.email ?? ''
  if (!email) redirect('/home')
  const ec = await getEffectiveContext(email)
  if (ec.realRole !== 'admin') redirect(ec.realRole === 'student' ? '/home' : '/admin/home')

  return <WorkshopStudio />
}
