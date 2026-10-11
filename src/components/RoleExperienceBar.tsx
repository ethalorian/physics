'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Eye, ArrowLeft, Repeat2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EXPERIENCE_MARKER } from '@/lib/experience'

export default function RoleExperienceBar() {
  const { data: session } = useSession()
  const experience = session?.experience
  const [notice, setNotice] = useState('')
  const [stale, setStale] = useState(false)
  const [busy, setBusy] = useState(false)
  const bar = useRef<HTMLElement>(null)
  const visible = Boolean(experience || stale || notice)
  useEffect(() => {
    const element = bar.current
    if (!element) return
    const measure = () => document.documentElement.style.setProperty('--role-walkthrough-height', element.offsetHeight + 'px')
    measure()
    const observer = new ResizeObserver(measure); observer.observe(element)
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--role-walkthrough-height') }
  }, [visible])
  useEffect(() => {
    const onBlocked = (event: Event) => setNotice((event as CustomEvent<string>).detail)
    window.addEventListener('experience-blocked', onBlocked)
    return () => window.removeEventListener('experience-blocked', onBlocked)
  }, [])
  useEffect(() => {
    setStale(!experience && document.cookie.split('; ').some(c => c.startsWith(EXPERIENCE_MARKER + '=')))
  }, [experience])
  async function exit() {
    setBusy(true)
    try {
      const response = await fetch('/api/admin/experience', { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not exit. Please try again.')
      try { localStorage.setItem('experience-changed', String(Date.now())) } catch { /* Navigation still exits when storage is unavailable. */ }
      window.location.assign('/admin/home')
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not exit.'); setBusy(false) }
  }
  if (!experience && !stale && !notice) return null
  return <aside ref={bar} aria-label="Role walkthrough" className="sticky top-0 z-[60] border-b border-primary/25 bg-background px-4 py-3 shadow-sm">
    <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-3">
      <div className="flex items-start gap-3"><Eye className="mt-1 size-5 shrink-0 text-primary" /><div>
        <p className="font-semibold capitalize">{experience ? experience.user.role + ' walkthrough' : 'Walkthrough ended or changed'} <span className="ml-2 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium normal-case text-primary">Read-only</span></p>
        <p className="text-sm text-muted-foreground">{experience ? experience.user.name + ' · ' + experience.user.email : 'Return to admin to continue.'}</p>
        <p className="text-xs text-muted-foreground">Actual pages and saved data. Answers, XP, purchases, and edits won’t be saved.</p>
      </div></div>
      <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/experience"><Repeat2 className="size-4" />Change role or account</Link></Button><Button onClick={exit} disabled={busy}><ArrowLeft className="size-4" />{busy ? 'Returning…' : 'Return to admin'}</Button></div>
    </div>
    {notice && <p role="status" className="mx-auto mt-2 max-w-screen-2xl text-sm text-primary">{notice}</p>}
  </aside>
}
