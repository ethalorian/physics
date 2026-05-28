// Avatar trait + item types. Traits live in code (identity is bounded and
// stable); items live in avatar_items (extensible via the admin catalog).

export type SkinTone = 'pale' | 'tan' | 'brown'
export type FaceShape = 'round' | 'egg'
export type HairStyle = 'short' | 'ponytail' | 'curls' | 'bald'
export type HairColor = 'black' | 'brown'
export type EyeShape = 'small' | 'big'
export type BrowStyle = 'straight' | 'arched'
export type MouthStyle = 'smile' | 'grin'
export type NoseStyle = 'button' | 'broad'

export interface AvatarTraits {
  skin: SkinTone
  face: FaceShape
  hair_style: HairStyle
  hair_color: HairColor
  eyes: EyeShape
  brows: BrowStyle
  mouth: MouthStyle
  nose: NoseStyle
}

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
  brows: 'straight',
  mouth: 'smile',
  nose: 'button',
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
  brows: 'Brows',
  mouth: 'Mouth',
  nose: 'Nose',
}

export const TRAIT_OPTIONS: Record<keyof AvatarTraits, string[]> = {
  skin: ['pale', 'tan', 'brown'],
  face: ['round', 'egg'],
  hair_style: ['short', 'ponytail', 'curls', 'bald'],
  hair_color: ['black', 'brown'],
  eyes: ['small', 'big'],
  brows: ['straight', 'arched'],
  mouth: ['smile', 'grin'],
  nose: ['button', 'broad'],
}
