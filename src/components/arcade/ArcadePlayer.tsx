'use client'

import { UserRound } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import AvatarFigure from '@/components/avatar/AvatarFigure'
import CustomizeAvatarLink from '@/components/avatar/CustomizeAvatarLink'
import { useAvatarPortrait } from '@/hooks/useAvatarPortrait'
import styles from './arcade-player.module.css'

/** Saved identity stays independent of cabinet state, scores and the game iframe. */
export default function ArcadePlayer({ compact = false }: { compact?: boolean }) {
  const { portrait, loaded, error } = useAvatarPortrait()
  const ready = Boolean(portrait?.setup_completed && portrait.traits)
  const label = ready ? 'Change your look' : !loaded || error ? 'Open Avatar Studio' : 'Create your avatar'

  return <section className={`${styles.player} ${compact ? styles.compact : styles.lobby}`} aria-label="Your arcade avatar" data-arcade-avatar={compact ? 'cabinet' : 'lobby'}>
    <div className={styles.character}>
      {ready && portrait
        ? compact
          ? <Avatar traits={portrait.traits} equipped={portrait.equipped} items={portrait.equipped_items} size={52} crop="portrait" decorative />
          : <AvatarFigure portrait={portrait} />
        : <UserRound className={styles.placeholder} aria-hidden="true" />}
    </div>
    <div className={styles.identity}>
      {!compact && <p className={styles.eyebrow}>Ready, player?</p>}
      <p className={styles.name}>{ready ? portrait?.alias || 'Your player' : 'Your player'}</p>
      {!compact && <p className={styles.description}>{ready ? 'Your look. Your next personal best.' : !loaded ? 'Loading your avatar…' : error ? 'Your saved look is unavailable right now.' : 'Bring your classroom character to the arcade.'}</p>}
      <CustomizeAvatarLink context="game" label={label} className={styles.customize} />
    </div>
  </section>
}
