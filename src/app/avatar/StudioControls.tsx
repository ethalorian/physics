'use client'

import { Check, LockKeyhole, Sparkles, X } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import { TRAIT_LABELS, TRAIT_OPTIONS, type AvatarTraits, type CatalogEntry, type EquippedItems } from '@/lib/avatar/types'
import { SKIN, HAIR, SHIRT, EYE } from '@/lib/avatar/palette'
import styles from './avatar-studio.module.css'

const nice = (value: string) => value.replaceAll('_', ' ')
function swatch(trait: keyof AvatarTraits, value: string): string | undefined {
  if (trait === 'skin') return SKIN[value as keyof typeof SKIN]?.color
  if (trait === 'hair_color' || trait === 'facial_hair_color') return HAIR[value as keyof typeof HAIR]?.main
  if (trait === 'shirt_color' || trait === 'fabric_color') return SHIRT[value as keyof typeof SHIRT]
  if (trait === 'eye_color') return EYE[value as keyof typeof EYE]
}
export function TraitPicker({ trait, traits, onChange }: { trait: keyof AvatarTraits; traits: AvatarTraits; onChange: (value: string) => void }) {
  const colors = ['skin', 'hair_color', 'facial_hair_color', 'shirt_color', 'fabric_color', 'eye_color'].includes(trait)
  const adjustments = ['eye_spacing', 'eye_scale', 'eye_tilt', 'brow_height', 'mouth_width'].includes(trait)
  return <section className={styles.trait} aria-label={TRAIT_LABELS[trait]}>
    <div className={styles.traitHeading}><h3>{TRAIT_LABELS[trait]}</h3><span>{nice(traits[trait])}</span></div>
    <div className={colors ? styles.swatches : adjustments ? styles.adjustments : styles.traitGrid}>{TRAIT_OPTIONS[trait].map(value => {
      const color = swatch(trait, value), selected = traits[trait] === value
      return <button type="button" key={value} aria-pressed={selected} aria-label={`${TRAIT_LABELS[trait]}: ${nice(value)}`} title={nice(value)} onClick={() => onChange(value)}>
        {colors ? <span className={styles.swatch} style={{ background: color || 'conic-gradient(#5c3423, #ddd1ac, #5c3423)' }}>{selected && <Check size={17} className={styles.swatchCheck} />}</span> : !adjustments && <Avatar traits={{ ...traits, [trait]: value }} size={72} crop={trait === 'shirt_style' ? 'medium' : 'head'} decorative />}
        <span className={colors ? styles.srOnly : undefined}>{value === 'match' ? 'Match hair' : nice(value)}</span>
        {!colors && selected && <Check size={13} className={styles.choiceCheck} aria-hidden="true" />}
      </button>
    })}</div>
  </section>
}
export function itemStatus(item: CatalogEntry): string {
  if (item.state === 'owned') return item.enabled === false ? 'Owned · archived' : 'Owned'
  if (item.state === 'staff_free') return 'Free for staff'
  if (item.unlock_target_id) return item.state === 'unlock_available' ? 'Ready to claim' : 'Mastery reward'
  return `${(item.cost_xp ?? 0).toLocaleString()} XP`
}
export function ItemTile({ item, traits, equipped, items, selected, wearing, onTry }: {
  item: CatalogEntry; traits: AvatarTraits; equipped: EquippedItems; items: CatalogEntry[]
  selected: boolean; wearing: boolean; onTry: () => void
}) {
  const figure = item.slot === 'body'
  // Show only this slot in the tile, so an equipped helmet cannot hide eyewear or hair.
  return <button type="button" className={styles.itemTile} data-slot={item.slot} aria-pressed={selected} aria-label={`Try on ${item.name} · ${itemStatus(item)}`} onClick={onTry}>
    <span className={styles.itemArt}><Avatar traits={traits} equipped={{ ...(figure ? { head: equipped.head } : {}), [item.slot]: item.slug }} items={items} size={figure ? 92 : 102} crop={figure ? 'figure' : item.slot === 'background' || item.slot === 'pin' ? 'medium' : 'head'} decorative /></span>
    {wearing && <span className={styles.wornBadge}><Check size={11} />Wearing</span>}
    {item.state === 'locked_until_mastery' && <LockKeyhole size={13} className={styles.lockBadge} aria-hidden="true" />}
    <span className={styles.itemName}>{item.name}</span><span className={styles.itemPrice}>{itemStatus(item)}</span>
  </button>
}
export function ItemDetail({ item, wearing, trying, balance, onEquip, onBuy, onClose, onRemove }: {
  item: CatalogEntry; wearing: boolean; trying: boolean; balance: number
  onEquip: () => void; onBuy: () => void; onClose: () => void; onRemove: () => void
}) {
  const owned = item.state === 'owned', locked = item.state === 'locked_until_mastery'
  const canAcquire = item.enabled !== false && ['affordable', 'staff_free', 'unlock_available'].includes(item.state)
  return <section className={styles.itemDetail} aria-label="Selected item">
    <div className={styles.detailCopy}><p className={styles.eyebrow}>{trying ? 'IN THE FITTING ROOM' : 'IN YOUR LOOK'}</p><h3>{item.name}</h3><p>{itemStatus(item)}{trying ? ' · Preview only' : ''}</p>
      {item.unlock_target_id && !owned && <p>{item.target_statement || 'Build mastery to unlock this item.'} · Level {(item.unlock_progress ?? 0).toFixed(1)} / {Number(item.unlock_min_level ?? 2.5).toFixed(1)}</p>}
      {item.state === 'too_expensive' && <p>Earn {Math.max(0, (item.cost_xp ?? 0) - balance).toLocaleString()} more XP to get this.</p>}
    </div>
    <div className={styles.detailActions}>
      {owned ? <button type="button" className={styles.primary} onClick={wearing ? onRemove : onEquip}>{wearing ? 'Remove item' : item.slot === 'background' ? 'Use scene' : 'Wear this'}</button> : <button type="button" className={styles.primary} disabled={!canAcquire} onClick={onBuy}>{item.state === 'staff_free' ? 'Add to wardrobe' : item.state === 'unlock_available' ? 'Claim item' : locked ? 'Mastery locked' : `Buy · ${(item.cost_xp ?? 0).toLocaleString()} XP`}</button>}
      {trying && <button type="button" className={styles.textButton} onClick={onClose}><X size={13} />End try-on</button>}
    </div>
  </section>
}
export const STYLE_BRIEFS = [
  { title: 'Ready for first contact?', text: 'Build a look for your asteroid mission. Start with a color that feels like outer space.', collection: 'everyday' },
  { title: 'A little after-dark magic.', text: 'Put together a costume, then find a background that tells its story.', collection: 'costume' },
  { title: 'School spirit, your way.', text: 'Mix team colors with your favorite hair and accessories.', collection: 'sport' },
] as const
export function StyleBrief({ index, onNext, onBrowse }: { index: number; onNext: () => void; onBrowse: () => void }) {
  const brief = STYLE_BRIEFS[index]
  return <aside className={styles.brief}><Sparkles size={20} aria-hidden="true" /><div><p className={styles.eyebrow}>A LITTLE INSPIRATION</p><h3>{brief.title}</h3><p>{brief.text}</p><div><button type="button" onClick={onBrowse}>Explore the collection →</button><button type="button" onClick={onNext}>Another idea</button></div></div></aside>
}
