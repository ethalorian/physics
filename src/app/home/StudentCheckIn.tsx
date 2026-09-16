'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Flame, Pencil, UserRound } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import StudentClasses from './StudentClasses'
import type { MeBundle } from '@/app/api/avatar/me/route'
import styles from './home.module.css'

interface StudentCheckInProps {
  name?: string
  streak?: number
}

export default function StudentCheckIn({ name, streak }: StudentCheckInProps) {
  const [portrait, setPortrait] = useState<MeBundle | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(true)
  const [avatarError, setAvatarError] = useState(false)

  useEffect(() => {
    let controller: AbortController | null = null
    const load = async () => {
      controller?.abort()
      controller = new AbortController()
      const signal = controller.signal
      try {
        const response = await fetch('/api/avatar/me', { signal })
        if (!response.ok) throw new Error('avatar')
        const bundle = await response.json() as MeBundle
        if (!Array.isArray(bundle.equipped_items)) throw new Error('avatar')
        if (!signal.aborted) { setPortrait(bundle); setAvatarError(false) }
      } catch { if (!signal.aborted) setAvatarError(true) }
      finally { if (!signal.aborted) setAvatarLoading(false) }
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

  const hasAvatar = portrait?.setup_completed && portrait.traits
  const avatarLabel = hasAvatar ? 'Customize your avatar' : avatarLoading || avatarError ? 'Open your avatar' : 'Build your avatar'

  return (
    <section className={styles.checkIn} aria-labelledby="check-in-heading">
      <Link href="/avatar" className={styles.portraitLink} aria-label={avatarLabel} title={avatarLabel}>
        {hasAvatar ? <Avatar traits={portrait.traits} equipped={portrait.equipped} items={portrait.equipped_items} size={72} decorative />
          : <UserRound aria-hidden="true" size={32} />}
        <span className={styles.editAvatar}><Pencil size={12} aria-hidden="true" /></span>
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1"><h1 id="check-in-heading" className="text-title-2 break-words">{name ? `Hi, ${name}` : 'Your classroom'}</h1>{streak !== undefined && streak > 0 && <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"><Flame size={14} aria-hidden="true" />{streak}-day streak</span>}</div>
        <StudentClasses />
      </div>
    </section>
  )
}
