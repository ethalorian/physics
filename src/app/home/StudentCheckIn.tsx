'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, ArrowRight, Coins, Flame, Pencil, Sparkles, Sprout, UserRound } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import StudentClasses from './StudentClasses'
import type { MeBundle } from '@/app/api/avatar/me/route'
import styles from './home.module.css'

interface StudentCheckInProps {
  name?: string
  streak?: number
  points?: { xp: number; balance: number }
  loading: boolean
  focus?: string
  action?: { href: string; label: string }
  onGrowth?: () => void
  growthActive?: boolean
}

export default function StudentCheckIn({ name, streak, points, loading, focus, action, onGrowth, growthActive }: StudentCheckInProps) {
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
      <Link href="/avatar" className={styles.portraitLink} aria-label={avatarLabel}>
        <span className={styles.portraitHalo} aria-hidden="true" />
        {hasAvatar ? <Avatar traits={portrait.traits} equipped={portrait.equipped} items={portrait.equipped_items} size={152} className={styles.portrait} decorative />
          : <UserRound aria-hidden="true" className={styles.portraitPlaceholder} />}
        <Sparkles className={styles.portraitSpark} size={24} aria-hidden="true" />
      </Link>
      <div className={styles.welcome}>
        <p className={styles.welcomeEyebrow}>Your daily check-in</p>
        <h1 id="check-in-heading">{name ? `Hey, ${name}!` : 'Your classroom'}</h1>
        <p className={styles.welcomeMessage}>A little practice. A new discovery.<br />More to make your own.</p>
        <div className={styles.heroClasses}><StudentClasses /></div>
        {streak !== undefined && streak > 0 && <span className={styles.streak}><Flame size={15} aria-hidden="true" />{streak}-day streak. Keep it going.</span>}
        <p className={styles.welcomeFocus}>Today’s starting point<br /><strong>{focus ?? 'Find your next learning step below'}</strong></p>
      </div>
      <div className={styles.xpDisplay} aria-label="Your earned XP and spending balance">
        <p className={styles.xpLabel}><Sparkles size={16} aria-hidden="true" />Lifetime XP</p>
        <p className={styles.xpTotal}>{points ? points.xp.toLocaleString() : '—'}</p>
        <p className={styles.xpCaption}>{loading ? 'Loading your XP…' : points ? 'Earned through your work' : 'XP is unavailable right now.'}</p>
        <Link href="/store" className={styles.balance}><Coins size={17} aria-hidden="true" /><span><strong>{points ? points.balance.toLocaleString() : '—'}</strong> XP to spend</span><ArrowUpRight size={16} aria-hidden="true" /></Link>
      </div>
      <Link href="/avatar" className={styles.personalize}><Pencil size={17} aria-hidden="true" />{hasAvatar ? 'Change your look' : avatarLoading || avatarError ? 'My avatar' : 'Build my avatar'}</Link>
      <div className={styles.welcomeActions}>{action && <Link href={action.href} className={styles.startLearning}>{action.label}<ArrowRight size={17} aria-hidden="true" /></Link>}{onGrowth && <button type="button" onClick={onGrowth} aria-controls="learning-dashboard-content" aria-current={growthActive ? 'page' : undefined}>My growth<Sprout size={19} aria-hidden="true" /></button>}</div>
    </section>
  )
}
