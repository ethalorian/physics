'use client'

import { useLayoutEffect } from 'react'
import { EXPERIENCE_HEADER, EXPERIENCE_MARKER, isExperienceControl } from '@/lib/experience'

// Preserve the identity of this page, even if another tab changes the cookie.
// Failed saves are never replayed after switching identities.
export default function ExperienceRequestBoundary() {
  useLayoutEffect(() => {
    const pageId = document.cookie.split('; ').find(c => c.startsWith(EXPERIENCE_MARKER + '='))?.split('=')[1] ?? null
    const original = window.fetch
    const wrapped: typeof fetch = async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input), window.location.href)
      const relevant = url.origin === window.location.origin && url.pathname.startsWith('/api/') && !isExperienceControl(url.pathname)
      let options = init
      if (relevant && pageId) {
        const headers = new Headers(input instanceof Request ? input.headers : undefined)
        new Headers(init?.headers).forEach((value, key) => headers.set(key, value))
        headers.set(EXPERIENCE_HEADER, pageId)
        options = { ...init, headers }
      }
      const response = await original(input, options)
      if (relevant && [403, 409].includes(response.status)) {
        const body = await response.clone().json().catch(() => null)
        if (body?.code?.startsWith('EXPERIENCE_')) window.dispatchEvent(new CustomEvent('experience-blocked', { detail: body.error }))
      }
      return response
    }
    window.fetch = wrapped
    const changed = (event: StorageEvent) => { if (event.key === 'experience-changed') window.location.reload() }
    const focused = () => {
      const currentId = document.cookie.split('; ').find(c => c.startsWith(EXPERIENCE_MARKER + '='))?.split('=')[1] ?? null
      if (currentId !== pageId) window.location.reload()
    }
    window.addEventListener('storage', changed)
    window.addEventListener('focus', focused)
    return () => { if (window.fetch === wrapped) window.fetch = original; window.removeEventListener('storage', changed); window.removeEventListener('focus', focused) }
  }, [])
  return null
}
