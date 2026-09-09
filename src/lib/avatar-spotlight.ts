import type { AvatarItem, AvatarTraits, EquippedItems } from '@/lib/avatar/types'

export interface SpotlightCard {
  id: string
  name: string
  traits: Partial<AvatarTraits>
  equipped: EquippedItems
  rank: number
  score: number
}
export interface AvatarSpotlightData {
  game: { slug: string; name: string } | null
  cards: SpotlightCard[]
  items: AvatarItem[]
  rankedPlayers: number
}

/** Shuffle without replacement; ranks are assigned before drawing cards. */
export function drawCards<T>(values: T[], count: number, random = Math.random): T[] {
  const shuffled = [...values]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count)
}
