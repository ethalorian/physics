'use client'

import Link from 'next/link'
import { UserRound } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import { useAvatarPortrait } from '@/hooks/useAvatarPortrait'
import { useTranslator } from '@/lib/math-translate-store'
import styles from './StudentMathInput.module.css'

export default function MathStudioHeader({ resumed = false, done = false, lang = '' }: { resumed?: boolean; done?: boolean; lang?: string }) {
  const { portrait: me, error: failed } = useAvatarPortrait()
  const t = useTranslator(lang)
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
