'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { safeLessonReturn } from '@/lib/lesson-release'
import { libraryHref } from '@/lib/library-navigation'

export default function LibraryNav({ active, admin = true, locationSearch }: { active: 'lessons' | 'coverage' | 'reviews'; admin?: boolean; locationSearch?: string | null }) {
  const [query, setQuery] = useState('')
  const [back, setBack] = useState<string | null>(null)
  useEffect(() => { const p = new URLSearchParams(locationSearch ?? window.location.search); setBack(safeLessonReturn(p.get('return'))); const next = new URLSearchParams(); for (const k of ['class', 'unit', 'target']) if (p.get(k)) next.set(k, p.get(k)!); setQuery(next.size ? '?' + next : '') }, [locationSearch])
  return <div className="mb-5">{back ? <Link className="inline-flex min-h-11 items-center text-sm underline" href={back}>← Return to coverage</Link> : <Link className="inline-flex min-h-11 items-center text-sm text-primary" href={libraryHref(admin && active !== 'lessons' ? 'curriculum' : 'lessons', query)}>← {admin && active !== 'lessons' ? 'Curriculum tools' : 'Lessons & activities'}</Link>}</div>
}
