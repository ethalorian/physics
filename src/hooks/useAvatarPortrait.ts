'use client'

import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { useSession } from 'next-auth/react'
import { AVATAR_CHANGED, createPortraitStore, EMPTY_PORTRAIT } from '@/lib/avatar/portrait-store'

/** Replace the entire store on account changes, including during render. No cross-account cache. */
export function useAvatarPortrait(enabled = true) {
  const { data: session, status } = useSession()
  const userId = status === 'authenticated' ? session?.user?.id : undefined
  const store = useMemo(() => ({ userId, ...createPortraitStore() }), [userId])
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, () => EMPTY_PORTRAIT)
  useEffect(() => {
    if (!enabled || !store.userId) return
    const refresh = () => { if (document.visibilityState === 'visible') void store.refresh() }
    const stored = (event: StorageEvent) => { if (event.key === AVATAR_CHANGED) refresh() }
    void store.refresh()
    window.addEventListener(AVATAR_CHANGED, refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', stored)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      store.cancel()
      window.removeEventListener(AVATAR_CHANGED, refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', stored)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [enabled, store])
  return enabled && userId ? state : { ...EMPTY_PORTRAIT, loaded: !enabled || status === 'unauthenticated' }
}
