import React, { useId, type ReactNode } from 'react'
import type { AvatarItem, AvatarTraits, ItemSlot } from '@/lib/avatar/types'
import { HAIR, SHIRT, SKIN } from '@/lib/avatar/palette'
import { HEAD_RECTS, FRONT_BASE_LEGS_RECT, FRONT_BASE_SHIRT_RECTS, MANGA_COLLECTION, PIN_RECTS, mangaItemSprite, mangaOutfitRect, type SpriteRect } from '@/lib/avatar/manga-collection'
import { LEGACY_WALK, walkFrame } from '@/lib/avatar/walk-gait'
import { PROFILE_HAIR, PROFILE_HAIR_RECTS, PROFILE_CROWN_SCALE, PROFILE_HAIR_INSETS } from '@/lib/avatar/profile-hair'
import { Item, LegacyItem, Sprite, Tint, Backdrop } from './MangaParts'
import { NeckOpeningMask } from './MangaNeck'
import { BASE_NECKLINES, OUTFIT_NECKLINES, necklinePath, type NecklineFit } from '@/lib/avatar/neckline-fit'
import { ProfileEyes, ProfileMouth, profileEyeOffset } from './ProfileExpression'
import { PROFILE_HEAD_RECTS, PROFILE_EYEWEAR_RECT, PROFILE_ITEM_INSETS, PROFILE_ITEM_MIRRORED, profileItemSprite } from '@/lib/avatar/profile-wardrobe'
import { hasLongSleeves, headFit, HELD_PROPS, PROP_GRIPS } from '@/lib/avatar/anatomy-fit'
import ProfileLegacyHead from './ProfileLegacyHead'
import MangaBaseBody from './MangaBaseBody'
import PaintedProfileBody, { hasPaintedProfileCostume } from './PaintedProfileBody'
const styles={profile:'manga-profile',weight:'manga-profile-weight',near:'manga-profile-near',far:'manga-profile-far'}
const paintedSleeveColors: Record<string, string> = {
  'lab-coat': '#e8e3dc', 'denim-jacket': '#30475f', 'cosmic-hoodie': '#263148',
  'field-vest': '#b9a387', 'flight-suit': '#397f87',
  'midnight-vampire-dress': '#35213c', 'dracula-cape': '#e9e3d9',
}

type Worn = Partial<Record<ItemSlot, AvatarItem>>
/** A right-facing articulated figure. Painted wardrobe textures remain catalog-owned;
 * the side silhouette, joints and face are composed deterministically from saved traits. */
export default function MangaProfile({traits:t,worn,size,className,decorative,pose}: {
  traits: AvatarTraits; worn: Worn; size: number; className?: string; decorative: boolean; pose:'side'|'walking'|'running'
}) {
  const id=`profile-${useId().replace(/[^a-zA-Z0-9_-]/g,'')}`
  const body=worn.body && mangaItemSprite(worn.body)
  const paintedBody = !worn.body || hasPaintedProfileCostume(worn.body.slug)
  const head=worn.head && profileItemSprite(worn.head)
  const headRect=worn.head && PROFILE_HEAD_RECTS[worn.head.slug]
  const headTransform=worn.head && headRect && PROFILE_ITEM_MIRRORED.has(worn.head.slug) ? `translate(${headRect[0]*2+headRect[2]} 0) scale(-1 1)` : undefined
  const eyewear=worn.eyewear && profileItemSprite(worn.eyewear)
  const ears=worn.ears && mangaItemSprite(worn.ears)
  const pointedEars=worn.ears?.slug==='vampire-ears' && !worn.head?.render_options?.covers_ears
  const facialHair=worn.facial_hair && mangaItemSprite(worn.facial_hair)
  const legacyColor=worn.body ? worn.body.svg_layer.match(/fill="(#[\da-fA-F]{6})"/)?.[1] : undefined
  const newOutfit=body?.collection==='manga-wardrobe-v2'
  const sleeveColor=(newOutfit && worn.body && paintedSleeveColors[worn.body.slug]) || legacyColor || SHIRT[t.shirt_color]
  const boots=newOutfit && ['field-vest','flight-suit','midnight-vampire-dress','dracula-cape'].includes(worn.body?.slug??'')
  const longSleeves=hasLongSleeves(t.shirt_style,worn.body?.slug)
  const gloveColor=({'flash-suit':'#b62532','batman-suit':'#24272d','thor-suit':'#414047'} as Record<string,string>)[worn.body?.slug??'']
  const heldProp=worn.pin && HELD_PROPS.has(worn.pin.slug) ? worn.pin : undefined
  const headRig=headFit([178,216,211,232])
  // Set the jaw closer to the collar and bring the head back over the shoulder.
  // Moving the complete rig preserves the face, ear and hair registration.
  const headTransformBase = `translate(${paintedBody ? 16 : -4} 11) ${headRig.transform} translate(200 0) scale(${{ round: 1.03, egg: 1, square: 1.04, heart: .98 }[t.face]} 1) translate(-200 0)`
  const profileHeadRect: SpriteRect=[111+({button:0,narrow:12,broad:0,hook:11}[t.nose]),52,150,175]
  const profileHeadName=`profile-${pointedEars?'pointed':'face'}-${t.nose}`
  // Reveal only the smaller ear's upper rim over the hair. Its lower attachment
  // stays behind the same hair strands as the painted head underneath.
  const earOffset={button:[0,0],narrow:[-49,0],broad:[-4,-30],hook:[-44,-30]}[t.nose]
  const draped=['spooky-witch-robe','spooky-ghost-sheet','midnight-vampire-dress','dracula-cape'].includes(worn.body?.slug??'')
  const labCoat=worn.body?.slug==='lab-coat' && Boolean(body)
  const frontNeckline=body && worn.body ? OUTFIT_NECKLINES[worn.body.slug] : !worn.body ? BASE_NECKLINES[t.shirt_style] : undefined
  // The torso samples front artwork, but the profile neck is narrower and sits
  // farther back. Keep its aperture under the neck instead of across the shoulder.
  const neckline: NecklineFit | undefined=frontNeckline && [Math.max(frontNeckline[0],178),Math.min(frontNeckline[1],216),Math.min(frontNeckline[2],219),Math.min(frontNeckline[3],232),frontNeckline[4]]
  const outfit=<>{body ? <Sprite sprite={body} rect={mangaOutfitRect(body)} label={worn.body!.slug}/> : !worn.body ? <MangaBaseBody shirt={t.shirt_style} skinFilter={`${id}-skin`} shirtFilter={`${id}-shirt`} /> : <><Sprite name="legs" rect={FRONT_BASE_LEGS_RECT}/><Sprite name={t.shirt_style} rect={FRONT_BASE_SHIRT_RECTS[t.shirt_style]} filter={`${id}-shirt`}/>{worn.body && <LegacyItem item={worn.body} transform="translate(200 15) scale(2.3 3.3)"/>}</>}</>
  const skin=SKIN[t.skin], hair=HAIR[t.hair_color]
  const hairMode=worn.head?.render_options?.hair??'preserve'
  const hairStyle=hairMode==='tuck'?'buzz':t.hair_style
  const moving=pose!=='side'
  const ink='#302c32'
  const trouser=worn.body?.slug==='spooky-mummy-wraps'?'#d5c7a8':'#363a40'
  const nose={button:254,narrow:257,broad:261,hook:264}[t.nose]
  const chin={round:237,egg:231,square:243,heart:227}[t.face]
  // A rounded occiput and a lower crown keep the side view proportional to the
  // front portrait. Face landmarks stay fixed so the eye and accessories align.
  const face=`M174 71C194 61 220 65 235 83Q245 96 241 111L246 124L${nose} 137Q${nose+2} 141 247 144L246 154Q250 159 243 164Q246 178 ${chin} 183L205 183Q183 178 174 161Q147 154 143 130Q136 103 150 86Q159 76 174 71Z`
  const robe='M169 325H237L264 703Q209 714 145 700Z'
  const coatTails='M169 390H237L253 603Q211 616 153 603Z'
  const torso='M183 211Q209 204 226 218Q240 234 243 274L237 341L243 430Q218 450 169 435L170 344L157 280Q153 237 183 211Z'
  const thigh='M-27-8Q0-16 27-6C26 42 27 94 22 132Q22 157 0 163Q-22 160-24 139C-27 95-29 45-27-8Z'
  const shin='M-20-2C-21-18 20-18 21-2Q23 35 16 68L12 137Q9 152-12 150L-16 94Q-22 38-20-2Z'
  const shoe='M-18-9L15-9Q20 5 39 9Q51 12 52 22L-23 22Q-26 7-18-9Z'
  const arm='M-21-7Q0-20 21-6L16 111Q12 128 0 128Q-16 125-16 109Z'
  const forearm='M-15-8Q0-14 16-7Q14 41 10 89L9 101L-10 102L-12 85Q-19 38-15-8Z'
  const hand='M-10 96Q-1 94 9 96L11 106Q18 111 18 118Q16 122 12 118L8 113L9 129Q8 134 4 133Q1 138-3 133Q-8 136-10 130Q-14 130-14 124L-13 111Z'
  const clip=(name:string,d:string)=><clipPath id={`${id}-${name}`}><path d={d}/></clipPath>
  const texture=(source:SpriteRect,target:SpriteRect,neck=false)=><Window source={source} target={target}>
    {neck && neckline && <path d={necklinePath(neckline)} fill={`url(#${id}-skin-shade)`}/>}
    <g mask={neck && neckline ? `url(#${id}-neck-opening)` : undefined}>{outfit}</g>
  </Window>
  function leg(side:'near'|'far') {
    const contact=walkFrame(side==='near'?0:.5,LEGACY_WALK)
    return <g className={styles[side]} data-manga-part={`${side}-leg`}>
      <g transform="translate(202 436)"><g className="manga-profile-thigh" style={{transform: moving?`rotate(${contact.thigh}deg)`:'rotate(-3deg)'}}>
        <path d={thigh} fill={trouser} stroke={ink} strokeWidth="2.2"/>
        <g clipPath={`url(#${id}-thigh)`}>{texture(labCoat?[177,630,17,57]:!body?[132,438,61,165]:[143,430,63,181],[-28,-12,56,180])}</g>
        <g transform="translate(0 150)"><g className="manga-profile-knee" style={{transform:moving?`rotate(${contact.knee}deg)`:'rotate(6deg)'}}>
          <path d={shin} fill={trouser} stroke={ink} strokeWidth="2"/>
          <g clipPath={`url(#${id}-shin)`}>{texture(labCoat?[174,610,23,107]:!body?[122,572,64,121]:[147,586,56,131],[-23,-12,46,170])}</g>
          <g transform="translate(0 150)"><g className="manga-profile-foot" style={{transform:moving?`rotate(${contact.foot}deg)`:'rotate(-3deg)'}}>
            <path d={shoe} fill={boots?'#302e2e':'#ece5d6'} stroke={ink} strokeWidth="2.5"/>
            <g clipPath={`url(#${id}-shoe)`}>{texture(newOutfit?[143,711,47,40]:!body?[104,683,72,71]:[143,688,70,67],[-25,-13,80,38])}<path d="M-22 17H49" stroke={boots?'#302e2e':'#ebe5d8'} strokeWidth="6"/></g>
            <path d="M-23 23H52M13 2l12 1M18 6l12 1" stroke={ink} strokeWidth="2" fill="none"/>
          </g></g>
        </g></g>
      </g></g>
    </g>
  }
  function sleeve(side:'near'|'far') {
    return <g className={styles[side]} data-manga-part={`${side}-arm`}><g transform="translate(183 249)"><g className="manga-profile-arm" style={{transform:moving?undefined:'rotate(3deg)'}}>
      <path d={arm} fill={`url(#${id}-skin-shade)`} stroke={ink} strokeWidth="2"/>
      <g clipPath={`url(#${id}-arm)`}><rect x="-25" y="-20" width="50" height={longSleeves?155:65} fill={sleeveColor}/>{texture(newOutfit?[143,230,25,149]:[116,230,44,longSleeves?149:83],[-25,-20,50,longSleeves?160:65])}</g>
      <g transform="translate(0 119)"><g className="manga-profile-elbow" style={{transform:moving?undefined:'rotate(-12deg)'}}>
        <path d={forearm} fill={`url(#${id}-skin-shade)`} />
        <path d="M-15-5Q-19 38-12 85L-10 102M16-5Q14 41 10 89L9 101" fill="none" stroke={ink} strokeWidth="1.7"/>
        {longSleeves&&<g clipPath={`url(#${id}-forearm)`}><rect x="-20" y="-12" width="40" height="108" fill={sleeveColor}/>{texture(newOutfit?[130,326,26,89]:[115,326,42,89],[-20,-12,40,108])}</g>}
        {side==='near'&&heldProp&&<g transform={`translate(4 113) scale(.8 .85) translate(${-PROP_GRIPS[heldProp.slug][0]} ${-PROP_GRIPS[heldProp.slug][1]})`} data-manga-part="held-prop"><Item item={heldProp} rect={PIN_RECTS[heldProp.slug]} /></g>}
        <path d={hand} fill={gloveColor??`url(#${id}-skin-shade)`} stroke={ink} strokeWidth="1.6"/>
        <path d="M-7 115l1 13m5-12 1 13m5-14 1 13M8 108l-3 6" stroke={gloveColor?'#171d26':skin.shadow} fill="none" strokeWidth="1"/>
      </g></g>
    </g></g></g>
  }
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size*2} viewBox="0 0 400 800" className={['avatar-size-native',styles.profile,className].filter(Boolean).join(' ')} role={decorative?undefined:'img'} aria-label={decorative?undefined:'Student avatar'} aria-hidden={decorative||undefined} data-avatar-collection={MANGA_COLLECTION} data-avatar-pose={pose} data-avatar-view="profile" data-avatar-rig={paintedBody?'painted':'legacy'} data-walking={moving}>
    <defs>
      <NeckOpeningMask fit={neckline} id={`${id}-neck-opening`} />
      <Tint id={`${id}-shirt`} color={legacyColor??SHIRT[t.shirt_color]}/><Tint id={`${id}-hair`} color={hair.main}/><Tint id={`${id}-fabric`} color={SHIRT[t.fabric_color]}/><Tint id={`${id}-skin`} color={skin.color}/><Tint id={`${id}-beard`} color={HAIR[t.facial_hair_color==='match'?t.hair_color:t.facial_hair_color].main}/>
      <linearGradient id={`${id}-skin-shade`}><stop stopColor={skin.shadow}/><stop offset=".45" stopColor={skin.color}/><stop offset="1" stopColor={skin.color}/></linearGradient>
      {clip('robe',robe)}{clip('coat-tails',coatTails)}{clip('thigh',thigh)}{clip('shin',shin)}{clip('shoe',shoe)}{clip('arm',arm)}{clip('forearm',forearm)}{clip('torso',torso)}{clip('face',face)}
      <clipPath id={`${id}-head-opening`}><rect x="204" y="100" width="80" height="90" /><rect x="110" y="180" width="180" height="65"/></clipPath>
      <clipPath id={`${id}-crown`}><rect x="0" y="-100" width="400" height="220"/></clipPath>
      <clipPath id={`${id}-hair-length`}><rect x="0" y="119.7" width="400" height="480"/></clipPath>
      <linearGradient id={`${id}-ear-hair-overlap`} x1="0" y1="0" x2=".25" y2="1"><stop offset=".4" stopColor="white"/><stop offset=".9" stopColor="black"/></linearGradient>
      <mask id={`${id}-pointed-ear`} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="800" style={{maskType:'luminance'}}><path transform={`translate(${profileHeadRect[0]} 52) scale(${150/656} ${175/599.5}) translate(${earOffset[0]} ${earOffset[1]})`} d="M243 201C255 216 285 215 301 230Q311 241 312 256L305 270Q312 274 316 284L323 300Q325 316 308 316C287 312 262 294 255 276C250 257 252 225 243 201Z" fill={`url(#${id}-ear-hair-overlap)`}/></mask>
    </defs>
    {worn.background&&<Backdrop item={worn.background} rect={[0,0,400,800]}/>}
    <ellipse cx="205" cy="750" rx="93" ry="10" fill="#162836" opacity=".12"/>
    <g className={styles.weight}>
      <g transform={headTransformBase} clipPath={worn.head?.render_options?.covers_ears ? `url(#${id}-head-opening)` : undefined}><Sprite name={profileHeadName} rect={profileHeadRect} filter={`${id}-skin`} label={pointedEars?'vampire-ears':undefined}/></g>
      {paintedBody ? <PaintedProfileBody traits={t} skinFilter={`${id}-skin`} shirtFilter={`${id}-shirt`} moving={moving} heldProp={heldProp} outfit={worn.body?.slug}/> : <>
      {leg('far')}{sleeve('far')}{leg('near')}
      <path d={torso} fill={newOutfit?sleeveColor:(legacyColor??SHIRT[t.shirt_color])}/>
      <path d="M183 211Q153 237 157 280L170 344L169 435Q218 450 243 430L237 341L243 274Q240 234 226 218" fill="none" stroke={ink} strokeWidth="2.5"/>
      <g clipPath={`url(#${id}-torso)`}>{texture([144,204,112,239],[155,204,94,242],true)}</g>
      {draped&&<g><path d={robe} fill={legacyColor??'#39303e'} stroke={ink} strokeWidth="2"/><g clipPath={`url(#${id}-robe)`}>{texture([144,325,112,390],[145,325,120,390])}</g></g>}
      {labCoat&&<g data-manga-part="coat-tails"><path d={coatTails} fill="#eee9df" stroke={ink} strokeWidth="2"/><g clipPath={`url(#${id}-coat-tails)`}>{texture([137,390,126,225],[153,390,100,225])}</g></g>}
      </>}
      <g transform={headTransformBase} data-manga-part="head-rig">
      <g data-manga-face={t.face} clipPath={worn.head?.render_options?.covers_ears ? `url(#${id}-head-opening)` : undefined}>
        <ProfileEyes traits={t} id={id} />
        {t.freckles!=='none'&&<g fill={skin.shadow}>{Array.from({length:t.freckles==='heavy'?8:4},(_,i)=><circle key={i} cx={214+i%4*5} cy={139+Math.floor(i/4)*5} r="1.2"/>)}</g>}
        {t.cheek_blush!=='none'&&<ellipse cx="222" cy="144" rx="10" ry="5" fill={t.cheek_blush==='pink'?'#cb647e':'#d88a5d'} opacity=".25"/>}
        {!worn.mouth&&<ProfileMouth traits={t} />}
      </g>
      {hairMode!=='hide'&&hairStyle!=='bald'&&<>
        <g transform={`translate(0 120) scale(1 ${PROFILE_CROWN_SCALE[hairStyle]*1.14}) translate(0 -120)`}><g clipPath={`url(#${id}-crown)`}><Sprite sprite={PROFILE_HAIR[hairStyle]} insets={PROFILE_HAIR_INSETS[hairStyle]} rect={PROFILE_HAIR_RECTS[hairStyle]} filter={`${id}-${hairStyle==='hijab'?'fabric':'hair'}`} label={`hair:${hairStyle}`}/></g></g>
        <g clipPath={`url(#${id}-hair-length)`}><Sprite sprite={PROFILE_HAIR[hairStyle]} insets={PROFILE_HAIR_INSETS[hairStyle]} rect={PROFILE_HAIR_RECTS[hairStyle]} filter={`${id}-${hairStyle==='hijab'?'fabric':'hair'}`} label={`hair:${hairStyle}`}/></g>
      </>}
      {pointedEars&&hairStyle!=='hijab'&&<g mask={`url(#${id}-pointed-ear)`}><Sprite name={profileHeadName} rect={profileHeadRect} filter={`${id}-skin`}/></g>}
      {!pointedEars&&!worn.head?.render_options?.covers_ears&&worn.ears&&(ears ? <Sprite sprite={ears} rect={[166,102,36,59]} sourceWindow={[0,0,500,1000]} filter={`${id}-skin`} label={worn.ears.slug} /> : <Item item={worn.ears} rect={[153,105,47,65]} filter={`${id}-skin`} legacyTransform="translate(181 127) scale(.5 .8)"/>)}
      {worn.facial_hair&&(facialHair ? <Sprite sprite={facialHair} rect={worn.facial_hair.slug==='mustache'?[220,142,28,20]:[203,123,48,81]} sourceWindow={[500,0,500,1000]} filter={`${id}-beard`} label={worn.facial_hair.slug} /> : <Item item={worn.facial_hair} rect={[185,134,70,74]} filter={`${id}-beard`} legacyTransform="translate(220 142) scale(.7 .8)"/>)} 
      {worn.mouth?.slug === 'vampire-fangs' ? <ProfileMouth traits={t} fangs /> : worn.mouth&&<g transform={`translate(246 155) scale(${{narrow:.75,normal:1,wide:1.2}[t.mouth_width]} 1) translate(-246 -155)`}><Item item={worn.mouth} rect={[230,148,20,22]} legacyTransform="translate(240 154) scale(.45 .7) translate(0 -25)"/></g>}
      {worn.eyewear&&(eyewear ? <g transform={`translate(${profileEyeOffset(t.eye_spacing)} 0)`}><Sprite sprite={eyewear} rect={PROFILE_EYEWEAR_RECT} insets={[0,0,0,0]} label={worn.eyewear.slug} /></g> : <g transform="translate(94 0) scale(.6 1)"><Item item={worn.eyewear} rect={[144,91,116,62]} legacyTransform="translate(200 120) scale(1.4 .9)"/></g>)}
      {worn.head&&(head ? <g transform={headTransform}><Sprite sprite={head} rect={headRect!} insets={PROFILE_ITEM_INSETS[worn.head.slug] ?? (head.collection === 'manga-wardrobe-v2' ? [12,12,0,0] : [0,0,0,0])} label={worn.head.slug} /></g> : ['spiderman-mask','flash-mask','batman-cowl'].includes(worn.head.slug) ? <ProfileLegacyHead slug={worn.head.slug} skin={skin.color}/> : <g transform="translate(45 0) scale(.8 1)"><Item item={worn.head} rect={HEAD_RECTS[worn.head.slug]??[100,16,200,200]} legacyTransform="translate(200 120) scale(1.15 1.3)"/></g>)}
      </g>
      {worn.pin&&!heldProp&&<g transform="translate(97 0) scale(.55 1)"><Item item={worn.pin} rect={PIN_RECTS[worn.pin.slug]??[160,230,80,80]} legacyTransform="translate(200 130) scale(1.3 1.5)"/></g>}
      {!paintedBody && sleeve('near')}
    </g>
  </svg>
}

function Window({source,target,children}:{source:SpriteRect;target:SpriteRect;children:ReactNode}) {
  return <svg className="avatar-size-native" x={target[0]} y={target[1]} width={target[2]} height={target[3]} viewBox={source.join(' ')} preserveAspectRatio="none" overflow="hidden">{children}</svg>
}
