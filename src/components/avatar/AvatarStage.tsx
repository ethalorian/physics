'use client'

import { useState } from 'react'
import { Maximize, ScanFace, Play, Pause } from 'lucide-react'
import AvatarCharacter from './AvatarCharacter'
import { Item, Sprite } from './MangaParts'
import type { AvatarItem, AvatarTraits, EquippedItems } from '@/lib/avatar/types'
import styles from './avatar-stage.module.css'

export default function AvatarStage({ traits, equipped, items, name, closeUp, onCloseUp, trying }: {
  traits: AvatarTraits; equipped: EquippedItems; items: AvatarItem[]; name: string
  closeUp: boolean; onCloseUp: (value: boolean) => void; trying?: string
}) {
  const [view, setView] = useState<'front' | 'side' | 'desk'>('front')
  const [walking, setWalking] = useState(false)
  const portrait = { traits, equipped, equipped_items: items, setup_completed: true, alias: name }
  const background = items.find(item => item.slot === 'background' && item.slug === equipped.background)
  return <section className={styles.stage} aria-label="Dressing room mirror">
    <div className={styles.topline}><span>CHARACTER STUDIO</span><span className={styles.roomNumber}>{trying ? 'TRY-ON' : 'YOUR LOOK'}</span></div>
    <div className={styles.room} data-close-up={closeUp && view !== 'desk'} data-view={view}>
      <svg className={styles.backdrop} viewBox="0 0 400 500" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        {background ? <Item item={background} rect={[0,0,400,500]} /> : <Sprite name="observatory-scene" rect={[0,0,400,500]} />}
      </svg>
      <div className={styles.character}><AvatarCharacter portrait={portrait} sampleStudent={false} pose={view === 'desk' ? 'seated' : view === 'side' ? walking ? 'walking' : 'side' : 'standing'} /></div>
      <button type="button" className={styles.zoom} disabled={view === 'desk'} aria-pressed={closeUp && view !== 'desk'} onClick={() => onCloseUp(!closeUp)} aria-label={closeUp ? 'Show full avatar' : 'Close up on avatar'}>{closeUp ? <Maximize size={17} /> : <ScanFace size={17} />}</button>
    </div>
    <div className={styles.signature}><p>{name}</p><span>{trying ? `Trying ${trying}` : background?.name || 'Observatory'}</span></div>
    <div className={styles.controls}>
      <div role="group" aria-label="Avatar view" className={styles.views}>{(['front', 'side', 'desk'] as const).map(id => <button type="button" key={id} aria-pressed={view === id} onClick={() => { setView(id); setWalking(false) }}>{id === 'front' ? 'Front' : id === 'side' ? 'Side' : 'At desk'}</button>)}</div>
      <button type="button" className={styles.walk} aria-pressed={walking} onClick={() => { setView('side'); onCloseUp(false); setWalking(value => !value) }}>{walking ? <Pause size={15} /> : <Play size={15} />}{walking ? 'Pause' : 'Walk'}</button>
    </div>

  </section>
}
