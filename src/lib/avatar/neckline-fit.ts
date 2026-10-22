import type { AvatarTraits } from './types'

/** Front collar aperture: sides, front edge, lowest point. The garment's front
 * rim stays visible; the painted empty interior behind it receives the neck. */
export type NecklineFit = readonly [left: number, right: number, sideY: number, frontY: number, vNeck?: boolean]
export const BASE_NECKLINES: Record<AvatarTraits['shirt_style'], NecklineFit> = {
  tee: [174, 226, 218, 230], polo: [177, 223, 215, 240, true],
  hoodie: [175, 225, 217, 229], striped: [173, 225, 210, 222], varsity: [179, 222, 207, 220],
}
export const OUTFIT_NECKLINES: Record<string, NecklineFit> = {
  'lab-coat': [185, 215, 199, 214],
  'denim-jacket': [181, 217, 194, 205],
  'cosmic-hoodie': [180, 223, 203, 225, true],
  'field-vest': [184, 215, 195, 224, true],
  'flight-suit': [182, 219, 208, 241, true],
  'midnight-vampire-dress': [182, 220, 201, 224],
  'dracula-cape': [190, 212, 207, 228, true],
  'night-bat-hoodie': [177, 229, 225, 242, true],
  'flash-suit': [184, 228, 207, 216],
  'batman-suit': [177, 226, 213, 223],
  'thor-suit': [179, 227, 220, 237, true],
  'spooky-witch-robe': [174, 230, 219, 241, true],
  'spooky-ghost-sheet': [174, 230, 224, 234],
  'spooky-skeleton-suit': [174, 228, 213, 237, true],
  'spooky-pumpkin-outfit': [176, 226, 215, 225],
  'spooky-mummy-wraps': [178, 233, 213, 224],
  'spooky-werewolf-shirt': [178, 229, 216, 229],
  'spooky-monster-jacket': [176, 227, 217, 232],
  'spooky-scarecrow-overalls': [172, 217, 215, 242, true],
  'spooky-cat-suit': [175, 230, 220, 246, true],
  'spooky-pirate-coat': [177, 226, 215, 237],
  'fhs-football-uniform': [176, 229, 207, 217],
  'fhs-basketball-uniform': [173, 228, 211, 222],
  'fhs-baseball-uniform': [177, 230, 224, 233],
  'fhs-softball-uniform': [178, 228, 225, 235],
  'fhs-soccer-uniform': [175, 231, 225, 236],
  'fhs-volleyball-uniform': [176, 231, 223, 234],
  'fhs-hockey-uniform': [175, 231, 186, 197],
  'fhs-track-uniform': [175, 230, 189, 200],
  'fhs-cross-country-uniform': [177, 232, 189, 200],
  'fhs-lacrosse-uniform': [173, 228, 184, 195],
  'fhs-tennis-uniform': [179, 227, 207, 220],
  'fhs-golf-uniform': [177, 224, 207, 220],
  'fhs-cheer-uniform': [179, 218, 201, 210],
  'fhs-varsity-jacket': [181, 226, 187, 199],
  'fhs-warmup-jacket': [181, 225, 187, 200],
}
export function necklinePath([left, right, side, bottom, vee]: NecklineFit): string {
  const center = (left + right) / 2
  return `M${left} 170H${right}V${side}${vee ? `L${center} ${bottom}L${left} ${side}` : `Q${center} ${2 * bottom - side} ${left} ${side}`}Z`
}
