'use client'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/hooks/usePermissions'
import AssignmentChapterReader from './AssignmentChapterReader'
import { INTERACTIVE_CHAPTERS } from './registry'

export default function ChapterLibraryReader({ book, chapter }: { book: string; chapter: string }) {
  const { data: session } = useSession()
  const { userRole } = usePermissions()
  const definition = INTERACTIVE_CHAPTERS.find(d => d.book === book && String(d.chapter) === chapter && d.language === 'en')
  if (!definition) return <div className="p-6"><h1 className="text-title-1">This chapter is not yet available in the interactive reader.</h1><Link href="/textbook/interactive" className="underline">Return to the textbook library</Link></div>
  if (!session?.user?.id) return <p role="status" className="p-6">Loading your reading space…</p>
  const teacher = userRole === 'teacher' || userRole === 'admin'
  return <AssignmentChapterReader definition={definition} teacher={teacher} storageKey={`antocci:reader:${session.user.id}:${definition.book}:${definition.chapter}:${definition.language}:${definition.contentVersion}`} backLink={<div className="space-y-3 text-sm"><Link className="block underline" href="/textbook/interactive">← Interactive library</Link><Link className="block underline" href={teacher ? '/admin/readings/syllabus' : '/readings'}>{teacher ? 'Assign through reading syllabus →' : 'Open my reading assignment →'}</Link><p>Chapter browsing · Open an assigned reading to submit responses and access linked activities.</p></div>} />
}
