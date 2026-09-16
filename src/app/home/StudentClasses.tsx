'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { classLevelLabel, classProgramLabel, type StudentClassIdentity } from '@/lib/class-identity'

export default function StudentClasses() {
  const [classes, setClasses] = useState<StudentClassIdentity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timeout = setTimeout(() => controller.abort(), 15000)
    setLoading(true)
    setError(false)
    fetch('/api/me/classes', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('classes')
        const data = await response.json()
        if (!Array.isArray(data.classes)) throw new Error('classes')
        return data.classes as StudentClassIdentity[]
      })
      .then(data => { if (active) setClasses(data) })
      .catch(() => { if (active) setError(true) })
      .finally(() => { clearTimeout(timeout); if (active) setLoading(false) })
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [retry])
  return <section className="mt-1 text-sm" aria-label="Your enrolled classes">
    {loading ? <p role="status" className="text-muted-foreground">Loading your class…</p>
      : error ? <div role="alert" className="flex flex-wrap items-center gap-2">Your class details couldn’t load.<Button variant="ghost" className="min-h-11" onClick={() => setRetry(n => n + 1)}>Retry class details</Button></div>
      : !classes.length ? <p className="text-muted-foreground">No active class enrollment. Ask your teacher to check your class.</p>
      : <details className="group/classes">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-muted-foreground"><span className="min-w-0 break-words">{classes.map(course => `${course.name}${course.section ? ` · ${course.section}` : ''} · ${classLevelLabel(course.track)}`).join(' / ')}</span><ChevronDown size={14} aria-hidden="true" className="shrink-0 group-open/classes:rotate-180" /></summary>
        <ul className="space-y-2 pt-2">{classes.map(course => <li key={course.id} className="text-xs text-muted-foreground">{classes.length > 1 && <strong className="mr-2 text-foreground">{course.name}</strong>}{classProgramLabel(course.program)} · Teacher: {course.teacher ?? 'Not assigned yet'}</li>)}</ul>
      </details>}
  </section>
}
