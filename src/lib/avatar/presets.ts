import { withDefaults, type AvatarTraits } from './types'
// Starting looks change only free traits. Students can adjust every detail.
export const STARTER_LOOKS: { name: string; traits: AvatarTraits }[] = [
  { name: 'Classic', traits: withDefaults({ shirt_style: 'polo', shirt_color: 'blue' }) },
  { name: 'Creative', traits: withDefaults({ skin: 'brown', face: 'egg', hair_style: 'twists', hair_color: 'black', shirt_style: 'hoodie', shirt_color: 'teal', eyes: 'wide', mouth: 'joy' }) },
  { name: 'Explorer', traits: withDefaults({ skin: 'olive', face: 'heart', hair_style: 'wavy', hair_color: 'dark_brown', shirt_style: 'striped', shirt_color: 'green', eyes: 'big' }) },
  { name: 'Bright', traits: withDefaults({ skin: 'deep', face: 'square', hair_style: 'afro', hair_color: 'black', shirt_style: 'varsity', shirt_color: 'orange', eyes: 'wide' }) },
  { name: 'Calm', traits: withDefaults({ skin: 'light', face: 'egg', hair_style: 'hijab', fabric_color: 'teal', shirt_style: 'polo', shirt_color: 'navy', eyes: 'big' }) },
  { name: 'Electric', traits: withDefaults({ skin: 'pale', face: 'square', hair_style: 'side_part', hair_color: 'purple', shirt_style: 'hoodie', shirt_color: 'charcoal', eyes: 'narrow', mouth: 'smirk' }) },
  { name: 'Comet', traits: withDefaults({ skin: 'tan', face: 'heart', hair_style: 'long', hair_color: 'auburn', shirt_style: 'striped', shirt_color: 'navy', eye_color: 'green', freckles: 'light' }) },
  { name: 'Navigator', traits: withDefaults({ skin: 'dark', face: 'egg', hair_style: 'locs', hair_color: 'black', shirt_style: 'tee', shirt_color: 'yellow', eyes: 'wide', mouth: 'grin' }) },
  { name: 'Sketchbook', traits: withDefaults({ skin: 'light', hair_style: 'bob', hair_color: 'red', shirt_style: 'tee', shirt_color: 'pink', eye_color: 'hazel', freckles: 'heavy' }) },
  { name: 'Momentum', traits: withDefaults({ skin: 'olive', face: 'square', hair_style: 'mohawk', hair_color: 'blue', shirt_style: 'varsity', shirt_color: 'teal', mouth: 'grin' }) },
  { name: 'Trailblazer', traits: withDefaults({ skin: 'tan', hair_style: 'braids', hair_color: 'dark_brown', shirt_style: 'hoodie', shirt_color: 'green', brows: 'bushy' }) },
  { name: 'Moonlight', traits: withDefaults({ skin: 'pale', face: 'heart', hair_style: 'bald', shirt_style: 'polo', shirt_color: 'purple', eye_color: 'gray', mouth: 'neutral' }) },
]
