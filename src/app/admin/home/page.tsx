import { redirect } from 'next/navigation'
import { legacyWorkspaceHref } from '@/lib/teaching-navigation'
import { auth } from '@/lib/auth'
import { getEffectiveContext } from '@/lib/effective-context'
export default async function LegacyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await auth()
  if (session?.user?.email && (await getEffectiveContext(session.user.email)).role === 'observer') redirect('/admin/analytics')
  const values = await searchParams
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) if (typeof value === 'string') search.set(key, value)
  redirect(legacyWorkspaceHref('/admin/home', search.toString()))
}
