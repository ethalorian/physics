import type { SkinTone, HairColor } from './types'

// Skin: `color` for face/neck/ears, `shadow` for the nose tint + freckles.
// Ladder runs from pale (#FAE4D1) to dark (#3F2516); shadow is roughly the
// same hue shifted ~15% darker so the nose and freckles read on every tone.
export const SKIN: Record<SkinTone, { color: string; shadow: string }> = {
  pale:  { color: '#FAE4D1', shadow: '#E8C5A3' },
  light: { color: '#EFD0AD', shadow: '#D8AF82' },
  tan:   { color: '#D9A179', shadow: '#B88665' },
  olive: { color: '#B68250', shadow: '#8E6334' },
  brown: { color: '#8B5A3C', shadow: '#71472F' },
  deep:  { color: '#6B3A21', shadow: '#502915' },
  dark:  { color: '#3F2516', shadow: '#28160A' },
}

// Hair: `main` is the visible hair fill, `dark` is used for the eyebrows so
// brow tone tracks hair tone naturally. White and gray have lighter darks so
// brows stay visible on pale skin without looking smeared.
export const HAIR: Record<HairColor, { main: string; dark: string }> = {
  black:  { main: '#1F1812', dark: '#0E0907' },
  brown:  { main: '#5B3A28', dark: '#3A2618' },
  blonde: { main: '#E0BC5C', dark: '#A78A2E' },
  red:    { main: '#C24A2A', dark: '#7E2A12' },
  gray:   { main: '#8E8B86', dark: '#5F5C58' },
  white:  { main: '#E8E5DE', dark: '#A8A5A0' },
  teal:   { main: '#3FA59B', dark: '#1E7570' },
}

// Default shirt tone — overridden when a body slot item is equipped.
export const DEFAULT_SHIRT = '#7B6BCB'  // app's lavender primary
