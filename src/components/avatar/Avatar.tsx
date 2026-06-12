// Avatar composer. Stacks SVG layers in fixed z-order:
//   background → body → neck → hair_back → ears → head → hair_front → brows
//   → blush/freckles → eyes → nose → facial_hair → mouth → eyewear → head item → pin
// Traits are authored here (identity); items come in from the DB catalog and
// are rendered with their svg_layer strings.

import type { ReactNode } from 'react'
import type { AvatarTraits, AvatarItem, EquippedItems, SkinTone, FaceShape, HairStyle, HairColor, EyeShape, EyeColor, EyeSpacing, EyeScale, EyeTilt, BrowStyle, BrowHeight, MouthStyle, MouthWidth, NoseStyle, Freckles, CheekBlush } from '@/lib/avatar/types'
import { withDefaults } from '@/lib/avatar/types'
import { SKIN, HAIR, EYE, DEFAULT_SHIRT, FACE_GEO } from '@/lib/avatar/palette'

// Knob steps → geometry. Middle step is always the identity so avatars saved
// before the knobs existed render pixel-identical through withDefaults.
const EYE_SPACING_DX: Record<EyeSpacing, number> = { close: -3, normal: 0, wide: 3 }
const EYE_SCALE_K: Record<EyeScale, number> = { small: 0.85, normal: 1, large: 1.2 }
const EYE_TILT_DEG: Record<EyeTilt, number> = { down: -8, level: 0, up: 8 }
const BROW_DY: Record<BrowHeight, number> = { low: 3, normal: 0, high: -4 }
const MOUTH_SX: Record<MouthWidth, number> = { narrow: 0.8, normal: 1, wide: 1.25 }

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

// Crops sized against the canonical layout. 'head' is a tight square framed on
// the head's visual center (x=0, y≈-6) so the face fills the chrome bubble and
// stays centered, with a touch of headroom (top at y=-61) so hats/helmets clear.
// It still clips wide wing flares past x=±55 — the intended tradeoff for a
// filled, centered bubble. 'medium' is wide enough at x=±68 to keep wing flares in frame and
// tall enough at y=-64 to +104 to show the shirt collar and the pin row.
const VIEWBOXES = {
  full:   { vb: '-72 -82 144 200', aspect: 200 / 144 },
  head:   { vb: '-55 -61 110 110', aspect: 1 },
  medium: { vb: '-68 -64 136 168', aspect: 168 / 136 },
} as const

export default function Avatar({ traits, equipped, items, size = 140, crop = 'full', className }: Props) {
  const t = withDefaults(traits)
  const itemBySlot = mapEquipped(equipped, items)
  const { vb, aspect } = VIEWBOXES[crop]
  // Features ride a per-face vertical shift AND horizontal scale so the
  // eye/brow/mouth/cheek cluster sits balanced on each silhouette and its
  // spread tracks the face width — instead of clinging to round-face
  // coordinates. See FACE_GEO for the shape-by-shape values.
  const { featureYShift: featureShift, featureXScale: featureScale, hairXScale: hairScale, hairYScale } = FACE_GEO[t.face]
  const featureParts: string[] = []
  if (featureShift !== 0) featureParts.push(`translate(0, ${featureShift})`)
  if (featureScale !== 1) featureParts.push(`scale(${featureScale}, 1)`)
  const featureTransform = featureParts.length ? featureParts.join(' ') : undefined
  // Hair (front + back) scales to the head width so the cap frames each
  // silhouette, the same way the feature cluster now tracks the face. The
  // vertical scale is anchored at the HAIRLINE (y=-6), not the origin, so
  // stretching the cap to clear a tall crown (heart) never moves the
  // hairline off the forehead: y' = -6·(1−k) + k·y keeps y=-6 fixed.
  const HAIRLINE_Y = -6
  const hairDy = Math.round(HAIRLINE_Y * (1 - hairYScale) * 1000) / 1000
  const hairParts: string[] = []
  if (hairDy !== 0) hairParts.push(`translate(0, ${hairDy})`)
  if (hairScale !== 1 || hairYScale !== 1) hairParts.push(`scale(${hairScale}, ${hairYScale})`)
  const hairTransform = hairParts.length ? hairParts.join(' ') : undefined
  // Facial hair anchors to the CHIN, not the eye cluster. It renders inside
  // the feature group (to keep z-order between nose and mouth), so this
  // nested correction first undoes the feature shift/scale, then applies the
  // chin delta vs the round face (beards are authored against round, chin
  // y=48) and the jaw-width scale. Round face = identity, so existing
  // catalogs are unchanged there.
  const geo = FACE_GEO[t.face]
  const beardDy = (geo.bottomY - 48) - geo.featureYShift
  const beardSx = geo.beardXScale / geo.featureXScale
  const beardParts: string[] = []
  if (beardDy !== 0) beardParts.push(`translate(0, ${beardDy})`)
  if (beardSx !== 1) beardParts.push(`scale(${Math.round(beardSx * 1000) / 1000}, 1)`)
  const beardTransform = beardParts.length ? beardParts.join(' ') : undefined
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
      <Neck skin={t.skin} face={t.face} />
      <g transform={hairTransform}><HairBack style={t.hair_style} color={t.hair_color} /></g>
      <Ears skin={t.skin} face={t.face} />
      <Head skin={t.skin} face={t.face} />
      <g transform={hairTransform}><HairFront style={t.hair_style} color={t.hair_color} /></g>
      {/* Face features + face-anchored items — translated together by
          featureShift so they track the chin/forehead of the chosen face
          shape. Eyewear sits on the eyes and facial hair sits on the chin,
          so both need to shift with the features. Head items (helmets,
          hats) and pins (chest) are anchored to the silhouette, not the
          features, so they live outside this group. */}
      <g transform={featureTransform}>
        <g transform={BROW_DY[t.brow_height] !== 0 ? `translate(0, ${BROW_DY[t.brow_height]})` : undefined}>
          <Brows style={t.brows} hairColor={t.hair_color} />
        </g>
        <CheekBlushLayer style={t.cheek_blush} />
        <FrecklesLayer density={t.freckles} skin={t.skin} />
        <Eyes shape={t.eyes} color={t.eye_color} spacing={t.eye_spacing} scale={t.eye_scale} tilt={t.eye_tilt} />
        <Nose style={t.nose} skin={t.skin} />
        {itemBySlot.facial_hair && (
          <g transform={beardTransform}>
            <RawLayer svg={itemBySlot.facial_hair.svg_layer} />
          </g>
        )}
        <g transform={MOUTH_SX[t.mouth_width] !== 1 ? `scale(${MOUTH_SX[t.mouth_width]}, 1)` : undefined}>
          <Mouth style={t.mouth} />
        </g>
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

function Neck({ skin, face }: { skin: SkinTone; face: FaceShape }) {
  // Anchor the neck to THIS face's chin so the head always overlaps the top of
  // the neck — no seam/gap. We start 6px above the silhouette's bottom (the
  // head, drawn on top, covers that overlap) and run down to the collar (y=68).
  const top = FACE_GEO[face].bottomY - 6
  return <rect x="-8" y={top} width="16" height={68 - top} fill={SKIN[skin].color} />
}

function Head({ skin, face }: { skin: SkinTone; face: FaceShape }) {
  const c = SKIN[skin].color
  if (face === 'round') return <ellipse cx="0" cy="0" rx="46" ry="48" fill={c} />
  if (face === 'egg') return <ellipse cx="0" cy="2" rx="42" ry="50" fill={c} />
  // square — wide cheeks + a defined jaw (its identity), but the CROWN is
  // narrowed/rounded (top corners pulled to ±40 then bulged out to the ±48
  // cheek at y=10) so it tucks under the hairline instead of poking its top
  // corners through. Ears still anchor to the widest point (±48 at y=2).
  if (face === 'square') return <path d="M -40,-26 Q -42,-46 -24,-46 L 24,-46 Q 42,-46 40,-26 Q 48,-8 48,10 L 48,28 Q 48,46 26,46 L -26,46 Q -48,46 -48,28 L -48,10 Q -48,-8 -40,-26 Z" fill={c} />
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
  if (style === 'afro') {
    // The afro's bulk is a big rounded mass BEHIND the head. The head (drawn on
    // top) covers the centre, so this shows as an even halo that hugs the head
    // outline with no gaps — on any face shape. Perimeter circles texture the
    // edge. The front hairline is the cap in HairFront.
    return (
      <g>
        <circle cx="0" cy="-14" r="55" fill={c} />
        <circle cx="-46" cy="-46" r="13" fill={c} />
        <circle cx="46" cy="-46" r="13" fill={c} />
        <circle cx="-56" cy="-14" r="13" fill={c} />
        <circle cx="56" cy="-14" r="13" fill={c} />
        <circle cx="-48" cy="18" r="12" fill={c} />
        <circle cx="48" cy="18" r="12" fill={c} />
        <circle cx="-22" cy="-62" r="12" fill={c} />
        <circle cx="22" cy="-62" r="12" fill={c} />
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
    // Front hairline cap over the forehead/crown (hairline at ~-34 so the
    // forehead shows). The afro's volume is the rounded halo in HairBack, which
    // hugs the head outline; this cap just sets the front hairline + a little
    // top texture so the two read as one mass.
    return (
      <g>
        <path d="M -44,-14 Q -50,-58 0,-60 Q 50,-58 44,-14 Q 34,-32 0,-34 Q -34,-32 -44,-14 Z" fill={c} />
        <circle cx="-36" cy="-48" r="11" fill={c} />
        <circle cx="36" cy="-48" r="11" fill={c} />
        <circle cx="-16" cy="-58" r="11" fill={c} />
        <circle cx="16" cy="-58" r="11" fill={c} />
        <circle cx="0" cy="-60" r="10" fill={c} />
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

// Each eye shape is authored ONCE, centered on its own origin, then composed
// twice by <Eyes> with per-side translate/rotate/scale. That's what makes
// spacing, size, and tilt independent knobs (Mii-style) instead of baked-in
// coordinates. `cy` is the shape's resting height on the face — small/narrow
// sit at -4, big/wide at -2, exactly where the old hardcoded versions sat.
function singleEye(shape: EyeShape, color: EyeColor): { node: ReactNode; cy: number } {
  const c = EYE[color]
  if (shape === 'small') {
    return {
      cy: -4,
      node: (
        <>
          <ellipse cx="0" cy="0" rx="3" ry="3.6" fill={c} />
          {/* catch-light — same offset on both eyes (light from upper-left) */}
          <circle cx="1.3" cy="-1.4" r="0.9" fill="#FFFFFF" />
        </>
      ),
    }
  }
  if (shape === 'big') {
    return {
      cy: -2,
      node: (
        <>
          <ellipse cx="0" cy="0" rx="4.2" ry="5" fill={c} />
          <circle cx="2" cy="-2" r="1.4" fill="#FFFFFF" />
        </>
      ),
    }
  }
  if (shape === 'narrow') {
    return { cy: -4, node: <ellipse cx="0" cy="0" rx="4" ry="1.4" fill={c} /> }
  }
  // wide — white sclera + tinted iris + highlight (anime-bright). Only the
  // iris takes the eye colour; the outline stays the legacy near-black.
  return {
    cy: -2,
    node: (
      <>
        <ellipse cx="0" cy="0" rx="5.5" ry="6" fill="#FFFFFF" stroke="#1F1812" strokeWidth="0.6" />
        <ellipse cx="0" cy="1" rx="3" ry="3.4" fill={c} />
        <circle cx="1" cy="-1" r="1.3" fill="#FFFFFF" />
      </>
    ),
  }
}

function Eyes({ shape, color, spacing, scale, tilt }: { shape: EyeShape; color: EyeColor; spacing: EyeSpacing; scale: EyeScale; tilt: EyeTilt }) {
  const x = 15 + EYE_SPACING_DX[spacing]
  const k = EYE_SCALE_K[scale]
  const deg = EYE_TILT_DEG[tilt]
  const { node, cy } = singleEye(shape, color)
  // Tilt rotates each eye around its own center, mirrored so 'up' raises the
  // OUTER corners on both sides (left eye rotates +deg, right eye -deg).
  const tf = (side: -1 | 1) => {
    const parts = [`translate(${side * x}, ${cy})`]
    if (deg !== 0) parts.push(`rotate(${side === -1 ? deg : -deg})`)
    if (k !== 1) parts.push(`scale(${k})`)
    return parts.join(' ')
  }
  return (
    <g>
      <g transform={tf(-1)}>{node}</g>
      <g transform={tf(1)}>{node}</g>
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
