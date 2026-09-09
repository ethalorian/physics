'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { classLevelLabel, classProgramLabel, type StudentClassIdentity } from '@/lib/class-identity'
import styles from './home.module.css'

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
  return <section className={styles.classIdentity} aria-label="Your enrolled classes">
    {loading ? <p role="status" className="text-sm text-muted-foreground">Loading your class…</p>
      : error ? <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">Your class details couldn’t load.<Button variant="ghost" className="min-h-11" onClick={() => setRetry(n => n + 1)}>Retry class details</Button></div>
      : !classes.length ? <p className="text-sm text-muted-foreground">No active class enrollment. Ask your teacher to check your class.</p>
      : <ul className="space-y-3">{classes.map(course => {
        const honors = course.track?.trim().toLowerCase() === 'honors'
        return <li key={course.id} className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className={`${styles.levelBadge} ${honors ? styles.honorsBadge : ''}`}>
            {honors ? <Star size={16} aria-hidden="true" fill="currentColor" /> : <GraduationCap size={18} aria-hidden="true" />}
            {classLevelLabel(course.track)}
          </span>
          <div className="min-w-0 flex-1 basis-48"><p className="text-sm font-semibold break-words">{course.name}{course.section ? ` · ${course.section}` : ''}</p><p className="text-xs text-muted-foreground">{classProgramLabel(course.program)}</p></div>
          <p className="text-sm break-words"><span className="text-muted-foreground">Teacher: </span>{course.teacher ?? 'Not assigned yet'}</p>
        </li>
      })}</ul>}
  </section>
}
