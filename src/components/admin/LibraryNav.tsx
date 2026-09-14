'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { safeLessonReturn } from '@/lib/lesson-release'

export default function LibraryNav({ active, admin = true, locationSearch }: { active: 'lessons' | 'coverage' | 'reviews'; admin?: boolean; locationSearch?: string | null }) {
  const [query, setQuery] = useState('')
  const [back, setBack] = useState<string | null>(null)
  useEffect(() => { const p = new URLSearchParams(locationSearch ?? window.location.search); setBack(safeLessonReturn(p.get('return'))); const next = new URLSearchParams(); for (const k of ['class', 'unit', 'target']) if (p.get(k)) next.set(k, p.get(k)!); setQuery(next.size ? '?' + next : '') }, [locationSearch])
  return <div className="mb-5 space-y-2">{back && <Link className="inline-flex min-h-11 items-center text-sm underline" href={back}>← Return to coverage</Link>}<nav aria-label="Library views" className="flex flex-wrap gap-2">{([['lessons', '/admin/dashboard', 'Lessons'], ...(admin ? [['coverage', '/admin/workshop', 'Coverage'], ['reviews', '/admin/reviews', 'Reviews']] : [])]).map(([key, href, label]) => <Link key={key} href={href + query} aria-current={active === key ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-lg border px-4 text-sm ${active === key ? 'bg-primary text-primary-foreground' : ''}`}>{label}</Link>)}</nav></div>
}
