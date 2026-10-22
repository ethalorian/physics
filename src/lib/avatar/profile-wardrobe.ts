import type { AvatarItem, ItemSlot } from './types'
import type { MangaSprite, SpriteRect } from './manga-collection'
import atlases from './manga-atlases.json'

interface ProfileAtlas { name: string; collection: string; cols: number; rows: number; slot: ItemSlot; entries: readonly string[]; indexOffset?: number }

/** Dedicated side artwork only for items already in the painted collection.
 * Catalog membership and slot validation are still required by the composer. */
export const PROFILE_WARDROBE_ATLASES: readonly ProfileAtlas[] = [
  { name: 'headwear-a', collection: 'manga-profile-wardrobe-v1', cols: 3, rows: 2, slot: 'head', entries: ['spooky-pumpkin-mask', 'spooky-mummy-mask', 'spooky-werewolf-mask', 'spooky-monster-mask', 'spooky-scarecrow-mask', 'spooky-cat-hood'] },
  { name: 'headwear-b', collection: 'manga-profile-wardrobe-v1', cols: 2, rows: 2, slot: 'head', entries: ['spooky-pirate-hat', 'fhs-baseball-cap', 'fhs-football-helmet', 'fhs-hockey-helmet'] },
  { name: 'eyewear', collection: 'manga-profile-wardrobe-v1', cols: 3, rows: 2, slot: 'eyewear', entries: ['lab-goggles', 'round-glasses', 'sunglasses', 'hex-glasses', 'half-rim-glasses', 'spooky-pirate-eye-patch'] },
  ...atlases.filter(a => a.collection === 'manga-wardrobe-v2' && a.name.startsWith('headwear-')).map(a => ({ ...a, collection: 'manga-wardrobe-v2', slot: 'head' as const, indexOffset: 1 })),
]

const sprites = Object.fromEntries(PROFILE_WARDROBE_ATLASES.flatMap(atlas => atlas.entries.map((slug, index) => [slug, {
  slot: atlas.slot,
  sprite: { collection: atlas.collection, atlas: atlas.name, cols: atlas.cols, rows: atlas.rows, index: index + (atlas.indexOffset ?? 0) } satisfies MangaSprite,
}])))

export function profileItemSprite(item: AvatarItem): MangaSprite | undefined {
  const entry = Object.hasOwn(sprites, item.slug) ? sprites[item.slug] : undefined
  return entry?.slot === item.slot ? entry.sprite : undefined
}

export const PROFILE_HEAD_RECTS: Record<string, SpriteRect> = {
  'beanie': [128, 33, 144, 104],
  'grad-cap': [105, 15, 190, 150],
  'scholars-laurel': [140, 50, 120, 70],
  'space-helmet': [122, 42, 180, 172],
  'viking-helmet': [112, -8, 168, 215],
  'football-helmet': [108, 26, 176, 176],
  'spooky-witch-hat': [100, -5, 204, 156],
  'spooky-ghost-hood': [125, -5, 187, 232],
  'spooky-skull-mask': [117, 45, 156, 150],
  'spooky-pumpkin-mask': [126, 45, 150, 154],
  'spooky-mummy-mask': [126, 42, 144, 155],
  'spooky-werewolf-mask': [122, 18, 164, 190],
  'spooky-monster-mask': [136, 45, 156, 171],
  'spooky-scarecrow-mask': [104, 18, 170, 212],
  'spooky-cat-hood': [108, 40, 163, 186],
  'spooky-pirate-hat': [111, 0, 175, 146],
  'fhs-baseball-cap': [113, 30, 186, 119],
  'fhs-football-helmet': [116, 42, 184, 178],
  'fhs-hockey-helmet': [117, 36, 185, 185],
}

export const PROFILE_EYEWEAR_RECT: SpriteRect = [169, 77, 88, 83]

export const PROFILE_ITEM_INSETS: Record<string, readonly [number, number, number, number]> = {
  'beanie': [40, 0, 0, 0], 'scholars-laurel': [15, 0, 0, 0],
  'spooky-ghost-hood': [80, 12, 0, 0],
  "spooky-pumpkin-mask": [0,0,0,40],
  "spooky-mummy-mask": [0,0,0,55],
  "spooky-werewolf-mask": [0,0,0,35],
  "spooky-monster-mask": [0,80,0,0],
  "spooky-cat-hood": [75,0,0,0],
}

/** Correct the supplied side cutouts' direction without changing saved appearance. */
export const PROFILE_ITEM_MIRRORED = new Set(['beanie', 'spooky-witch-hat', 'spooky-ghost-hood'])
