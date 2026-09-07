import { withDefaults, type AvatarTraits } from './types'
// Starting looks change only free traits. Students can adjust every detail.
export const STARTER_LOOKS: { name: string; traits: AvatarTraits }[] = [
  { name: 'Classic', traits: withDefaults({ shirt_style: 'polo', shirt_color: 'blue' }) },
  { name: 'Creative', traits: withDefaults({ skin: 'brown', hair_style: 'twists', hair_color: 'black', shirt_style: 'hoodie', shirt_color: 'teal', mouth: 'joy' }) },
  { name: 'Explorer', traits: withDefaults({ skin: 'olive', hair_style: 'wavy', hair_color: 'dark_brown', shirt_style: 'striped', shirt_color: 'green' }) },
  { name: 'Bright', traits: withDefaults({ skin: 'deep', hair_style: 'afro', hair_color: 'black', shirt_style: 'varsity', shirt_color: 'orange', eyes: 'wide' }) },
  { name: 'Calm', traits: withDefaults({ skin: 'light', hair_style: 'hijab', fabric_color: 'teal', shirt_style: 'polo', shirt_color: 'navy' }) },
  { name: 'Electric', traits: withDefaults({ skin: 'pale', hair_style: 'side_part', hair_color: 'purple', shirt_style: 'hoodie', shirt_color: 'charcoal', mouth: 'smirk' }) },
]
