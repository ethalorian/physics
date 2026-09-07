// Avatar composer. Stacks SVG layers in fixed z-order:
//   background → body → neck → hair_back → ears → head → hair_front → brows
//   → blush/freckles → eyes → nose → facial_hair → mouth → eyewear → head item → pin
// Traits are authored here (identity); items come in from the DB catalog and
// are rendered with their svg_layer strings.

import React, { useId, type ReactNode } from 'react'
import { safeSvgLayer } from '@/lib/avatar/svg'
import type { AvatarTraits, AvatarItem, EquippedItems, SkinTone, FaceShape, HairStyle, HairColor, EyeShape, EyeColor, EyeSpacing, EyeScale, EyeTilt, BrowStyle, BrowHeight, MouthStyle, MouthWidth, NoseStyle, Freckles, CheekBlush } from '@/lib/avatar/types'
import { withDefaults } from '@/lib/avatar/types'
import { SKIN, HAIR, EYE, SHIRT, FACE_GEO } from '@/lib/avatar/palette'

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
  decorative?: boolean
}

// Full/medium portraits include the raised shoulders and the largest transformed
// hair silhouette. Compact crops expand for voluminous hair so the menu circle
// preserves the hairstyle rather than chopping its crown into a flat block.
const VIEWBOXES = {
  full:   { vb: '-80 -102 160 220', aspect: 220 / 160 },
  head:   { vb: '-65 -70 130 130', aspect: 1 },
  medium: { vb: '-80 -102 160 220', aspect: 220 / 160 },
} as const

export default function Avatar({ traits, equipped, items, size = 140, crop = 'full', className, decorative = false }: Props) {
  const t = withDefaults(traits)
  const itemBySlot = mapEquipped(equipped, items)
  const clipId = useId().replace(/:/g, '')
  const headOptions = itemBySlot.head?.render_options
  const hairMode = headOptions?.hair ?? 'preserve'
  const hairStyle = hairMode === 'tuck' ? 'short' : t.hair_style
  const largeHair = hairMode === 'preserve' && ['afro', 'spiky', 'twists', 'bun', 'high_pony'].includes(hairStyle)
  const { aspect } = VIEWBOXES[crop]
  const vb = crop === 'head' && (largeHair || itemBySlot.head?.slug === 'viking-helmet' || (headOptions?.fit_head && t.face === 'heart')) ? '-88 -106 176 176' : VIEWBOXES[crop].vb
  const ink = t.skin === 'dark' || t.skin === 'deep' ? '#B98463' : '#1F1812'
  const beardColor = HAIR[t.facial_hair_color === 'match' ? t.hair_color : t.facial_hair_color].main
  const compact = crop === 'head' && size <= 70
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
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : "Student avatar"}
    >
      <defs><clipPath id={clipId}><path d="M -39,-10 Q -43,-47 0,-49 Q 43,-47 39,-10 L 37,14 L -37,14 Z" /></clipPath></defs>
      {itemBySlot.background && <RawLayer svg={itemBySlot.background.svg_layer} />}
      {itemBySlot.body ? <RawLayer svg={itemBySlot.body.svg_layer} /> : <Body color={SHIRT[t.shirt_color]} style={t.shirt_style} />}
      {!headOptions?.covers_neck && <Neck skin={t.skin} face={t.face} />}
      {hairMode === 'preserve' && <g transform={hairTransform}><HairBack style={hairStyle} color={t.hair_color} /></g>}
      {!headOptions?.covers_ears && <Ears skin={t.skin} face={t.face} />}
      <Head skin={t.skin} face={t.face} />
      {hairMode !== 'hide' && <g clipPath={hairMode === 'tuck' ? `url(#${clipId})` : undefined}><g transform={hairMode === 'tuck' ? undefined : hairTransform}><HairFront style={hairStyle} color={t.hair_color} fabric={SHIRT[t.fabric_color]} /></g></g>}
      {/* Face features + face-anchored items — translated together by
          featureShift so they track the chin/forehead of the chosen face
          shape. Eyewear sits on the eyes and facial hair sits on the chin,
          so both need to shift with the features. Head items (helmets,
          hats) and pins (chest) are anchored to the silhouette, not the
          features, so they live outside this group. */}
      <g transform={featureTransform}>
        <g transform={BROW_DY[t.brow_height] !== 0 ? `translate(0, ${BROW_DY[t.brow_height]})` : undefined}>
          <Brows style={t.brows} hairColor={t.hair_color} ink={ink} />
        </g>
        <CheekBlushLayer style={t.cheek_blush} />
        {!compact && <FrecklesLayer density={t.freckles} skin={t.skin} />}
        <Eyes shape={t.eyes} color={t.eye_color} spacing={t.eye_spacing} scale={t.eye_scale} tilt={t.eye_tilt} ink={ink} />
        <Nose style={t.nose} skin={t.skin} />
        {itemBySlot.facial_hair && (
          <g transform={beardTransform}>
            <RawLayer svg={itemBySlot.facial_hair.svg_layer.replaceAll('#3A2618', beardColor)} />
          </g>
        )}
        <g transform={MOUTH_SX[t.mouth_width] !== 1 ? `scale(${MOUTH_SX[t.mouth_width]}, 1)` : undefined}>
          <Mouth style={t.mouth} ink={ink} />
        </g>
        {itemBySlot.eyewear && <g transform={itemBySlot.eyewear.render_options?.fit_eyes ? `scale(${(15 + EYE_SPACING_DX[t.eye_spacing]) / 15}, 1)` : undefined}><RawLayer svg={itemBySlot.eyewear.svg_layer} /></g>}
      </g>
      {itemBySlot.head && <g transform={headOptions?.fit_head ? hairTransform : undefined}><RawLayer svg={itemBySlot.head.svg_layer} /></g>}
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
    if (item && item.slot === slot) out[slot as keyof EquippedItems] = item
  }
  return out
}

// Defense in depth: only the inert avatar SVG dialect reaches the DOM.
function RawLayer({ svg }: { svg: string }) {
  return <g dangerouslySetInnerHTML={{ __html: safeSvgLayer(svg) }} />
}

// ---------------------------------------------------------------------------
// Trait layers (identity)
// ---------------------------------------------------------------------------

// Default shirt — colour is the `shirt_color` trait ("favourite colour").
// Replaced wholesale by a body-slot item when one is equipped.
function Body({ color, style }: { color: string; style: AvatarTraits['shirt_style'] }) {
  const outline = '#514C65'
  return <g>
    <path d="M -9,59 Q -20,61 -34,68 Q -43,73 -42,89 L -34,93 L -33,113 L 33,113 L 34,93 L 42,89 Q 43,73 34,68 Q 20,61 9,59 Q 0,71 -9,59 Z" fill={color} stroke={outline} strokeWidth="1.3" />
    <path d="M -9,60 Q 0,72 9,60" fill="none" stroke={outline} strokeWidth="2" />
    {style === 'polo' && <><path d="M -9,60 L -15,70 L -3,74 L 0,65 L 3,74 L 15,70 L 9,60" fill="#F2EDDE" /><path d="M 0,67 L 0,88" stroke={outline} strokeWidth="2" /><circle cy="78" r="1.3" fill="#F2EDDE" /></>}
    {style === 'hoodie' && <><path d="M -10,59 Q -28,53 -23,73 L -11,80 L 0,68 L 11,80 L 23,73 Q 28,53 10,59" fill={color} stroke={outline} strokeWidth="1.5" /><path d="M -9,75 L -9,92 M 9,75 L 9,92" stroke="#F2EDDE" strokeWidth="2" /><path d="M -16,96 L -20,107 L 20,107 L 16,96 Z" fill="none" stroke={outline} strokeWidth="1.5" /></>}
    {style === 'striped' && <path d="M -32,84 L 32,84 M -32,97 L 32,97 M -31,110 L 31,110" stroke="#F2EDDE" strokeWidth="5" />}
    {style === 'varsity' && <><path d="M -33,69 Q -42,73 -42,89 L -34,93 L -27,75 M 33,69 Q 42,73 42,89 L 34,93 L 27,75" fill="#F2EDDE" /><path d="M 0,69 L 0,113" stroke="#F2EDDE" strokeWidth="2" /><text x="13" y="87" fontSize="13" fontWeight="bold" fill="#F2EDDE">P</text></>}
  </g>
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
    return <g>
      <path d="M -46,28 Q -62,26 -59,12 Q -73,2 -64,-13 Q -73,-31 -57,-39 Q -62,-58 -43,-59 Q -39,-77 -21,-70 Q -6,-83 8,-72 Q 26,-80 37,-66 Q 58,-71 59,-51 Q 73,-42 63,-25 Q 76,-10 62,3 Q 66,22 49,27 Q 37,42 22,34 L -20,34 Q -33,43 -46,28 Z" fill={c} />
      <path d="M -52,-37 Q -57,-48 -45,-52 M 30,-64 Q 40,-69 45,-58 M -53,13 Q -57,21 -46,25" fill="none" stroke={HAIR[color].dark} strokeWidth="2" strokeLinecap="round" />
    </g>
  }
  if (style === 'high_pony') {
    // Tail sweeps from the crown knot, out past the right ear, to the shoulder.
    return <path d="M 12,-56 Q 52,-50 54,0 Q 56,26 42,40 Q 40,18 40,-4 Q 36,-40 8,-48 Z" fill={c} />
  }
  if (style === 'bangs') {
    // Same shoulder-length curtains as 'long'; the fringe is in HairFront.
    return (
      <g>
        <path d="M -44,-10 Q -50,12 -46,40 L -32,46 Q -34,18 -32,-4 Z" fill={c} />
        <path d="M 44,-10 Q 50,12 46,40 L 32,46 Q 34,18 32,-4 Z" fill={c} />
      </g>
    )
  }
  if (style === 'wavy') {
    // Curtains with a scalloped outer edge — wider and bumpier than 'long'
    // so the two read differently even as a 40px bubble.
    return (
      <g>
        <path d="M -44,-12 Q -58,6 -48,22 Q -60,38 -48,54 Q -40,58 -30,52 Q -36,30 -32,-4 Z" fill={c} />
        <path d="M 44,-12 Q 58,6 48,22 Q 60,38 48,54 Q 40,58 30,52 Q 36,30 32,-4 Z" fill={c} />
      </g>
    )
  }
  if (style === 'bob') {
    // Volume panels behind the head, cut flat at the jaw (y=26). The strips
    // that cover the ears live in HairFront.
    return (
      <g>
        <path d="M -30,-12 Q -52,-14 -50,26 L -30,26 Z" fill={c} />
        <path d="M 30,-12 Q 52,-14 50,26 L 30,26 Z" fill={c} />
      </g>
    )
  }
  return null
}

function HairFront({ style, color, fabric }: { style: HairStyle; color: HairColor; fabric: string }) {
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
    return <path d="M -44,-14 Q -54,-38 -36,-53 Q -21,-68 0,-61 Q 22,-69 38,-50 Q 52,-38 44,-14 Q 34,-31 21,-32 Q 9,-37 0,-32 Q -10,-37 -22,-32 Q -35,-33 -44,-14 Z" fill={c} />
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
    return <g>
      <path d="M -42,-12 Q -48,-54 0,-58 Q 48,-54 42,-12 Q 34,-22 0,-26 Q -34,-22 -42,-12 Z" fill={c} />
      {[-30,-15,0,15,30].map(x => <path key={x} d={`M ${x * .7},-51 Q ${x},-39 ${x * 1.15},-22`} fill="none" stroke={d} strokeWidth="2.3" strokeLinecap="round" />)}
      {[-1,1].map(side => <g key={side} transform={`translate(${side * 45},0)`}>
        <path d="M -3,-17 L 3,-17 L 4,26 L -4,26 Z" fill={c} />
        {[-11,-3,5,13,21].map(y => <g key={y}><ellipse cx="0" cy={y} rx="5.5" ry="5" fill={c} /><path d={`M -3,${y-2} L 3,${y+2}`} stroke={d} strokeWidth="1.4" /></g>)}
        <rect x="-4" y="25" width="8" height="4" rx="2" fill="#D8A547" />
      </g>)}
    </g>
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
      <g><path
        fillRule="evenodd"
        fill={fabric}
        d="M -50,-2 Q -52,-58 0,-62 Q 52,-58 50,-2 Q 48,28 28,40 L 24,72 L -24,72 L -28,40 Q -48,28 -50,-2 Z M -40,2 Q -44,-46 0,-48 Q 44,-46 40,2 Q 34,30 0,38 Q -34,30 -40,2 Z"
      /><path d="M -27,29 Q -14,47 17,59 M 24,40 L 12,66" fill="none" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="2" /></g>
    )
  }
  if (style === 'buzz') {
    // Tight to the skull — no volume past the head outline, low hairline.
    // Silhouette matches bald on purpose; the coloured crown is the tell.
    return <path d="M -45,-12 Q -48,-49 0,-50 Q 48,-49 45,-12 Q 34,-26 0,-28 Q -34,-26 -45,-12 Z" fill={c} />
  }
  if (style === 'fade') {
    // Skin fade: translucent temples under a fuller, slightly boxy top.
    return (
      <g>
        <path d="M -41,-12 Q -42,-2 -39,8 L -34,7 Q -36,-2 -35,-14 Z" fill={c} opacity="0.45" />
        <path d="M 41,-12 Q 42,-2 39,8 L 34,7 Q 36,-2 35,-14 Z" fill={c} opacity="0.45" />
        <path d="M -40,-14 Q -44,-56 0,-58 Q 44,-56 40,-14 Q 32,-28 0,-30 Q -32,-28 -40,-14 Z" fill={c} />
      </g>
    )
  }
  if (style === 'spiky') {
    return (
      <g>
        <path d="M -44,-12 Q -48,-50 0,-52 Q 48,-50 44,-12 Q 36,-26 0,-30 Q -36,-26 -44,-12 Z" fill={c} />
        <polygon points="-40,-30 -34,-66 -22,-40" fill={c} />
        <polygon points="-24,-40 -16,-74 -6,-46" fill={c} />
        <polygon points="-8,-46 2,-78 12,-46" fill={c} />
        <polygon points="10,-44 22,-72 30,-40" fill={c} />
        <polygon points="26,-36 38,-64 42,-28" fill={c} />
      </g>
    )
  }
  if (style === 'side_part') {
    // Fringe swept from a right-side part down toward the left temple.
    return (
      <g>
        <path d="M -44,-10 Q -50,-56 0,-58 Q 50,-56 44,-14 Q 40,-32 22,-36 Q -2,-38 -22,-26 Q -34,-16 -44,-10 Z" fill={c} />
        <path d="M 20,-38 Q 24,-48 22,-56" fill="none" stroke={d} strokeWidth="1" strokeLinecap="round" />
      </g>
    )
  }
  if (style === 'mohawk') {
    // Shaved sides, one crest. Kept under y=-60 so it survives the 'head'
    // (top -61) and 'medium' (top -64) crops instead of clipping to a block.
    return (
      <g>
        <path d="M -11,-24 Q -12,-44 -8,-52 L 8,-52 Q 12,-44 11,-24 Q 0,-28 -11,-24 Z" fill={c} />
        <polygon points="-11,-44 -20,-60 -2,-50" fill={c} />
        <polygon points="-6,-48 0,-64 6,-48" fill={c} />
        <polygon points="2,-50 20,-60 11,-44" fill={c} />
        <polygon points="-14,-34 -26,-44 -8,-38" fill={c} />
        <polygon points="8,-38 26,-44 14,-34" fill={c} />
      </g>
    )
  }
  if (style === 'twists') {
    return <g>
      <path d="M -44,-14 Q -50,-56 0,-58 Q 50,-56 44,-14 Q 34,-30 0,-32 Q -34,-30 -44,-14 Z" fill={c} />
      {[-36,-24,-12,0,12,24,36].map((x, i) => <g key={x} transform={`translate(${x}, ${-45 - (3 - Math.abs(i - 3)) * 4}) rotate(${x * .65})`}>
        <path d="M -5,10 Q -8,-1 -3,-14 Q 1,-20 5,-14 Q 9,-7 3,0 L 4,10 Z" fill={c} />
        <path d="M -2,-12 Q 4,-7 -1,-3 Q -5,1 1,5" fill="none" stroke={d} strokeWidth="1.4" strokeLinecap="round" />
      </g>)}
    </g>
  }
  if (style === 'high_pony') {
    return (
      <g>
        <path d="M -44,-12 Q -48,-54 0,-58 Q 48,-54 44,-12 Q 36,-26 0,-30 Q -36,-26 -44,-12 Z" fill={c} />
        {/* knot + band on top; the tail itself hangs in HairBack */}
        <circle cx="12" cy="-56" r="9" fill={c} />
        <rect x="6" y="-52" width="12" height="4" rx="2" transform="rotate(-20 12 -50)" fill={d} />
      </g>
    )
  }
  if (style === 'bob') {
    // Cap + ear-covering strips; the jaw-level volume is in HairBack.
    return (
      <g>
        <path d="M -44,-12 Q -48,-54 0,-58 Q 48,-54 44,-12 Q 36,-26 0,-30 Q -36,-26 -44,-12 Z" fill={c} />
        <path d="M -44,-14 Q -52,0 -50,26 L -42,26 Q -44,6 -40,-8 Z" fill={c} />
        <path d="M 44,-14 Q 52,0 50,26 L 42,26 Q 44,6 40,-8 Z" fill={c} />
      </g>
    )
  }
  if (style === 'bangs') {
    // Straight fringe cut just above the brows (brow top is y=-19).
    return (
      <path d="M -44,-10 Q -48,-54 0,-58 Q 48,-54 44,-10 L 38,-22 L 24,-23 L 12,-22 L 0,-23 L -12,-22 L -24,-23 L -38,-22 Z" fill={c} />
    )
  }
  if (style === 'wavy') {
    // Centre-parted cap; the wavy curtains are in HairBack.
    return (
      <path d="M -42,-6 Q -50,-58 0,-58 Q 50,-58 42,-6 Q 38,-24 20,-28 Q 8,-30 0,-24 Q -8,-30 -20,-28 Q -38,-24 -42,-6 Z" fill={c} />
    )
  }
  if (style === 'twin_braids') {
    // Centre-parted cap with a plait hanging in front of each shoulder.
    const rows = [-2, 8, 18, 28, 38, 48]
    return (
      <g>
        <path d="M -44,-12 Q -48,-54 0,-58 Q 48,-54 44,-12 Q 36,-26 0,-30 Q -36,-26 -44,-12 Z" fill={c} />
        <path d="M 0,-56 L 0,-31" stroke={d} strokeWidth="1" strokeLinecap="round" />
        {([-1, 1] as const).map((side) => (
          <g key={side} transform={`translate(${side * 49}, 0)`}>
            <circle cx={-side * 3} cy="-16" r="6" fill={c} />
            <rect x="-4" y="-16" width="8" height="72" rx="4" fill={c} />
            {rows.map((y) => <ellipse key={y} cx="0" cy={y} rx="5" ry="3.4" fill={c} />)}
            {rows.map((y) => <path key={`l${y}`} d={`M -3.5,${y + 4} Q 0,${y + 7} 3.5,${y + 4}`} fill="none" stroke={d} strokeWidth="0.9" />)}
            <rect x="-4.5" y="54" width="9" height="3" rx="1.5" fill={d} />
            <path d="M -3,57 L -4,64 M 0,57 L 0,65 M 3,57 L 4,64" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" />
          </g>
        ))}
      </g>
    )
  }
  // long — top cap. Side curtains live in HairBack so the ears poke through.
  return (
    <path d="M -44,-12 Q -48,-54 0,-58 Q 48,-54 44,-12 Q 36,-26 0,-30 Q -36,-26 -44,-12 Z" fill={c} />
  )
}

function Brows({ style, hairColor, ink }: { style: BrowStyle; hairColor: HairColor; ink: string }) {
  const c = ink === '#1F1812' ? HAIR[hairColor].dark : ink
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
function singleEye(shape: EyeShape, color: EyeColor, ink: string): { node: ReactNode; cy: number } {
  const c = color === 'black' && ink !== '#1F1812' ? ink : EYE[color]
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

function Eyes({ shape, color, spacing, scale, tilt, ink }: { shape: EyeShape; color: EyeColor; spacing: EyeSpacing; scale: EyeScale; tilt: EyeTilt; ink: string }) {
  const x = 15 + EYE_SPACING_DX[spacing]
  const k = EYE_SCALE_K[scale]
  const deg = EYE_TILT_DEG[tilt]
  const { node, cy } = singleEye(shape, color, ink)
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

function Mouth({ style, ink }: { style: MouthStyle; ink: string }) {
  if (style === 'joy') return <g><path d="M -9,21 Q 0,40 9,21 Z" fill="#682C3C" stroke={ink} strokeWidth="1" /><path d="M -6,23 L 6,23" stroke="#FFFFFF" strokeWidth="3" /></g>
  if (style === 'open') return <ellipse cx="0" cy="25" rx="4" ry="5" fill="#682C3C" stroke={ink} strokeWidth="1.5" />
  if (style === 'smile') {
    return <path d="M -8,22 Q 0,30 8,22" fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
  }
  if (style === 'grin') {
    return <path d="M -8,22 Q 0,32 8,22 Q 0,28 -8,22 Z" fill="#9B3349" />
  }
  if (style === 'neutral') {
    return <line x1="-6" y1="24" x2="6" y2="24" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
  }
  // smirk — slight asymmetric curl on the right
  return <path d="M -7,24 Q 0,24 4,22 Q 7,21 8,26" fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
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
