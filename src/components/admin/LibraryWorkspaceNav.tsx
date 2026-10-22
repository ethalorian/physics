'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { LIBRARY_SECTIONS, libraryHref, type LibrarySection } from '@/lib/library-navigation'

export default function LibraryWorkspaceNav({ active, isAdmin = false }: { active: LibrarySection; isAdmin?: boolean }) {
  const search = useSearchParams().toString()
  return <nav aria-label="Library sections" className="flex flex-wrap gap-2 border-b pb-4">
    {LIBRARY_SECTIONS.filter(section => !('adminOnly' in section) || isAdmin).map(section => <Link
      key={section.key} href={libraryHref(section.key, search)} aria-current={active === section.key ? 'page' : undefined}
      className={`inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium ${active === section.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
    >{section.label}</Link>)}
  </nav>
}
