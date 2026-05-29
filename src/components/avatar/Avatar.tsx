// Avatar composer. Stacks SVG layers in fixed z-order:
//   background → body → neck → hair_back → ears → head → hair_front → brows
//   → blush/freckles → eyes → nose → facial_hair → mouth → eyewear → head item → pin
// Traits are authored here (identity); items come in from the DB catalog and
// are rendered with their svg_layer strings.

import type { AvatarTraits, AvatarItem, EquippedItems, SkinTone, FaceShape, HairStyle, HairColor, EyeShape, BrowStyle, MouthStyle, NoseStyle, Freckles, CheekBlush } from '@/lib/avatar/types'
import { withDefaults } from '@/lib/avatar/types'
import { SKIN, HAIR, DEFAULT_SHIRT, FACE_GEO } from '@/lib/avatar/palette'

interface Props {
  traits: Partial<AvatarTraits> | null | undefined
  equipped?: EquippedItems
  items?: AvatarItem[]      // catalog of items the renderer can look up SVG for
  size?: number             // pixel width (height auto from viewBox aspect)
  /**
   * 'full' (default) — entire character with shoulders; aspect ratio 144:200.
   * 'head' — tight square crop focused on the head, for chrome bubbles
   *   (AccountMenu trigger). Wing/helmet flares past x=±60 may clip; that's
   *   the intended tradeoff for filling the bubble.
   * 'medium' — head + shoulders for leaderboard rows and other mid-density
   *   surfaces where students should see their suit/coat too. Aspect ~1.4.
   */
  crop?: 'full' | 'head' | 'medium'
  className?: string
}

// Crops sized against the canonical layout. 'head' clips Viking-wing flares
// past x=±60; 'medium' is wide enough at x=±68 to keep them in frame and
// tall enough at y=-64 to +104 to show the shirt collar and the pin row.
const VIEWBOXES = {
  full:   { vb: '-72 -82 144 200', aspect: 200 / 144 },
  head:   { vb: '-60 -64 120 120', aspect: 1 },
  medium: { vb: '-68 -64 136 168', aspect: 168 / 136 },
} as const

export default function Avatar({ traits, equipped, items, size = 140, crop = 'full', className }: Props) {
  const t = withDefaults(traits)
  const itemBySlot = mapEquipped(equipped, items)
  const { vb, aspect } = VIEWBOXES[crop]
  // Features ride a per-face vertical shift so the eye/brow/mouth cluster sits
  // visually balanced on each silhouette instead of clinging to round-face
  // coordinates. See FACE_GEO for the shape-by-shape values.
  const featureShift = FACE_GEO[t.face].featureYShift
  return (
    <svg
      width={size}
      height={Math.round(size * aspect)}
      viewBox={vb}
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
      {/* Face features + face-anchored items — translated together by
          featureShift so they track the chin/forehead of the chosen face
          shape. Eyewear sits on the eyes and facial hair sits on the chin,
          so both need to shift with the features. Head items (helmets,
          hats) and pins (chest) are anchored to the silhouette, not the
          features, so they live outside this group. */}
      <g transform={featureShift !== 0 ? `translate(0, ${featureShift})` : undefined}>
        <Brows style={t.brows} hairColor={t.hair_color} />
        <CheekBlushLayer style={t.cheek_blush} />
        <FrecklesLayer density={t.freckles} skin={t.skin} />
        <Eyes shape={t.eyes} />
        <Nose style={t.nose} skin={t.skin} />
        {itemBySlot.facial_hair && <RawLayer svg={itemBySlot.facial_hair.svg_layer} />}
        <Mouth style={t.mouth} />
        {itemBySlot.eyewear && <RawLayer svg={itemBySlot.eyewear.svg_layer} />}
      </g>
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
  if (face === 'egg') return <ellipse cx="0" cy="2" rx="42" ry="50" fill={c} />
  // square — flatter cheeks + a defined jaw so it reads distinctly from 'round'.
  // Rounded-rectangle silhouette within the ±48 / ±46 extents (ears anchor at ±48).
  // square — flatter cheeks + a defined jaw so it reads distinctly from 'round'.
  // Rounded-rectangle silhouette within the ±48 / ±46 extents (ears anchor at ±48).
  if (face === 'square') return <path d="M -48,-28 Q -48,-46 -28,-46 L 28,-46 Q 48,-46 48,-28 L 48,28 Q 48,46 26,46 L -26,46 Q -48,46 -48,28 Z" fill={c} />
  // heart — broader forehead, narrower chin via a path
  return <path d="M -42,-8 Q -48,-58 0,-58 Q 48,-58 42,-8 Q 36,38 0,46 Q -36,38 -42,-8 Z" fill={c} />
}

function Ears({ skin, face }: { skin: SkinTone; face: FaceShape }) {
  const c = SKIN[skin].color
  // Ear anchor follows the widest point of the head silhouette.
  const positions: Record<FaceShape, { x: number; y: number }> = {
    round:  { x: 46, y: 2 },
    egg:    { x: 42, y: 2 },
    square: { x: 48, y: 2 },
    heart:  { x: 42, y: -4 },
  }
  const p = positions[face]
  return (
    <g>
      <ellipse cx={-p.x} cy={p.y} rx="5" ry="9" fill={c} />
      <ellipse cx={p.x} cy={p.y} rx="5" ry="9" fill={c} />
    </g>
  )
}

function HairBack({ style, color }: { style: HairStyle; color: HairColor }) {
  const c = HAIR[color].main
  if (style === 'ponytail') {
    return <ellipse cx="36" cy="14" rx="10" ry="22" fill={c} />
  }
  if (style === 'long') {
    // Side curtains behind the ears, falling to shoulder height.
    return (
      <g>
        <path d="M -44,-10 Q -50,12 -46,40 L -32,46 Q -34,18 -32,-4 Z" fill={c} />
        <path d="M 44,-10 Q 50,12 46,40 L 32,46 Q 34,18 32,-4 Z" fill={c} />
      </g>
    )
  }
  return null
}

function HairFront({ style, color }: { style: HairStyle; color: HairColor }) {
  if (style === 'bald') return null
  const c = HAIR[color].main
  const d = HAIR[color].dark

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
  if (style === 'curls') {
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
  if (style === 'afro') {
    // Big textured halo surrounding the head.
    return (
      <g>
        <ellipse cx="0" cy="-30" rx="56" ry="32" fill={c} />
        <circle cx="-50" cy="-12" r="14" fill={c} />
        <circle cx="50" cy="-12" r="14" fill={c} />
        <circle cx="-30" cy="-56" r="13" fill={c} />
        <circle cx="30" cy="-56" r="13" fill={c} />
        <circle cx="0" cy="-62" r="12" fill={c} />
      </g>
    )
  }
  if (style === 'locs') {
    return (
      <g>
        {/* base cap */}
        <path d="M -44,-12 Q -50,-56 0,-58 Q 50,-56 44,-12 Q 36,-26 0,-30 Q -36,-26 -44,-12 Z" fill={c} />
        {/* outer locs hanging on outside of the ears */}
        <rect x="-50" y="-14" width="6" height="38" rx="3" fill={c} />
        <rect x="44" y="-14" width="6" height="38" rx="3" fill={c} />
        {/* short forehead/temple locs */}
        <rect x="-40" y="-22" width="5" height="18" rx="2.5" fill={c} />
        <rect x="-28" y="-26" width="5" height="14" rx="2.5" fill={c} />
        <rect x="-14" y="-28" width="5" height="10" rx="2.5" fill={c} />
        <rect x="9" y="-28" width="5" height="10" rx="2.5" fill={c} />
        <rect x="23" y="-26" width="5" height="14" rx="2.5" fill={c} />
        <rect x="35" y="-22" width="5" height="18" rx="2.5" fill={c} />
      </g>
    )
  }
  if (style === 'braids') {
    return (
      <g>
        {/* base cap */}
        <path d="M -42,-12 Q -48,-54 0,-58 Q 48,-54 42,-12 Q 34,-22 0,-26 Q -34,-22 -42,-12 Z" fill={c} />
        {/* braid lines across the cap */}
        <path d="M -34,-30 Q -8,-42 16,-30" fill="none" stroke={d} strokeWidth="0.9" />
        <path d="M -34,-22 Q -8,-32 16,-22" fill="none" stroke={d} strokeWidth="0.9" />
        <path d="M -32,-16 Q -8,-24 18,-16" fill="none" stroke={d} strokeWidth="0.9" />
        {/* side hanging braids w/ small bead at tip */}
        <rect x="-46" y="-14" width="5" height="34" rx="2.5" fill={c} />
        <circle cx="-43.5" cy="23" r="3.4" fill={c} />
        <rect x="41" y="-14" width="5" height="34" rx="2.5" fill={c} />
        <circle cx="43.5" cy="23" r="3.4" fill={c} />
      </g>
    )
  }
  if (style === 'bun') {
    return (
      <g>
        {/* base cap */}
        <path d="M -38,-12 Q -44,-44 0,-46 Q 44,-44 38,-12 Q 30,-26 0,-28 Q -30,-26 -38,-12 Z" fill={c} />
        {/* top bun + band */}
        <circle cx="0" cy="-54" r="14" fill={c} />
        <rect x="-9" y="-42" width="18" height="4" rx="2" fill={d} />
      </g>
    )
  }
  if (style === 'hijab') {
    // Cloth frames the face + drapes to the shoulders. evenodd fill rule
    // carves an opening for the face so eyes/nose/mouth remain visible.
    return (
      <path
        fillRule="evenodd"
        fill={c}
        d="M -50,-2 Q -52,-58 0,-62 Q 52,-58 50,-2 Q 48,28 28,40 L 24,72 L -24,72 L -28,40 Q -48,28 -50,-2 Z M -40,2 Q -44,-46 0,-48 Q 44,-46 40,2 Q 34,30 0,38 Q -34,30 -40,2 Z"
      />
    )
  }
  // long — top cap. Side curtains live in HairBack so the ears poke through.
  return (
    <path d="M -44,-12 Q -48,-54 0,-58 Q 48,-54 44,-12 Q 36,-26 0,-30 Q -36,-26 -44,-12 Z" fill={c} />
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
  if (style === 'arched') {
    return (
      <g>
        <path d="M -26,-16 Q -19,-20 -12,-16" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
        <path d="M 12,-16 Q 19,-20 26,-16" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
      </g>
    )
  }
  if (style === 'bushy') {
    return (
      <g>
        <rect x="-27" y="-19" width="16" height="5" rx="2.5" fill={c} />
        <rect x="11" y="-19" width="16" height="5" rx="2.5" fill={c} />
      </g>
    )
  }
  // thin
  return (
    <g>
      <rect x="-24" y="-18" width="12" height="1.6" rx="0.8" fill={c} />
      <rect x="12" y="-18" width="12" height="1.6" rx="0.8" fill={c} />
    </g>
  )
}

function Eyes({ shape }: { shape: EyeShape }) {
  if (shape === 'small') {
    return (
      <g>
        <ellipse cx="-15" cy="-4" rx="3" ry="3.6" fill="#1F1812" />
        <ellipse cx="15" cy="-4" rx="3" ry="3.6" fill="#1F1812" />
        {/* catch-lights — keep the plain dots consistent with big/wide eyes */}
        <circle cx="-13.7" cy="-5.4" r="0.9" fill="#FFFFFF" />
        <circle cx="16.3" cy="-5.4" r="0.9" fill="#FFFFFF" />
      </g>
    )
  }
  if (shape === 'big') {
    return (
      <g>
        <ellipse cx="-15" cy="-2" rx="4.2" ry="5" fill="#1F1812" />
        <ellipse cx="15" cy="-2" rx="4.2" ry="5" fill="#1F1812" />
        <circle cx="-13" cy="-4" r="1.4" fill="#FFFFFF" />
        <circle cx="17" cy="-4" r="1.4" fill="#FFFFFF" />
      </g>
    )
  }
  if (shape === 'narrow') {
    return (
      <g>
        <ellipse cx="-15" cy="-4" rx="4" ry="1.4" fill="#1F1812" />
        <ellipse cx="15" cy="-4" rx="4" ry="1.4" fill="#1F1812" />
      </g>
    )
  }
  // wide — white sclera + dark iris + highlight (anime-bright)
  return (
    <g>
      <ellipse cx="-15" cy="-2" rx="5.5" ry="6" fill="#FFFFFF" stroke="#1F1812" strokeWidth="0.6" />
      <ellipse cx="-15" cy="-1" rx="3" ry="3.4" fill="#1F1812" />
      <circle cx="-14" cy="-3" r="1.3" fill="#FFFFFF" />
      <ellipse cx="15" cy="-2" rx="5.5" ry="6" fill="#FFFFFF" stroke="#1F1812" strokeWidth="0.6" />
      <ellipse cx="15" cy="-1" rx="3" ry="3.4" fill="#1F1812" />
      <circle cx="16" cy="-3" r="1.3" fill="#FFFFFF" />
    </g>
  )
}

function Nose({ style, skin }: { style: NoseStyle; skin: SkinTone }) {
  const c = SKIN[skin].shadow
  if (style === 'button') return <ellipse cx="0" cy="10" rx="2.2" ry="1.6" fill={c} />
  if (style === 'broad') return <ellipse cx="0" cy="12" rx="3.2" ry="2" fill={c} />
  if (style === 'narrow') return <ellipse cx="0" cy="11" rx="1.6" ry="2.4" fill={c} />
  // hook — small bridge curve sweeping down
  return <path d="M -1,5 Q -3,12 0,13 Q 3,12 1,5" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
}

function Mouth({ style }: { style: MouthStyle }) {
  if (style === 'smile') {
    return <path d="M -8,22 Q 0,30 8,22" fill="none" stroke="#1F1812" strokeWidth="2.2" strokeLinecap="round" />
  }
  if (style === 'grin') {
    return <path d="M -8,22 Q 0,32 8,22 Q 0,28 -8,22 Z" fill="#9B3349" />
  }
  if (style === 'neutral') {
    return <line x1="-6" y1="24" x2="6" y2="24" stroke="#1F1812" strokeWidth="2.2" strokeLinecap="round" />
  }
  // smirk — slight asymmetric curl on the right
  return <path d="M -7,24 Q 0,24 4,22 Q 7,21 8,26" fill="none" stroke="#1F1812" strokeWidth="2.2" strokeLinecap="round" />
}

function FrecklesLayer({ density, skin }: { density: Freckles; skin: SkinTone }) {
  if (density === 'none') return null
  const c = SKIN[skin].shadow
  if (density === 'light') {
    return (
      <g fill={c}>
        <circle cx="-12" cy="8" r="0.9" />
        <circle cx="-7" cy="6" r="0.8" />
        <circle cx="7" cy="6" r="0.8" />
        <circle cx="12" cy="8" r="0.9" />
        <circle cx="-4" cy="11" r="0.7" />
        <circle cx="4" cy="11" r="0.7" />
      </g>
    )
  }
  // heavy
  return (
    <g fill={c}>
      <circle cx="-14" cy="6" r="0.9" />
      <circle cx="-10" cy="9" r="0.8" />
      <circle cx="-6" cy="6" r="0.7" />
      <circle cx="-12" cy="12" r="0.7" />
      <circle cx="-6" cy="14" r="0.7" />
      <circle cx="-3" cy="9" r="0.6" />
      <circle cx="3" cy="9" r="0.6" />
      <circle cx="6" cy="14" r="0.7" />
      <circle cx="12" cy="12" r="0.7" />
      <circle cx="6" cy="6" r="0.7" />
      <circle cx="10" cy="9" r="0.8" />
      <circle cx="14" cy="6" r="0.9" />
      <circle cx="0" cy="5" r="0.6" />
      <circle cx="0" cy="14" r="0.6" />
    </g>
  )
}

function CheekBlushLayer({ style }: { style: CheekBlush }) {
  if (style === 'none') return null
  const fill = style === 'pink' ? '#F4A89A' : '#E89B7A'
  return (
    <g opacity="0.5">
      <ellipse cx="-22" cy="10" rx="7" ry="3.5" fill={fill} />
      <ellipse cx="22" cy="10" rx="7" ry="3.5" fill={fill} />
    </g>
  )
}
