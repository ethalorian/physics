import type { HairStyle } from './types'
import type { MangaSprite, SpriteRect } from './manga-collection'

const sheets=[
  ['short','buzz','fade','spiky','side_part','mohawk'],
  ['curls','twists','afro','locs','braids','bun'],
  ['high_pony','ponytail','bob','bangs','long','wavy'],
  ['twin_braids','hijab'],
] as const
export const PROFILE_HAIR: Readonly<Record<string,MangaSprite>>=Object.fromEntries(sheets.flatMap((entries,sheet)=>entries.map((name,index)=>[name,{atlas:`hair-${'abcd'[sheet]}`,collection:'manga-profile-v1',cols:sheet===3?2:3,rows:sheet===3?1:2,index}])))

/** The profile has one exposed temple; retain each painted silhouette without a hairline crop. */
export const PROFILE_HAIR_RECTS: Record<Exclude<HairStyle,'bald'>,SpriteRect>={
  short:[108,5,150,180],buzz:[110,0,150,185],fade:[105,7,150,178],
  spiky:[98,-8,170,190],side_part:[104,7,160,177],mohawk:[104,-7,164,194],
  curls:[72,-5,195,220],twists:[78,0,190,240],afro:[78,-10,190,215],
  locs:[70,10,195,265],braids:[97,5,165,234],bun:[80,-9,190,200],
  high_pony:[53,-16,215,290],ponytail:[67,2,200,257],bob:[95,5,180,220],
  bangs:[90,16,178,230],long:[85,5,190,290],wavy:[75,5,198,295],
  twin_braids:[61,14,205,290],hijab:[71,11,220,280],
}

// Register the crown against the temple, independently of the length below it.
// A long tail must not make the scalp taller when an atlas tile is fitted.
export const PROFILE_CROWN_SCALE: Record<Exclude<HairStyle,'bald'>,number>={
  short:.76,buzz:.7,fade:.78,spiky:.74,side_part:.76,mohawk:.82,
  curls:.77,twists:.74,afro:.77,locs:.76,braids:.76,bun:.85,
  high_pony:.84,ponytail:.74,bob:.68,bangs:.67,long:.64,wavy:.68,
  twin_braids:.72,hijab:.72,
}

/** Exclude stray neighboring strands that extend into atlas gutters. */
export const PROFILE_HAIR_INSETS: Record<string,readonly [number,number,number,number]>={
  buzz:[100,0,0,0],fade:[25,0,0,0],side_part:[115,0,0,0],mohawk:[75,0,0,0],
  twists:[55,0,0,0],braids:[70,0,22,0],ponytail:[55,0,0,0],bob:[0,0,0,40],bangs:[0,0,25,0],long:[35,0,0,0],
}
