import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import Avatar from '@/components/avatar/Avatar'
import type { AvatarTraits, AvatarItem, EquippedItems } from '@/lib/avatar/types'

type Performer = { traits?: Partial<AvatarTraits> | null; equipped?: EquippedItems; equipped_items?: AvatarItem[]; alias?: string | null }
const roots = new Map<string, Root>()
const performers: Record<string, Performer> = {
  coach: { traits: { skin: 'deep', face: 'round', hair_style: 'afro', hair_color: 'black', mouth: 'grin', shirt_color: 'teal' } },
  player: { traits: { skin: 'tan', hair_style: 'curls', hair_color: 'brown', shirt_color: 'lavender' } },
}
function render(id: string, speaking = false) {
  const element = document.getElementById(id + 'Avatar')
  if (!element) return
  if (!roots.has(id)) roots.set(id, createRoot(element))
  const p = performers[id]
  // Keep the existing appearance and equipped SVG layers, including custom mouths.
  flushSync(() => roots.get(id)!.render(<Avatar traits={{ ...p.traits, ...(speaking ? { mouth: 'open' as const } : {}) }} equipped={p.equipped} items={p.equipped_items} size={240} decorative />))
}
const api = {
  render,
  async load() {
    render('coach'); render('player')
    try {
      const response = await fetch('/api/avatar/me', { credentials: 'same-origin' })
      if (!response.ok) return { personal: false }
      const data = await response.json() as Performer & { setup_completed?: boolean }
      if (data.setup_completed && data.traits) { performers.player = data; render('player'); return { personal: true, alias: data.alias } }
      return { personal: false }
    } catch { return { personal: false } }
  },
}
;(window as unknown as { MicCheckAvatar: typeof api }).MicCheckAvatar = api
