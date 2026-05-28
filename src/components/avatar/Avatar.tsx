// Avatar composer. Stacks SVG layers in fixed z-order:
//   background → body → neck → hair_back → ears → head → hair_front → brows
//   → eyes → nose → facial_hair → mouth → eyewear → head item → pin
// Traits are authored here (identity); items come in from the DB catalog and
// are rendered with their svg_layer strings.

import type { AvatarTraits, AvatarItem, EquippedItems, SkinTone, FaceShape, HairStyle, HairColor, EyeShape, BrowStyle, MouthStyle, NoseStyle } from '@/lib/avatar/types'
import { withDefaults } from '@/lib/avatar/types'
import { SKIN, HAIR, DEFAULT_SHIRT } from '@/lib/avatar/palette'

interface Props {
  traits: Partial<AvatarTraits> | null | undefined
  equipped?: EquippedItems
  items?: AvatarItem[]      // catalog of items the renderer can look up SVG for
  size?: number             // pixel width (height auto from viewBox aspect)
  className?: string
}

export default function Avatar({ traits, equipped, items, size = 140, className }: Props) {
  const t = withDefaults(traits)
  const itemBySlot = mapEquipped(equipped, items)
  const aspect = 200 / 144
  return (
    <svg
      width={size}
      height={Math.round(size * aspect)}
      viewBox="-72 -82 144 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Student avatar"
    >
      {itemBySlot.background && <RawLayer svg={itemBySlot.background.svg_layer} />}
      {itemBySlot.body ? <RawLayer svg={itemBySlot.body.svg_layer} /> : <Body />}
      <Neck skin={t.skin} />
      <HairBack style={t.hair_style} color={t.hair_color} />
      <Ears skin={t.skin} face={t.face} />
      <Head skin={t.skin} face={t.face} />
      <HairFront style={t.hair_style} color={t.hair_color} />
      <Brows style={t.brows} hairColor={t.hair_color} />
      <Eyes shape={t.eyes} />
      <Nose style={t.nose} skin={t.skin} />
      {itemBySlot.facial_hair && <RawLayer svg={itemBySlot.facial_hair.svg_layer} />}
      <Mouth style={t.mouth} />
      {itemBySlot.eyewear && <RawLayer svg={itemBySlot.eyewear.svg_layer} />}
      {itemBySlot.head && <RawLayer svg={itemBySlot.head.svg_layer} />}
      {itemBySlot.pin && <RawLayer svg={itemBySlot.pin.svg_layer} />}
    </svg>
  )
}

function mapEquipped(equipped: EquippedItems | undefined, items: AvatarItem[] | undefined): Partial<Record<keyof EquippedItems, AvatarItem>> {
  const out: Partial<Record<keyof EquippedItems, AvatarItem>> = {}
  if (!equipped || !items) return out
  const bySlug = new Map(items.map((i) => [i.slug, i]))
  for (const [slot, slug] of Object.entries(equipped)) {
    if (!slug) continue
    const item = bySlug.get(slug)
    if (item) out[slot as keyof EquippedItems] = item
  }
  return out
}

// Trusted by definition — items table is admin-write-only.
function RawLayer({ svg }: { svg: string }) {
  return <g dangerouslySetInnerHTML={{ __html: svg }} />
}

// ---------------------------------------------------------------------------
// Trait layers (identity)
// ---------------------------------------------------------------------------

function Body() {
  return (
    <g>
      <ellipse cx="0" cy="90" rx="40" ry="22" fill={DEFAULT_SHIRT} />
      <rect x="-32" y="78" width="64" height="34" rx="6" fill={DEFAULT_SHIRT} />
    </g>
  )
}

function Neck({ skin }: { skin: SkinTone }) {
  return <rect x="-8" y="46" width="16" height="22" fill={SKIN[skin].color} />
}

function Head({ skin, face }: { skin: SkinTone; face: FaceShape }) {
  const c = SKIN[skin].color
  if (face === 'round') return <ellipse cx="0" cy="0" rx="46" ry="48" fill={c} />
  return <ellipse cx="0" cy="2" rx="42" ry="50" fill={c} />
}

function Ears({ skin, face }: { skin: SkinTone; face: FaceShape }) {
  const c = SKIN[skin].color
  const x = face === 'round' ? 46 : 42
  return (
    <g>
      <ellipse cx={-x} cy="2" rx="5" ry="9" fill={c} />
      <ellipse cx={x} cy="2" rx="5" ry="9" fill={c} />
    </g>
  )
}

function HairBack({ style, color }: { style: HairStyle; color: HairColor }) {
  if (style !== 'ponytail') return null
  return <ellipse cx="36" cy="14" rx="10" ry="22" fill={HAIR[color].main} />
}

function HairFront({ style, color }: { style: HairStyle; color: HairColor }) {
  if (style === 'bald') return null
  const c = HAIR[color].main
  if (style === 'short') {
    return <path d="M -44,-12 Q -48,-54 0,-58 Q 48,-54 44,-12 Q 36,-26 0,-30 Q -36,-26 -44,-12 Z" fill={c} />
  }
  if (style === 'ponytail') {
    return (
      <g>
        <path d="M -42,-6 Q -50,-58 0,-58 Q 50,-58 42,-6 Q 38,-22 24,-26 Q 18,-24 12,-26 Q 0,-30 -12,-26 Q -18,-24 -24,-26 Q -38,-22 -42,-6 Z" fill={c} />
        <path d="M -36,-10 Q -28,4 -22,-2" fill={c} />
        <path d="M 36,-10 Q 28,4 22,-2" fill={c} />
      </g>
    )
  }
  // curls
  return (
    <g>
      <ellipse cx="0" cy="-32" rx="44" ry="26" fill={c} />
      <circle cx="-36" cy="-20" r="10" fill={c} />
      <circle cx="36" cy="-20" r="10" fill={c} />
      <circle cx="-30" cy="-44" r="9" fill={c} />
      <circle cx="30" cy="-44" r="9" fill={c} />
      <circle cx="0" cy="-52" r="9" fill={c} />
      <circle cx="-18" cy="-48" r="8" fill={c} />
      <circle cx="18" cy="-48" r="8" fill={c} />
    </g>
  )
}

function Brows({ style, hairColor }: { style: BrowStyle; hairColor: HairColor }) {
  const c = HAIR[hairColor].dark
  if (style === 'straight') {
    return (
      <g>
        <rect x="-26" y="-18" width="14" height="3.5" rx="1.5" fill={c} />
        <rect x="12" y="-18" width="14" height="3.5" rx="1.5" fill={c} />
      </g>
    )
  }
  return (
    <g>
      <path d="M -26,-16 Q -19,-20 -12,-16" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
      <path d="M 12,-16 Q 19,-20 26,-16" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

function Eyes({ shape }: { shape: EyeShape }) {
  if (shape === 'small') {
    return (
      <g>
        <ellipse cx="-15" cy="-4" rx="3" ry="3.6" fill="#1F1812" />
        <ellipse cx="15" cy="-4" rx="3" ry="3.6" fill="#1F1812" />
      </g>
    )
  }
  return (
    <g>
      <ellipse cx="-15" cy="-2" rx="4.2" ry="5" fill="#1F1812" />
      <ellipse cx="15" cy="-2" rx="4.2" ry="5" fill="#1F1812" />
      <circle cx="-13" cy="-4" r="1.4" fill="#FFFFFF" />
      <circle cx="17" cy="-4" r="1.4" fill="#FFFFFF" />
    </g>
  )
}

function Nose({ style, skin }: { style: NoseStyle; skin: SkinTone }) {
  const c = SKIN[skin].shadow
  if (style === 'button') return <ellipse cx="0" cy="10" rx="2.2" ry="1.6" fill={c} />
  return <ellipse cx="0" cy="12" rx="3.2" ry="2" fill={c} />
}

function Mouth({ style }: { style: MouthStyle }) {
  if (style === 'smile') {
    return <path d="M -8,22 Q 0,30 8,22" fill="none" stroke="#1F1812" strokeWidth="2.2" strokeLinecap="round" />
  }
  return <path d="M -8,22 Q 0,32 8,22 Q 0,28 -8,22 Z" fill="#9B3349" />
}
