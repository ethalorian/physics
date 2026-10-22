import { redirect } from 'next/navigation'
import { legacyLibraryHref } from '@/lib/library-navigation'

export default async function LegacyLibraryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const values = await searchParams, params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) if (typeof value === 'string') params.set(key, value)
  redirect(legacyLibraryHref('/admin/dashboard', params.toString()))
}
