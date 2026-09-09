'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UserRound } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import type { MeBundle } from '@/app/api/avatar/me/route'
import styles from './LessonViewer.module.css'

export default function LessonAvatar() {
  const [portrait, setPortrait] = useState<MeBundle | null>(null)
  useEffect(() => {
    let controller: AbortController | null = null
    const load = async () => {
      controller?.abort()
      controller = new AbortController()
      const signal = controller.signal
      try {
        const response = await fetch('/api/avatar/me', { signal })
        if (!response.ok) return
        const bundle = await response.json() as MeBundle
        if (!signal.aborted && Array.isArray(bundle.equipped_items)) setPortrait(bundle)
      } catch { /* Keep the last confirmed avatar if a refresh fails. */ }
    }
    const refresh = () => { if (document.visibilityState === 'visible') void load() }
    void load()
    window.addEventListener('avatar-updated', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      controller?.abort()
      window.removeEventListener('avatar-updated', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])
  const ready = Boolean(portrait?.setup_completed && portrait.traits)
  const label = ready ? 'Your avatar — customize your look' : 'Your avatar — open avatar builder'
  return <Link href="/avatar" className={styles.avatar} aria-label={label} title={label}>
    {ready && portrait ? <Avatar traits={portrait.traits} equipped={portrait.equipped} items={portrait.equipped_items} size={64} decorative />
      : <UserRound size={30} aria-hidden="true" />}
  </Link>
}
