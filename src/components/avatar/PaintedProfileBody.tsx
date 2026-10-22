import React, { useId } from 'react'
import type { AvatarItem, AvatarTraits } from '@/lib/avatar/types'
import type { SpriteRect } from '@/lib/avatar/manga-collection'
import { PIN_RECTS } from '@/lib/avatar/manga-collection'
import { PROP_GRIPS } from '@/lib/avatar/anatomy-fit'
import { WALK, walkFrame } from '@/lib/avatar/walk-gait'
import parts from '@/lib/avatar/profile-body-parts.json'
import costumes from '@/lib/avatar/profile-costumes.json'
import { Item, Sprite } from './MangaParts'

const SKIN_PATHS = {
  tee: 'M474 130Q510 115 550 122L615 311H470Z',
  polo: 'M473 439Q511 423 552 430L620 613H470Z',
  hoodie: 'M548 876L588 858L622 930H547Z',
  striped: 'M550 1170L589 1151L621 1220H548Z',
  varsity: 'M550 1471L589 1452L624 1535H547Z',
} as const
export const hasPaintedProfileCostume = (slug: string) => Object.hasOwn(costumes, slug)
const NECK_CAPS = {
  tee: 'M260 8H322V61L255 31Z',
  polo: 'M261 306H320V351L255 326Z',
  hoodie: 'M260 594H321V648L253 616Z',
  striped: 'M263 905H322V946L256 926Z',
  varsity: 'M263 1195H323V1241L256 1214Z',
} as const

/** Side paintings, cut only at anatomical joints. No front texture is sampled. */
export default function PaintedProfileBody({ traits: t, skinFilter, shirtFilter, moving, heldProp, outfit }: {
  traits: AvatarTraits; skinFilter: string; shirtFilter: string; moving: boolean; heldProp?: AvatarItem; outfit?: string
}) {
  const id = `side-body-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const costume = outfit && hasPaintedProfileCostume(outfit) ? costumes[outfit as keyof typeof costumes] : undefined
  const windows = costume?.windows ?? parts[t.shirt_style]
  const sprite = costume?.sprite ?? 'profile-essential-parts'
  const torsoRect: SpriteRect = [137,190,126,costume?.height ?? 253]
  const armRect: SpriteRect = [137,225,105,252]
  const legRect: SpriteRect = [172,421,103,330]
  const hemCover = ({'lab-coat':505,'midnight-vampire-dress':665,'spooky-ghost-sheet':565,'spooky-pirate-coat':505} as Record<string,number>)[outfit??''] ?? 400
  // A fixed hem crop would sever a moving leg once it swings outside the coat.
  const coveredLegTop = moving ? 400 : hemCover
  const isolateBoot = outfit === 'field-vest' || outfit === 'flight-suit'
  const soleDrop = t.shirt_style === 'varsity' ? 4 : 0
  function art(part: 0 | 1 | 2, rect: SpriteRect) {
    const window = windows[part] as unknown as SpriteRect
    const skinId = `${id}-skin-${part}`
    return <svg className="avatar-size-native" x={rect[0]} y={rect[1]} width={rect[2]} height={rect[3]} viewBox={window.join(' ')} preserveAspectRatio="none" overflow="hidden">
      <g filter={`url(#${id}-cutout)`} mask={part === 0 ? `url(#${id}-neck-cap)` : undefined} clipPath={part === 2 && isolateBoot ? `url(#${id}-single-boot)` : undefined}>
        <Sprite name={sprite} rect={[0,0,1000,1000]} filter={costume || part === 2 ? undefined : shirtFilter} />
        {part === 1 && (!costume || costume.armSkin !== null) && <g clipPath={`url(#${skinId})`}><Sprite name={sprite} rect={[0,0,1000,1000]} filter={skinFilter}/></g>}
      </g>
    </svg>
  }
  const legArt = art(2, legRect)
  // The source bounds include the projecting toe. Register the trouser volume
  // around the skeleton independently of that shoe width.
  const thighArt = <g transform="translate(202 0) scale(1.4 1) translate(-202 0)">{legArt}</g>
  const shinArt = <g transform="translate(202 0) scale(1.25 1) translate(-202 0)">{legArt}</g>
  const armArt = art(1, armRect)
  function leg(side: 'near' | 'far') {
    const frame = walkFrame(side === 'near' ? 0 : .5)
    return <g className={`manga-profile-${side}`} data-manga-part={`${side}-leg`} transform={side === 'far' ? moving ? 'translate(-6 0)' : 'translate(-17 -5)' : undefined}>
      <g transform="translate(202 436)"><g className="manga-profile-thigh" style={{transform:`rotate(${moving ? frame.thigh : 0}deg)`}}>
        <g transform="translate(-202 -436)" clipPath={`url(#${id}-thigh)`}>{thighArt}</g>
        <g transform="translate(0 150)"><g className="manga-profile-knee" style={{transform:`rotate(${moving ? frame.knee : 0}deg)`}}>
          <g transform="translate(-202 -586)" clipPath={`url(#${id}-shin)`}>{shinArt}</g>
          <g transform={`translate(0 ${WALK.shin})`}><g className="manga-profile-foot" style={{transform:`rotate(${moving ? frame.foot : 0}deg)`}}>
            <g transform={`translate(-202 ${-(WALK.hipY+WALK.thigh+WALK.shin)})`} clipPath={`url(#${id}-foot)`}>{legArt}</g>
          </g></g>
        </g></g>
      </g></g>
    </g>
  }
  function arm(side: 'near' | 'far') {
    return <g className={`manga-profile-${side}`} data-manga-part={`${side}-arm`} transform={side === 'far' ? 'translate(12 -3)' : undefined}>
      <g transform="translate(166 246)"><g className="manga-profile-arm" style={{transform:moving ? undefined : 'rotate(0deg)'}}>
        <g transform="translate(-166 -246)" clipPath={`url(#${id}-upper-arm)`}>{armArt}</g>
        <g transform="translate(21 111)"><g className="manga-profile-elbow" style={{transform:moving ? undefined : 'rotate(0deg)'}}>
          {side === 'near' && heldProp && <g transform={`translate(32 105) scale(.8 .85) translate(${-PROP_GRIPS[heldProp.slug][0]} ${-PROP_GRIPS[heldProp.slug][1]})`} data-manga-part="held-prop"><Item item={heldProp} rect={PIN_RECTS[heldProp.slug]}/></g>}
          <g transform="translate(-187 -357)" clipPath={`url(#${id}-lower-arm)`}>{armArt}</g>
        </g></g>
      </g></g>
    </g>
  }
  return <g data-manga-part="painted-profile-body" data-manga-sprite={outfit}>
    <defs>
      <filter id={`${id}-cutout`} colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncA type="table" tableValues="0 0 0 0 1"/></feComponentTransfer></filter>
      <mask id={`${id}-neck-cap`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000" style={{maskType:'luminance'}}><rect width="1000" height="1000" fill="white"/>{costume
        ? <rect x={windows[0][0]} y={windows[0][1]} width={windows[0][2]} height={windows[0][3]*.075} fill="black"/>
        : <path d={NECK_CAPS[t.shirt_style]} transform="scale(.9765625 .6510416667)" fill="black"/>}</mask>
      <clipPath id={`${id}-skin-1`}>{costume
        ? <path d={`M${windows[1][0]} ${windows[1][1]+windows[1][3]*((costume.armSkin??1)+.035)}L${windows[1][0]+windows[1][2]} ${windows[1][1]+windows[1][3]*((costume.armSkin??1)-.035)}V${windows[1][1]+windows[1][3]}H${windows[1][0]}Z`}/>
        : <path d={SKIN_PATHS[t.shirt_style]} transform="scale(.9765625 .6510416667)"/>}</clipPath>
      <clipPath id={`${id}-hips`}><rect x="140" y="410" width="160" height="37"/></clipPath>
      <clipPath id={`${id}-thigh`}><rect x="140" y="410" width="160" height="169"/><ellipse cx="207" cy="579" rx="37" ry="21"/></clipPath>
      <clipPath id={`${id}-shin`}><ellipse cx="208" cy="586" rx="37" ry="29"/><rect x="140" y="586" width="160" height="101"/><ellipse cx="213" cy="687" rx="28" ry="7"/></clipPath>
      <clipPath id={`${id}-foot`}>{costume ? <rect x="140" y="686" width="160" height="83"/> : <path d={`M181 686H300V${737+soleDrop}H280Q244 ${753+soleDrop} 205 ${746+soleDrop}L184 ${741+soleDrop}V724L181 715Z`}/>}</clipPath>
      <clipPath id={`${id}-upper-arm`}><rect x="120" y="220" width="140" height="142"/></clipPath>
      <clipPath id={`${id}-lower-arm`}><rect x="120" y="350" width="140" height="140"/></clipPath>
      <clipPath id={`${id}-covered-legs`}><rect x="0" y={coveredLegTop} width="400" height={800-coveredLegTop}/></clipPath>
      {isolateBoot && <clipPath id={`${id}-single-boot`}><path d={`M${windows[2][0]} ${windows[2][1]}H${windows[2][0]+windows[2][2]}V${windows[2][1]+windows[2][3]}H${windows[2][0]+windows[2][2]*.31}V${windows[2][1]+windows[2][3]*.84}L${windows[2][0]} ${windows[2][1]+windows[2][3]*.78}Z`}/></clipPath>}
    </defs>
    <g clipPath={`url(#${id}-covered-legs)`}>{leg('far')}</g>{arm('far')}<g clipPath={`url(#${id}-covered-legs)`}>{leg('near')}</g>
    {hemCover === 400 && <g clipPath={`url(#${id}-hips)`}><g transform="translate(-6 0)">{thighArt}</g>{thighArt}</g>}
    {art(0,torsoRect)}
    {arm('near')}
  </g>
}
