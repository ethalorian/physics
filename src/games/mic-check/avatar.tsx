import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import Avatar from '@/components/avatar/Avatar'
import type { AvatarTraits, AvatarItem, EquippedItems } from '@/lib/avatar/types'
import { AVATAR_CHANGED, createPortraitStore } from '@/lib/avatar/portrait-store'

type Performer = { traits?: Partial<AvatarTraits> | null; equipped?: EquippedItems; equipped_items?: AvatarItem[]; alias?: string | null }
const roots = new Map<string, Root>()
const speakingNow = new Map<string, boolean>()
const guest: Performer = { traits: { skin: 'tan', hair_style: 'curls', hair_color: 'brown', shirt_color: 'lavender' } }
const performers: Record<string, Performer> = {
  coach: { traits: { skin: 'deep', face: 'round', hair_style: 'afro', hair_color: 'black', mouth: 'grin', shirt_color: 'teal' } },
  player: guest,
}
function render(id: string, speaking = false) {
  const element = document.getElementById(id + 'Avatar')
  if (!element) return
  if (!roots.has(id)) roots.set(id, createRoot(element))
  const p = performers[id]
  speakingNow.set(id, speaking)
  // Use the shared manga renderer, preserving equipped items and custom mouths.
  flushSync(() => roots.get(id)!.render(<Avatar traits={{ ...p.traits, ...(speaking ? { mouth: 'open' as const } : {}) }} equipped={p.equipped} items={p.equipped_items} size={240} decorative />))
}
const portraitStore = createPortraitStore()
portraitStore.subscribe(() => {
  const { portrait, loaded } = portraitStore.getSnapshot()
  if (!loaded) return
  const personal = Boolean(portrait?.setup_completed && portrait.traits)
  performers.player = personal && portrait ? portrait : guest
  render('player', speakingNow.get('player'))
  const name = document.getElementById('playerName'), status = document.getElementById('avatarStatus')
  if (name) name.textContent = personal ? portrait?.alias || 'YOU' : 'YOU'
  if (status) status.textContent = personal ? 'YOUR EQUIPPED AVATAR' : 'GUEST PERFORMER'
})
const refresh = () => { if (document.visibilityState === 'visible') void portraitStore.refresh() }
window.addEventListener(AVATAR_CHANGED, refresh)
window.addEventListener('focus', refresh)
window.addEventListener('storage', event => { if (event.key === AVATAR_CHANGED) refresh() })
document.addEventListener('visibilitychange', refresh)
const api = {
  render,
  async load() {
    render('coach'); render('player')
    await portraitStore.refresh()
    const data = portraitStore.getSnapshot().portrait
    return data?.setup_completed && data.traits ? { personal: true, alias: data.alias } : { personal: false }
  },
}
;(window as unknown as { MicCheckAvatar: typeof api }).MicCheckAvatar = api
