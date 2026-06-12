// Avatar trait + item types. Traits live in code (identity is bounded and
// stable); items live in avatar_items (extensible via the admin catalog).

export type SkinTone = 'pale' | 'light' | 'tan' | 'olive' | 'brown' | 'deep' | 'dark'
export type FaceShape = 'round' | 'egg' | 'square' | 'heart'
export type HairStyle = 'short' | 'ponytail' | 'curls' | 'bald' | 'afro' | 'locs' | 'braids' | 'bun' | 'hijab' | 'long'
export type HairColor = 'black' | 'brown' | 'blonde' | 'red' | 'gray' | 'white' | 'teal'
export type EyeShape = 'small' | 'big' | 'narrow' | 'wide'
export type BrowStyle = 'straight' | 'arched' | 'bushy' | 'thin'
export type MouthStyle = 'smile' | 'grin' | 'neutral' | 'smirk'
export type NoseStyle = 'button' | 'broad' | 'narrow' | 'hook'
export type Freckles = 'none' | 'light' | 'heavy'
export type CheekBlush = 'none' | 'pink' | 'warm'
export type EyeColor = 'black' | 'brown' | 'hazel' | 'green' | 'blue' | 'gray' | 'violet'

// Parametric "knobs" — Nintendo-Mii-style quantized adjustments that multiply
// variance across every shape variant. Discrete steps (not numbers) so they
// flow through the same TRAIT_OPTIONS registry, server validation, and
// carousel UI as every other trait. Middle value = identity transform, so
// avatars saved before these existed render pixel-identical via withDefaults.
export type EyeSpacing = 'close' | 'normal' | 'wide'
export type EyeScale = 'small' | 'normal' | 'large'
export type EyeTilt = 'down' | 'level' | 'up'
export type BrowHeight = 'low' | 'normal' | 'high'
export type MouthWidth = 'narrow' | 'normal' | 'wide'

export interface AvatarTraits {
  skin: SkinTone
  face: FaceShape
  hair_style: HairStyle
  hair_color: HairColor
  eyes: EyeShape
  eye_color: EyeColor
  eye_spacing: EyeSpacing
  eye_scale: EyeScale
  eye_tilt: EyeTilt
  brows: BrowStyle
  brow_height: BrowHeight
  mouth: MouthStyle
  mouth_width: MouthWidth
  nose: NoseStyle
  freckles: Freckles
  cheek_blush: CheekBlush
}

// The geometry knobs live in a separate "Fine-tune" tab so the guided
// builder stays short (core identity only). Eye colour is identity, not a
// knob, so it stays in the core flow alongside skin and hair colour.
export const KNOB_TRAITS: (keyof AvatarTraits)[] = ['eye_spacing', 'eye_scale', 'eye_tilt', 'brow_height', 'mouth_width']

// Slot enum mirrors the avatar_items.slot check constraint exactly.
export type ItemSlot = 'eyewear' | 'head' | 'body' | 'pin' | 'background' | 'facial_hair'

export interface AvatarItem {
  slug: string
  slot: ItemSlot
  name: string
  cost_xp: number | null            // null = not purchasable (unlock-only)
  unlock_target_id: string | null
  unlock_min_level: number | null
  svg_layer: string                  // inner SVG markup (no <svg> wrapper)
  z_order: number
}

export type EquippedItems = Partial<Record<ItemSlot, string>>  // slot → item slug

// Sensible defaults so an avatar is renderable even before the trait-builder
// onboarding has been completed (e.g. legacy accounts).
export const DEFAULT_TRAITS: AvatarTraits = {
  skin: 'tan',
  face: 'round',
  hair_style: 'short',
  hair_color: 'brown',
  eyes: 'small',
  eye_color: 'black',
  eye_spacing: 'normal',
  eye_scale: 'normal',
  eye_tilt: 'level',
  brows: 'straight',
  brow_height: 'normal',
  mouth: 'smile',
  mouth_width: 'normal',
  nose: 'button',
  freckles: 'none',
  cheek_blush: 'none',
}

export function withDefaults(partial: Partial<AvatarTraits> | null | undefined): AvatarTraits {
  return { ...DEFAULT_TRAITS, ...(partial ?? {}) }
}

// Pretty labels — used by the trait-builder picker UI.
export const TRAIT_LABELS: Record<keyof AvatarTraits, string> = {
  skin: 'Skin',
  face: 'Face shape',
  hair_style: 'Hair style',
  hair_color: 'Hair colour',
  eyes: 'Eyes',
  eye_color: 'Eye colour',
  eye_spacing: 'Eye spacing',
  eye_scale: 'Eye size',
  eye_tilt: 'Eye tilt',
  brows: 'Brows',
  brow_height: 'Brow height',
  mouth: 'Mouth',
  mouth_width: 'Mouth width',
  nose: 'Nose',
  freckles: 'Freckles',
  cheek_blush: 'Cheek blush',
}

export const TRAIT_OPTIONS: Record<keyof AvatarTraits, string[]> = {
  skin: ['pale', 'light', 'tan', 'olive', 'brown', 'deep', 'dark'],
  face: ['round', 'egg', 'square', 'heart'],
  hair_style: ['short', 'ponytail', 'curls', 'bald', 'afro', 'locs', 'braids', 'bun', 'hijab', 'long'],
  hair_color: ['black', 'brown', 'blonde', 'red', 'gray', 'white', 'teal'],
  eyes: ['small', 'big', 'narrow', 'wide'],
  eye_color: ['black', 'brown', 'hazel', 'green', 'blue', 'gray', 'violet'],
  eye_spacing: ['close', 'normal', 'wide'],
  eye_scale: ['small', 'normal', 'large'],
  eye_tilt: ['down', 'level', 'up'],
  brows: ['straight', 'arched', 'bushy', 'thin'],
  brow_height: ['low', 'normal', 'high'],
  mouth: ['smile', 'grin', 'neutral', 'smirk'],
  mouth_width: ['narrow', 'normal', 'wide'],
  nose: ['button', 'broad', 'narrow', 'hook'],
  freckles: ['none', 'light', 'heavy'],
  cheek_blush: ['none', 'pink', 'warm'],
}
