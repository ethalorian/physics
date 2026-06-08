import { auth } from '@/lib/auth'
import { getEffectiveContext } from '@/lib/effective-context'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CollaboratorManager from '@/components/admin/CollaboratorManager'

// Admin-only: grant/revoke per-area curriculum edit rights (collaborators).
export default async function CollaboratorsPage() {
  const session = await auth()
  const email = session?.user?.email ?? ''
  if (!email) redirect('/home')
  const ec = await getEffectiveContext(email)
  if (ec.realRole !== 'admin') redirect(ec.realRole === 'student' ? '/home' : '/admin/home')

  return (
    <div className="max-w-4xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <div className="mb-4">
        <Link href="/admin/home" className="text-sm font-semibold rounded-lg border px-3 py-2 inline-block"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>← Command center</Link>
      </div>
      <h1 className="text-xl font-semibold tracking-tight mb-1">Curriculum collaborators</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>
        Give specific people edit rights to specific curriculum areas. This is how you delegate authoring without making someone a full admin.
      </p>
      <CollaboratorManager />
    </div>
  )
}
