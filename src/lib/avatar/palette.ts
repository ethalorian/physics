import type { SkinTone, HairColor } from './types'

// Skin: `color` for face/neck/ears, `shadow` for the nose tint.
export const SKIN: Record<SkinTone, { color: string; shadow: string }> = {
  pale: { color: '#FAE4D1', shadow: '#E8C5A3' },
  tan:  { color: '#D9A179', shadow: '#B88665' },
  brown:{ color: '#8B5A3C', shadow: '#71472F' },
}

// Hair: `main` is the visible hair fill, `dark` is used for the eyebrows so
// brow tone tracks hair tone naturally.
export const HAIR: Record<HairColor, { main: string; dark: string }> = {
  black: { main: '#1F1812', dark: '#0E0907' },
  brown: { main: '#5B3A28', dark: '#3A2618' },
}

// Default shirt tone — overridden when a body slot item is equipped.
export const DEFAULT_SHIRT = '#7B6BCB'  // app's lavender primary
