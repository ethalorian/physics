'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UserRound } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import type { MeBundle } from '@/app/api/avatar/me/route'
import { useTranslator } from '@/lib/math-translate-store'
import styles from './StudentMathInput.module.css'

export default function MathStudioHeader({ resumed = false, done = false, lang = '' }: { resumed?: boolean; done?: boolean; lang?: string }) {
  const [me, setMe] = useState<MeBundle | null>(null)
  const [failed, setFailed] = useState(false)
  const t = useTranslator(lang)
  useEffect(() => {
    let controller: AbortController | undefined
    let timeout: ReturnType<typeof setTimeout> | undefined
    const load = async () => {
      controller?.abort(); clearTimeout(timeout)
      const current = new AbortController(); controller = current
      timeout = setTimeout(() => current.abort(), 10000)
      try {
        const response = await fetch('/api/avatar/me', { signal: current.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('Avatar unavailable')
        const data = await response.json() as MeBundle
        if (!Array.isArray(data.equipped_items)) throw new Error('Avatar unavailable')
        if (!current.signal.aborted) { setMe(data); setFailed(false) }
      } catch { if (controller === current) setFailed(true) }
      finally { if (controller === current) clearTimeout(timeout) }
    }
    void load()
    window.addEventListener('avatar-updated', load)
    return () => { controller?.abort(); controller = undefined; clearTimeout(timeout); window.removeEventListener('avatar-updated', load) }
  }, [])
  const hasAvatar = Boolean(me?.setup_completed && me.traits)
  return <header className={styles.studioHeader}>
    <Link href="/avatar" className={styles.portrait} aria-label={t(hasAvatar ? 'Your avatar · customize your look' : 'Set up your avatar')}>
      {hasAvatar ? <Avatar traits={me!.traits} equipped={me!.equipped} items={me!.equipped_items} size={88} decorative /> : <UserRound size={38} aria-hidden="true" />}
    </Link>
    <div className={styles.studioGreeting}>
      <p>{me?.alias ? <>{t('Hi,')} {me.alias}.</> : t('Your daily math practice')}</p>
      <h1>{t('Math studio')}</h1>
      <span>{t(done ? 'Your work is in. See your feedback below.' : resumed ? 'Your draft is here. Pick up where you left off.' : 'A little space to think things through.')}</span>
      {!hasAvatar && (me || failed) && <Link href="/avatar">{t(failed ? 'Open your avatar' : 'Make this space yours · create your avatar')}</Link>}
    </div>
  </header>
}
