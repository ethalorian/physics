import type { MeBundle } from '@/app/api/avatar/me/route'

export interface PortraitState { portrait: MeBundle | null; loaded: boolean; error: boolean }
export const EMPTY_PORTRAIT: PortraitState = { portrait: null, loaded: false, error: false }
export const AVATAR_CHANGED = 'avatar-updated'

/** One mounted identity owns this store. A cancelled response can never replace a newer portrait. */
export function createPortraitStore(request: typeof fetch = fetch) {
  let state = EMPTY_PORTRAIT
  let current: AbortController | null = null
  const listeners = new Set<() => void>()
  const publish = (next: PortraitState) => { state = next; listeners.forEach(listener => listener()) }
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    cancel: () => { current?.abort(); current = null },
    async refresh() {
      current?.abort()
      const controller = new AbortController()
      current = controller
      const timeout = setTimeout(() => controller.abort(), 10_000)
      try {
        const response = await request('/api/avatar/me', { signal: controller.signal, cache: 'no-store' })
        if (current !== controller) return
        if (response.status === 401 || response.status === 403) {
          publish({ portrait: null, loaded: true, error: true })
          return
        }
        if (!response.ok) throw new Error('Avatar unavailable')
        const bundle = await response.json() as MeBundle
        if (!Array.isArray(bundle.equipped_items) || typeof bundle.setup_completed !== 'boolean') throw new Error('Invalid avatar')
        if (current === controller && !controller.signal.aborted) publish({ portrait: bundle, loaded: true, error: false })
      } catch {
        if (current === controller) publish({ ...state, loaded: true, error: true })
      } finally { clearTimeout(timeout) }
    },
  }
}

/** Refresh this tab and other open classroom tabs without storing student data. */
export function announceAvatarChange() {
  window.dispatchEvent(new Event(AVATAR_CHANGED))
  try { localStorage.setItem(AVATAR_CHANGED, crypto.randomUUID()) } catch { /* Saving works with storage disabled. */ }
}
