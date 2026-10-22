import type { AvatarTraits } from './types'
import type { NecklineFit } from './neckline-fit'

/** All face traits and head accessories move together. A shirt's collar is the
 * attachment point; transparent atlas margins are not anatomical landmarks. */
export function headFit(neckline?: NecklineFit) {
  const shift = Math.max(-6, Math.min(22, (neckline?.[2] ?? 218) - 201))
  return {
    shift,
    jawY: 177 + shift,
    transform: `translate(200 ${177 + shift}) scale(.80 .86) translate(-200 -177)`,
  }
}

export type Cuffs = readonly [leftX: number, leftY: number, rightX: number, rightY: number]
export const BASE_CUFFS: Partial<Record<AvatarTraits['shirt_style'], Cuffs>> = {
  hoodie: [114, 425, 279, 427],
  striped: [119, 412, 280, 412],
  varsity: [120, 410, 278, 410],
}

/** Exposed arms start at the inner sleeve edge and stay in front of the torso.
 * A continuous clip avoids a separate skin sliver above an opaque cuff ellipse. */
export const BASE_EXPOSED_ARMS: Partial<Record<AvatarTraits['shirt_style'], readonly string[]>> = {
  tee: [
    'M96 315Q111 316 141 334L170 500H50Z',
    'M259 335Q283 316 299 314L350 500H230Z',
  ],
  polo: [
    'M105 314Q119 317 141 327L170 500H50Z',
    'M258 327Q278 315 292 312L350 500H230Z',
  ],
}

/** Wrist centers measured on the painted cuffs, including asymmetrical items.
 * Gloved/covered hands are part of the garment and never receive a skin layer. */
export const OUTFIT_CUFFS: Record<string, Cuffs | null> = {
  'lab-coat': [135, 420, 265, 420],
  'spiderman-suit': null,
  'denim-jacket': [136, 418, 264, 417],
  'cosmic-hoodie': [138, 422, 263, 422],
  'field-vest': [131, 416, 270, 417],
  'flight-suit': [139, 417, 261, 417],
  'midnight-vampire-dress': [139, 411, 261, 411],
  'dracula-cape': [148, 414, 251, 414],
  'night-bat-hoodie': [125, 431, 290, 434],
  'flash-suit': null,
  'batman-suit': null,
  'thor-suit': null,
  'spooky-witch-robe': null,
  'spooky-ghost-sheet': null,
  'spooky-skeleton-suit': [117, 401, 286, 401],
  'spooky-pumpkin-outfit': [116, 420, 279, 419],
  'spooky-mummy-wraps': [114, 392, 306, 392],
  'spooky-werewolf-shirt': [115, 394, 297, 392],
  'spooky-monster-jacket': [99, 396, 284, 394],
  'spooky-scarecrow-overalls': [98, 382, 286, 382],
  'spooky-cat-suit': [115, 406, 305, 407],
  'spooky-pirate-coat': [110, 404, 306, 404],
  'fhs-football-uniform': [112, 403, 299, 404],
  'fhs-basketball-uniform': [100, 400, 298, 400],
  'fhs-baseball-uniform': [116, 397, 306, 397],
  'fhs-softball-uniform': [118, 396, 300, 396],
  'fhs-soccer-uniform': [111, 394, 298, 394],
  'fhs-volleyball-uniform': [101, 397, 289, 397],
  'fhs-hockey-uniform': [114, 384, 310, 383],
  'fhs-track-uniform': [120, 354, 305, 354],
  'fhs-cross-country-uniform': [110, 360, 296, 360],
  'fhs-lacrosse-uniform': [101, 385, 292, 384],
  'fhs-tennis-uniform': null,
  'fhs-golf-uniform': null,
  'fhs-cheer-uniform': [90, 416, 302, 416],
  'fhs-varsity-jacket': [120, 409, 305, 409],
  'fhs-warmup-jacket': [115, 395, 298, 395],
}

export const PAINTED_HANDS = new Set(['flash-suit', 'batman-suit', 'thor-suit', 'spooky-witch-robe', 'spooky-ghost-sheet'])
export const BARE_ARM_OUTFITS = new Set(['fhs-tennis-uniform', 'fhs-golf-uniform'])
// All sports uniforms except tennis and golf include painted base-layer sleeves.
export function hasLongSleeves(shirt: AvatarTraits['shirt_style'], outfit?: string) {
  return outfit ? outfit !== 'spiderman-suit' && !BARE_ARM_OUTFITS.has(outfit) : ['hoodie', 'striped', 'varsity'].includes(shirt)
}

export const HELD_PROPS = new Set(['piccolo','batarang','mjolnir','spooky-broom','spooky-candy-bucket','spooky-cauldron','spooky-lantern'])
/** Position the point that the fingers grasp, not the prop's outer bounds. */
export const PROP_GRIPS: Record<string, readonly [number,number]> = {
  piccolo: [211,318], batarang: [289,457], mjolnir: [328,484],
  'spooky-broom': [295,420], 'spooky-candy-bucket': [281,458],
  'spooky-cauldron': [237,500], 'spooky-lantern': [279,445],
}
