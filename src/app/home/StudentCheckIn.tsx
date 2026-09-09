'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Coins, Flame, Gift, Joystick, Pencil, Sparkles, Star, UserRound, Users } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import { Button } from '@/components/ui/button'
import type { MeBundle } from '@/app/api/avatar/me/route'
import styles from './home.module.css'

interface StudentCheckInProps {
  name?: string
  points?: { xp: number; balance: number }
  streak?: number
  loading: boolean
}

export default function StudentCheckIn({ name, points, streak, loading }: StudentCheckInProps) {
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
  const avatarLabel = hasAvatar ? 'Customize your avatar' : avatarLoading ? 'Open your avatar' : avatarError ? 'Open your avatar' : 'Build your avatar'

  return (
    <section className={styles.checkIn} aria-labelledby="check-in-heading">
      <div className={styles.portraitArea}>
        <Link href="/avatar" className={styles.portraitLink} aria-label={avatarLabel}>
          <span className={styles.portraitHalo} aria-hidden="true" />
          {hasAvatar ? <Avatar traits={portrait.traits} equipped={portrait.equipped} items={portrait.equipped_items} size={275} className={styles.portrait} />
            : <span className={styles.portraitPlaceholder}><UserRound aria-hidden="true" size={80} /><span>{avatarLoading ? 'Loading avatar…' : avatarError ? 'Avatar unavailable' : 'Make it you'}</span></span>}
          <span className={styles.editAvatar}><Pencil size={14} aria-hidden="true" />{hasAvatar ? 'Change your look' : avatarLoading || avatarError ? 'My avatar' : 'Build my avatar'}</span>
        </Link>
      </div>

      <div className={styles.welcome}>
        <p className="text-overline text-primary">Your daily check-in</p>
        <h1 id="check-in-heading" className="text-title-1 mt-2">{name ? `Hey, ${name}!` : 'Your next adventure starts here.'}</h1>
        {portrait?.alias && <p className="mt-1 text-sm font-semibold text-primary">{portrait.alias}</p>}
        <p className="mt-3 text-sm text-muted-foreground">A little practice. A new discovery. More to make your own.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={styles.streak}><Flame size={17} aria-hidden="true" />{loading ? 'Loading streak…' : streak === undefined ? 'Streak unavailable' : streak > 0 ? `${streak}-day streak` : 'A fresh start today'}</span>
          <Link href="/dashboard/growth" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium hover:bg-card/70"><Sparkles size={16} aria-hidden="true" />See your progress</Link>
        </div>

      </div>

        <nav aria-label="Check-in shortcuts" className={`${styles.shortcuts} flex flex-wrap gap-2`}>
          <Button asChild variant="outline" className="min-h-11 bg-card"><Link href="/lobby"><Users aria-hidden="true" />Lobby</Link></Button>
          <Button asChild variant="outline" className="min-h-11 bg-card"><Link href="/arcade"><Joystick aria-hidden="true" />Arcade</Link></Button>
          <Button asChild variant="outline" className="min-h-11 bg-card"><Link href="/store"><Gift aria-hidden="true" />Store</Link></Button>
        </nav>

      <div className={styles.xpDisplay}>
        <div className="flex items-center gap-2 text-sm font-semibold"><Star size={20} fill="currentColor" aria-hidden="true" />Lifetime XP earned</div>
        <p className={styles.xpTotal} aria-label={points ? `${points.xp.toLocaleString()} XP earned` : undefined}>{points ? points.xp.toLocaleString() : '—'}</p>
        <p className="text-sm">{loading ? 'Loading your progress…' : points ? 'Spending never reduces earned XP or goal progress.' : 'XP couldn’t load. Try again below.'}</p>
        <Link href="/store" className={styles.balance}><Coins size={18} aria-hidden="true" /><span><strong>{points ? points.balance.toLocaleString() : '—'}</strong> XP to spend</span><Gift size={17} aria-hidden="true" /></Link>
      </div>
    </section>
  )
}
