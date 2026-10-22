import React, { useId } from 'react'
import { withDefaults, type AvatarTraits, type AvatarItem, type EquippedItems } from '@/lib/avatar/types'
import { SKIN, HAIR, SHIRT } from '@/lib/avatar/palette'
import { Tint, Sprite, Item, LegacyItem, Backdrop } from './MangaParts'
import MangaProfile from './MangaProfile'
import MangaBaseBody from './MangaBaseBody'
import { PaintedEye, PaintedNose, PaintedMouth } from './MangaExpression'
import { NeckOpeningMask, NeckTexture } from './MangaNeck'
import { BASE_NECKLINES, OUTFIT_NECKLINES, necklinePath } from '@/lib/avatar/neckline-fit'
import { MANGA_COLLECTION, HAIR_RECTS, HEAD_RECTS, PIN_RECTS, FRONT_BASE_LEGS_RECT, FRONT_BASE_SHIRT_RECTS, equippedMangaItems, mangaItemSprite, mangaOutfitRect } from '@/lib/avatar/manga-collection'
import { BASE_CUFFS, BASE_EXPOSED_ARMS, OUTFIT_CUFFS, PAINTED_HANDS, hasLongSleeves, headFit, HELD_PROPS, PROP_GRIPS } from '@/lib/avatar/anatomy-fit'

export interface AvatarProps {
  traits: Partial<AvatarTraits> | null | undefined
  equipped?: EquippedItems
  items?: AvatarItem[]
  size?: number
  crop?: 'full' | 'head' | 'portrait' | 'medium' | 'figure'
  className?: string
  decorative?: boolean
  comic?: boolean
  pose?: 'standing' | 'side' | 'walking' | 'running' | 'thinking'
}

/** One reusable painted collection, composed from saved traits without image generation. */
export default function MangaAvatar({ traits, equipped, items, size = 140, crop = 'full', className, decorative = false, pose = 'standing' }: AvatarProps) {
  const t = withDefaults(traits)
  const worn = equippedMangaItems(equipped, items)
  const id = `manga-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const hairMode = worn.head?.render_options?.hair ?? 'preserve'
  const hairStyle = hairMode === 'tuck' ? 'buzz' : t.hair_style
  const headOptions = worn.head?.render_options
  const headSprite = worn.head && mangaItemSprite(worn.head)
  const earsSprite = worn.ears && mangaItemSprite(worn.ears)
  const maskFace = (headSprite?.atlas === 'headwear-3' && worn.head?.slug !== 'spooky-cat-hood') || worn.head?.slug === 'spooky-skull-mask'
  const bodySprite = worn.body && mangaItemSprite(worn.body)
  const longSleeves = hasLongSleeves(t.shirt_style, worn.body?.slug)
  const compatibilityColor = worn.body && !bodySprite ? worn.body.svg_layer.match(/fill="(#[\da-fA-F]{6})"/)?.[1] : undefined
  const fullBody = crop === 'figure'
  const baseShirt = worn.body?.slug.startsWith('fhs-') ? 'tee' : t.shirt_style
  const neckline = bodySprite && worn.body ? OUTFIT_NECKLINES[worn.body.slug] : !worn.body ? BASE_NECKLINES[baseShirt] : undefined
  const head = headFit(neckline)
  const cuffs = bodySprite && worn.body ? OUTFIT_CUFFS[worn.body.slug] : BASE_CUFFS[baseShirt]
  const exposedArms = !worn.body ? BASE_EXPOSED_ARMS[baseShirt] : undefined
  const heldProp = worn.pin && HELD_PROPS.has(worn.pin.slug) ? worn.pin : undefined
  const gripX = (cuffs?.[2] ?? 292) - 5, gripY = (cuffs?.[3] ?? 414) + 28

  const portrait = crop === 'portrait'
  const squareCrop = portrait || crop === 'head'
  // Shared circular framing: the home portrait's face zoom and vertical alignment.
  const viewBox = fullBody ? '0 0 400 800' : portrait ? '118.5 58 163 163' : squareCrop ? '90 10 220 220' : '65 0 270 371.25'
  const skin = SKIN[t.skin].color
  const hair = HAIR[t.hair_color].main
  const beard = HAIR[t.facial_hair_color === 'match' ? t.hair_color : t.facial_hair_color].main
  const outfit = bodySprite
    ? <Sprite sprite={bodySprite} rect={mangaOutfitRect(bodySprite)} label={worn.body!.slug} />
    : !worn.body ? <MangaBaseBody shirt={baseShirt} skinFilter={`${id}-skin`} shirtFilter={`${id}-shirt`} /> : <><Sprite name="legs" rect={FRONT_BASE_LEGS_RECT} /><Sprite name={baseShirt} rect={FRONT_BASE_SHIRT_RECTS[baseShirt]} filter={`${id}-shirt`} /></>
  const skinArms = <g filter={`url(#${id}-skin)`} data-manga-part="arms">
    <Sprite name="left-arm" rect={[10, 215, 200, 270]} />
    <Sprite name="right-arm" rect={[190, 215, 200, 270]} />
  </g>
  const hands = cuffs && <g filter={`url(#${id}-skin)`} data-manga-part="fitted-hands">
    {[0,1].map(side => <g key={side} transform={`translate(${cuffs[side*2]} ${cuffs[side*2+1]}) scale(.88 .88) translate(${-([108,292][side])} -414)`}>
      <g clipPath={`url(#${id}-hands)`}><Sprite name={side === 0 ? 'left-arm' : 'right-arm'} rect={side === 0 ? [10,215,200,270] : [190,215,200,270]} /></g>
    </g>)}
  </g>
  if (fullBody && (pose === 'side' || pose === 'walking' || pose === 'running')) return <MangaProfile traits={t} worn={worn} size={size} className={className} decorative={decorative} pose={pose} />
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={Math.round(size * (fullBody ? 2 : squareCrop ? 1 : 1.375))} viewBox={viewBox} className={['avatar-size-native',className].filter(Boolean).join(' ')} style={portrait ? { display: 'block', borderRadius: '50%', overflow: 'hidden' } : undefined} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : 'Student avatar'} aria-hidden={decorative || undefined} data-avatar-collection={MANGA_COLLECTION} data-avatar-pose={pose} data-avatar-crop={crop}>
    <defs>
      <Tint id={`${id}-skin`} color={skin} /><Tint id={`${id}-hair`} color={hair} /><Tint id={`${id}-shirt`} color={compatibilityColor ?? SHIRT[t.shirt_color]} /><Tint id={`${id}-fabric`} color={SHIRT[t.fabric_color]} /><Tint id={`${id}-beard`} color={beard} />
      <clipPath id={`${id}-tuck`}><rect x="141" y="35" width="118" height="74" rx="35" /></clipPath>
      <clipPath id={`${id}-face`}><rect x={headOptions?.covers_ears ? 151 : 100} y={maskFace ? 103 : 36} width={headOptions?.covers_ears ? 98 : 200} height={maskFace ? 80 : 141} /></clipPath>
      <clipPath id={`${id}-neck`}><rect x="173" y="170" width="54" height={Math.max(60, (neckline?.[3] ?? 218) - 168)} />{neckline && <path d={necklinePath(neckline)} />}</clipPath>
      <NeckOpeningMask fit={neckline} id={`${id}-neck-opening`} />
      {exposedArms && <clipPath id={`${id}-sleeve-openings`}>
        {exposedArms.map((d, i) => <path key={i} d={d} />)}
      </clipPath>}
      <clipPath id={`${id}-base-grip`}><rect x="60" y="423" width="72" height="84" /><rect x="268" y="423" width="72" height="84" /></clipPath>
      <clipPath id={`${id}-hands`}><rect y="389" width="400" height="122" /></clipPath>
      {cuffs && <clipPath id={`${id}-wrist-openings`}>
        {[0,1].map(side => {
          const x = cuffs[side*2], y = cuffs[side*2+1]
          return <path key={side} d={`M${x-12} ${y-2}Q${x} ${y-5} ${x+12} ${y-2}L${x+22} 520H${x-22}Z`} />
        })}
      </clipPath>}
    </defs>
    {worn.background && <Backdrop item={worn.background} rect={fullBody ? [0,0,400,800] : squareCrop ? [90,10,220,220] : [65,0,270,371.25]} />}
    {fullBody && <ellipse cx="200" cy="752" rx="101" ry="12" fill="#162836" opacity=".12" />}
    <g>
      {hairMode === 'preserve' && ['curls','twists','afro','locs','long','wavy','bob','bangs','twin_braids'].includes(t.hair_style) && <path transform={head.transform} d="M145 112Q200 80 255 112L250 207Q200 231 150 207Z" fill={HAIR[t.hair_color].dark} />}
      <g clipPath={`url(#${id}-neck)`} data-manga-part="neck"><NeckTexture traits={t} filter={`${id}-skin`} fit={neckline} /></g>
      {worn.body && !longSleeves && !exposedArms && !PAINTED_HANDS.has(worn.body?.slug ?? '') && skinArms}
      <g data-manga-part="outfit" mask={worn.body && neckline ? `url(#${id}-neck-opening)` : undefined}>{outfit}</g>
      {worn.body && !bodySprite && <LegacyItem item={worn.body} transform="translate(200 15) scale(2.3 3.3)" />}
      {heldProp && <g transform={`translate(${gripX-PROP_GRIPS[heldProp.slug][0]} ${gripY-PROP_GRIPS[heldProp.slug][1]})`} data-manga-part="held-prop"><Item item={heldProp} rect={PIN_RECTS[heldProp.slug]} /></g>}
      {worn.body && exposedArms && <g clipPath={`url(#${id}-sleeve-openings)`} data-manga-part="exposed-arms">{skinArms}</g>}
      {worn.body && longSleeves && hands && <g clipPath={`url(#${id}-wrist-openings)`}>{hands}</g>}
      {heldProp && worn.body && !longSleeves && !exposedArms && !PAINTED_HANDS.has(worn.body?.slug ?? '') && <g clipPath={`url(#${id}-hands)`}>{skinArms}</g>}
      {heldProp && !worn.body && <g clipPath={`url(#${id}-base-grip)`}>{outfit}</g>}
      <g transform={head.transform} data-manga-part="head-rig">
      <g clipPath={`url(#${id}-face)`}><Sprite name={t.face} rect={[104, 37, 192, 192]} filter={`${id}-skin`} /></g>
      {!headOptions?.covers_ears && worn.ears && (earsSprite ? <>
        <Sprite sprite={earsSprite} rect={[123, 88, 45, 80]} sourceWindow={[0,0,500,1000]} filter={`${id}-skin`} label={worn.ears.slug} />
        <Sprite sprite={earsSprite} rect={[232, 88, 45, 80]} sourceWindow={[500,0,500,1000]} filter={`${id}-skin`} label={worn.ears.slug} />
      </> : <Item item={worn.ears} rect={[126, 92, 148, 94]} filter={`${id}-skin`} />)}
      <Face traits={t} id={id} />
      {worn.facial_hair && <Item item={worn.facial_hair} rect={worn.facial_hair.slug === 'mustache' ? [165, 132, 70, 28] : [139, 117, 122, 100]} filter={`${id}-beard`} />}
      <g transform={`translate(200 153) scale(${{narrow:.85,normal:1,wide:1.15}[t.mouth_width]} .85)`}>
        {worn.mouth?.slug === 'vampire-fangs' ? <PaintedMouth style="grin" fangs /> : worn.mouth ? <Item item={worn.mouth} rect={[-25, -16, 50, 32]} legacyTransform="scale(.9 .8) translate(0 -25)" /> : <PaintedMouth style={t.mouth} />}
      </g>
      {hairMode !== 'hide' && hairStyle !== 'bald' && <g clipPath={hairMode === 'tuck' ? `url(#${id}-tuck)` : undefined}><Sprite name={hairStyle} rect={hairStyle === 'hijab' ? HAIR_RECTS[hairStyle] : [HAIR_RECTS[hairStyle][0], HAIR_RECTS[hairStyle][1] - 6, HAIR_RECTS[hairStyle][2], HAIR_RECTS[hairStyle][3]]} filter={`${id}-${hairStyle === 'hijab' ? 'fabric' : 'hair'}`} label={`hair:${hairStyle}`} /></g>}
      {worn.eyewear && <g transform={`translate(200 0) scale(${{close:.9,normal:1,wide:1.1}[t.eye_spacing]} 1) translate(-200 0)`}><Item item={worn.eyewear} rect={[142, 84, 116, 62]} legacyTransform="translate(200 120) scale(1.4 .9)" /></g>}
      {worn.head && <Item item={worn.head} rect={HEAD_RECTS[worn.head.slug] ?? [100, 16, 200, 200]} legacyTransform="translate(200 120) scale(1.15 1.3)" />}
      </g>
      {worn.pin && !heldProp && <Item item={worn.pin} rect={PIN_RECTS[worn.pin.slug] ?? [160, 230, 80, 80]} legacyTransform="translate(200 130) scale(1.3 1.5)" />}
    </g>
  </svg>
}


function Face({ traits: t, id }: { traits: AvatarTraits; id: string }) {
  const spread = {close:21,normal:24,wide:27}[t.eye_spacing]
  const scale = {small:.9,normal:1,large:1.1}[t.eye_scale]
  const tilt = {down:5,level:0,up:-5}[t.eye_tilt]
  const browY = {low:105,normal:101,high:97}[t.brow_height]
  const brow = HAIR[t.hair_color].dark
  const jawScale = {round:1,egg:.95,square:1.06,heart:.95}[t.face]
  return <g transform={`translate(200 0) scale(${jawScale} 1) translate(-200 0)`} data-manga-face={t.face}>
    {t.cheek_blush !== 'none' && <g fill={t.cheek_blush === 'pink' ? '#cb647e' : '#d88a5d'} opacity=".2"><ellipse cx="169" cy="136" rx="11" ry="4" /><ellipse cx="231" cy="136" rx="11" ry="4" /></g>}
    {t.freckles !== 'none' && <g fill={SKIN[t.skin].shadow} opacity=".75">{[-1,1].flatMap(side => Array.from({length:t.freckles === 'heavy'?9:4},(_,i)=><circle key={`${side}-${i}`} cx={200+side*(16+i%5*4)} cy={131+Math.floor(i/5)*5+(i%2)*2} r={i%3===0?1:.7} />))}</g>}
    {[-1,1].map(side => <g key={side}>
      <g transform={`translate(${200+side*spread} ${browY}) scale(${-side} 1)`} fill={brow} stroke={brow} strokeWidth={t.brows === 'thin' ? .7 : 1.1} strokeLinecap="round">
        <path d={t.brows === 'arched' ? 'M-14 0Q-2-7 13-1L12 1Q-1-3-14 1Z' : t.brows === 'bushy' ? 'M-14 0-9-3-6-2-3-4 3-3 7-4 14-1 12 3-3 1-12 3Z' : t.brows === 'thin' ? 'M-14 0Q-1-3 13 0' : 'M-14-1 13-2 12 1-13 2Z'} />
      </g>
      <g transform={`translate(${200+side*spread} 117) rotate(${side*tilt}) scale(${scale} ${scale})`}>
        <PaintedEye traits={t} side={side as -1 | 1} id={id} />
      </g>
    </g>)}
    <PaintedNose traits={t} skinFilter={`${id}-skin`} />
  </g>
}
