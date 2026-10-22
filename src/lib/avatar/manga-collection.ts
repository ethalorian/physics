import atlases from './manga-atlases.json'
import type { AvatarItem, AvatarTraits, EquippedItems, HairStyle, ItemSlot } from './types'
import { ITEM_SLOTS } from './types'

export const MANGA_COLLECTION = 'manga-v2'
export interface MangaSprite { atlas: string; collection: string; cols: number; rows: number; index: number }
export type SpriteRect = readonly [x: number, y: number, width: number, height: number]
export const MANGA_SPRITES: Readonly<Record<string, MangaSprite>> = {
  ...Object.fromEntries(atlases.flatMap(a => a.entries.map((key, index) => [key, { atlas: a.name, collection: a.collection ?? 'manga-v1', cols: a.cols, rows: a.rows, index }]))),
  // Replace this style independently so the neighboring atlas cells keep their registration.
  ponytail: { atlas: 'ponytail', collection: 'manga-portrait-v1', cols: 1, rows: 1, index: 0 },
}

/** Registration of the new masks and hats is separate from free hair and face shape. */
export const HEAD_RECTS: Record<string, SpriteRect> = {
  'beanie': [124, 15, 152, 110],
  'grad-cap': [100, -8, 200, 150],
  'scholars-laurel': [131, 32, 138, 94],
  'space-helmet': [103, 25, 194, 182],
  'viking-helmet': [100, 8, 200, 190],
  'football-helmet': [117, 28, 166, 176],
  'spooky-witch-hat': [90, 0, 220, 141],
  'spooky-ghost-hood': [105, -5, 190, 226],
  'spooky-skull-mask': [124, 41, 152, 151],
  'spooky-pumpkin-mask': [121, 45, 158, 166],
  'spooky-mummy-mask': [135, 33, 130, 160],
  'spooky-werewolf-mask': [119, 17, 162, 192],
  'spooky-monster-mask': [128, 28, 144, 169],
  'spooky-scarecrow-mask': [111, 7, 178, 200],
  'spooky-cat-hood': [123, 28, 154, 190],
  'spooky-pirate-hat': [100, -2, 200, 132],
  'fhs-baseball-cap': [129, 23, 142, 110],
  'fhs-football-helmet': [121, 22, 158, 180],
  'fhs-hockey-helmet': [124, 16, 152, 186],
}

export function mangaOutfitRect(sprite: MangaSprite): SpriteRect {
  if (sprite.collection === 'manga-wardrobe-v2') return [85, 158, 230, 612]
  if (sprite.collection === 'manga-v1') return sprite.index < 4 ? [85, 155, 230, 680] : [85, 175, 230, 640]
  return [85, 155, 230, 640]
}

/** Center the painted waist, rather than the free item's transparent canvas. */
export const FRONT_BASE_LEGS_RECT: SpriteRect = [80, 382, 240, 379]
export const FRONT_BASE_SHIRT_RECTS: Record<AvatarTraits['shirt_style'], SpriteRect> = {
  tee: [77.5, 185, 225, 260], polo: [85.5, 185, 225, 260],
  hoodie: [87.5, 185, 225, 260], striped: [79.5, 185, 225, 260], varsity: [85.5, 185, 225, 260],
}


/** Each painted cuff is registered to the shared hand layer, not its canvas edge. */
export const MANGA_HAND_OFFSETS: Record<string, readonly [inward: number, down: number]> = {
  'lab-coat': [25, 18], 'denim-jacket': [25, 18], 'cosmic-hoodie': [27, 23],
  'field-vest': [18, 18], 'flight-suit': [29, 16],
  'midnight-vampire-dress': [29, 15], 'dracula-cape': [39, 10],
}

const atlasSlot = (atlas: string): ItemSlot | undefined => atlas.startsWith('outfits-') ? 'body' : atlas.startsWith('headwear-') ? 'head' : atlas.startsWith('accessories-') ? 'pin' : (atlas === 'backgrounds' || atlas === 'scenes') ? 'background' : atlas === 'eyewear' ? 'eyewear' : undefined
export function mangaItemSprite(item: AvatarItem): MangaSprite | undefined {
  const sprite = Object.hasOwn(MANGA_SPRITES, item.slug) ? MANGA_SPRITES[item.slug] : undefined
  if (!sprite) return
  const slot = atlasSlot(sprite.atlas) ?? ({ mustache: 'facial_hair', 'full-beard': 'facial_hair', 'vampire-ears': 'ears', 'vampire-fangs': 'mouth' } as Record<string, ItemSlot>)[item.slug]
  return slot === item.slot ? sprite : undefined
}

/** Supplied catalog and slot membership remain authoritative, including retired owned items. */
export function equippedMangaItems(equipped?: EquippedItems, items?: AvatarItem[]): Partial<Record<ItemSlot, AvatarItem>> {
  const result: Partial<Record<ItemSlot, AvatarItem>> = {}
  const bySlug = new Map(items?.map(item => [item.slug, item]))
  for (const [slot, slug] of Object.entries(equipped ?? {})) {
    if (!ITEM_SLOTS.includes(slot as ItemSlot)) continue
    const item = bySlug.get(slug)
    if (item?.slot === slot) result[slot as ItemSlot] = item
  }
  return result
}

/** Registration is deliberately independent of the transparent canvas bounds. */
export const HAIR_RECTS: Record<Exclude<HairStyle, 'bald'>, SpriteRect> = {
  short: [120, 24, 160, 160], buzz: [120, 24, 160, 160], fade: [120, 24, 160, 160],
  spiky: [116, 16, 168, 168], side_part: [116, 20, 168, 168], mohawk: [120, 20, 160, 160],
  curls: [78, 2, 234, 234], twists: [82, 6, 236, 236], afro: [73, -5, 254, 254],
  locs: [83, 9, 234, 234], braids: [93, 18, 214, 214], bun: [83, 0, 234, 214],
  high_pony: [44, 3, 240, 240], ponytail: [79, 24, 240, 240], bob: [86, 0, 228, 228],
  bangs: [83, 22, 234, 234], long: [79, 28, 242, 242], wavy: [78, 18, 244, 244],
  twin_braids: [69, 29, 244, 244], hijab: [65, 23, 270, 270],
}

// Exclude neighboring curls that cross an atlas cell's transparent margin.
export const SPRITE_INSETS: Record<string, readonly [number, number, number, number]> = {
  'observatory-scene': [4,12,4,8], 'night-sky': [12,4,4,8],
  'sage-halo': [4,12,8,8], 'aurora': [12,4,8,8],
  'sunrise': [4,12,8,8], 'spooky-graveyard': [12,4,8,8],
  'spooky-haunted-castle': [4,12,8,4], 'spooky-pumpkin-patch': [12,4,8,4],
  'beanie': [0, 40, 0, 0], 'scholars-laurel': [0, 15, 0, 0],
  buzz: [45, 0, 0, 0], fade: [30, 0, 0, 0], side_part: [85, 20, 0, 0], mohawk: [30, 0, 0, 0],
  twists: [85, 35, 0, 0], braids: [80, 45, 50, 0], afro: [0, 0, 0, 65],
  'flash-suit': [90, 70, 0, 0], 'batman-suit': [0, 25, 0, 0],
  'spooky-ghost-sheet': [130, 0, 0, 0], 'spooky-skeleton-suit': [40, 35, 0, 0],
  'spooky-mummy-wraps': [0, 0, 0, 80], 'spooky-werewolf-shirt': [30, 0, 0, 80],
  'spooky-monster-jacket': [0, 35, 0, 80], 'spooky-scarecrow-overalls': [0, 0, 0, 80],
  'spooky-cat-suit': [0, 40, 0, 0],
  'fhs-football-uniform': [85, 0, 0, 0],
  'fhs-softball-uniform': [75, 0, 0, 0], 'fhs-soccer-uniform': [30, 0, 0, 0],
  'fhs-volleyball-uniform': [40, 0, 0, 0], 'fhs-track-uniform': [120, 0, 0, 0],
  'fhs-cross-country-uniform': [100, 70, 0, 0], 'fhs-warmup-jacket': [80, 0, 0, 0],
  'spooky-monster-mask': [0, 35, 0, 0], 'spooky-cat-hood': [45, 0, 0, 0],
  'spooky-pirate-hat': [0, 0, 0, 120], 'fhs-baseball-cap': [75, 0, 0, 120],
  'spooky-cauldron': [0, 0, 30, 0], 'spooky-candy-bucket': [25, 0, 0, 0],
}

export const PIN_RECTS: Record<string, SpriteRect> = {
  'atom-pin': [225, 256, 38, 38], 'beaker-pin': [225, 256, 38, 38], 'bolt-pin': [225, 256, 38, 38],
  'comet-pin': [225, 256, 38, 38], 'cuban-gold-chain': [155, 204, 90, 100], 'ruby-bat-pendant': [164, 210, 72, 100],
  piccolo: [149, 287, 120, 75], 'batman-utility-belt': [130, 382, 140, 70], batarang: [252, 426, 82, 70],
  mjolnir: [265, 385, 95, 150], 'spooky-broom': [220, 302, 106, 336], 'spooky-candy-bucket': [230, 449, 103, 100],
  'spooky-cauldron': [224, 450, 115, 110], 'spooky-spider-brooch': [226, 253, 38, 38],
  'spooky-bat-bow-tie': [160, 211, 80, 50], 'spooky-lantern': [230, 439, 100, 133],
}

/** Dark ink stays dark; highlights remain warm even on the deepest skin tones. */
export function mangaTintRamp(hex: string): [string, string, string] {
  const rgb = [1, 3, 5].map(start => Number.parseInt(hex.slice(start, start + 2), 16) / 255)
  return rgb.map(value => [value * .12, value * .42, value * .76, value, value + (1 - value) * .2, value + (1 - value) * .42].map(v => v.toFixed(4)).join(' ')) as [string, string, string]
}
