import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getEffectiveContext } from '@/lib/effective-context'
import { getEditableAreas } from '@/lib/content-access'
import { LIBRARY_SECTIONS, librarySection } from '@/lib/library-navigation'
import { scopedTeachingHref } from '@/lib/teaching-navigation'
import LibraryLessonCatalog from '@/components/admin/LibraryLessonCatalog'
import LibraryResources from '@/components/admin/LibraryResources'
import LibraryWorkspaceNav from '@/components/admin/LibraryWorkspaceNav'

export default async function LibraryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await auth()
  if (!session?.user?.email) redirect('/auth/signin?callbackUrl=/admin/library')
  const context = await getEffectiveContext(session.user.email)
  if (!['admin', 'teacher', 'observer'].includes(context.role)) redirect('/home')
  const isAdmin = context.role === 'admin', observer = context.role === 'observer'
  const values = await searchParams, params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) if (typeof value === 'string') params.set(key, value)
  const section = librarySection(params.get('section'))
  if (section === 'curriculum' && !isAdmin) { params.set('section', 'lessons'); redirect('/admin/library?' + params) }
  const selected = LIBRARY_SECTIONS.find(item => item.key === section)!
  const editableAreas = observer ? [] : await getEditableAreas(context.scopeEmail, isAdmin)
  return <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-overline text-primary">Library</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{selected.label}</h1><p className="mt-3 max-w-2xl text-sm text-muted-foreground">{selected.description}</p></div>
      <Link className="inline-flex min-h-11 items-center text-sm font-medium text-primary" href={scopedTeachingHref(observer ? '/admin/teacher/plans' : '/admin/control-room?view=plan', params.toString())}>{observer ? 'Course guide' : 'Plan with these materials'} →</Link>
    </header>
    <LibraryWorkspaceNav active={section} isAdmin={isAdmin} />
    {section === 'lessons' ? observer ? <section className="rounded-2xl border bg-card p-6"><h2 className="text-xl font-semibold">Video lessons & concept map</h2><p className="mt-2 text-sm text-muted-foreground">Browse published lessons and explore how the concepts connect.</p><Link className="mt-4 inline-flex min-h-11 items-center text-primary underline" href="/lessons">Browse published lessons →</Link></section> : <Suspense fallback={<p role="status" className="py-8 text-muted-foreground">Loading lesson library…</p>}><LibraryLessonCatalog isAdmin={isAdmin} canEdit={editableAreas.includes('lessons')} /></Suspense> : <LibraryResources section={section} isAdmin={isAdmin} editableAreas={editableAreas} observer={observer} search={params.toString()} />}
  </main>
}
