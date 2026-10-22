import { redirect } from 'next/navigation'
import { legacyWorkspaceHref } from '@/lib/teaching-navigation'
export default async function LegacyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const values = await searchParams
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) if (typeof value === 'string') search.set(key, value)
  redirect(legacyWorkspaceHref('/admin/challenges', search.toString()))
}
