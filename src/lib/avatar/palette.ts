import type { SkinTone, HairColor, FaceShape, EyeColor } from './types'

// Face geometry — extents of each face silhouette + a per-shape feature
// y-offset so the feature group (brows / eyes / nose / mouth / blush /
// freckles) sits visually centered on each shape rather than at fixed
// y-coordinates that only feel right on a round face.
//
// `topY` / `bottomY` describe the silhouette's vertical extent. Items in the
// HEAD slot (helmets, masks, hats) must cover the full vertical range across
// ALL shapes — author them assuming `topY = -60` (heart's crown) and
// `bottomY = 52` (egg's chin) so they don't expose the head on any face.
export interface FaceGeometry {
  rx: number
  ry: number
  cy: number
  topY: number
  bottomY: number
  featureYShift: number   // vertical offset for the feature group per shape
  // Horizontal scale for the feature cluster (brows / eyes / nose / mouth /
  // blush + eyewear + facial-hair items) so the eye/brow/cheek SPREAD tracks
  // each silhouette's width instead of clinging to round-face coordinates.
  // 1.0 = round (46-wide). Roughly the width ratio vs round, softened so the
  // shapes don't visibly squish; tune per shape if a face reads off.
  featureXScale: number
  // Horizontal scale for the HAIR trait (front + back) so the cap/silhouette
  // frames each head's width. Tracks the head outline more closely than the
  // inner feature cluster (hair IS the silhouette frame). Heart stays near 1
  // because its forehead/crown — where hair sits — is broad even though its
  // chin is narrow.
  hairXScale: number
}

export const FACE_GEO: Record<FaceShape, FaceGeometry> = {
  round:  { rx: 46, ry: 48, cy:  0, topY: -48, bottomY: 48, featureYShift:  0, featureXScale: 1.00, hairXScale: 1.00 },
  egg:    { rx: 42, ry: 50, cy:  2, topY: -48, bottomY: 52, featureYShift:  3, featureXScale: 0.94, hairXScale: 0.93 },
  square: { rx: 48, ry: 46, cy:  0, topY: -46, bottomY: 46, featureYShift: -1, featureXScale: 1.04, hairXScale: 1.05 },
  heart:  { rx: 42, ry: 52, cy: -6, topY: -58, bottomY: 46, featureYShift:  1, featureXScale: 0.95, hairXScale: 0.97 },
}

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

// Eye colour. For the dot-style eye shapes (small/big/narrow) this fills the
// whole eye, Mii-style; for 'wide' it tints only the iris (sclera stays
// white). 'black' is the legacy #1F1812 so pre-existing avatars are
// unchanged. All tones are kept dark enough to read on the palest skin.
export const EYE: Record<EyeColor, string> = {
  black:  '#1F1812',
  brown:  '#4A2E1C',
  hazel:  '#7A5B2E',
  green:  '#3E6B3A',
  blue:   '#2F5D8A',
  gray:   '#5E6168',
  violet: '#6B4FA0',
}

// Default shirt tone — overridden when a body slot item is equipped.
export const DEFAULT_SHIRT = '#7B6BCB'  // app's lavender primary
