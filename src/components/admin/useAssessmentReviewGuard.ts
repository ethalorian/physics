'use client'

import { useEffect, useRef } from 'react'

const pending = new Set<symbol>()
export const ASSESSMENT_SCOPE_CHANGE = 'assessment-scope-change'

/** Select controls do not trigger the link guards used by existing review forms. */
export function canChangeAssessmentScope() {
  return window.dispatchEvent(new Event(ASSESSMENT_SCOPE_CHANGE, { cancelable: true }))
}

export function confirmAssessmentReviewLeave() {
  return !pending.size || window.confirm('You have unsaved changes. Leave without saving them?')
}

export function useAssessmentReviewGuard(dirty: boolean) {
  const key = useRef(Symbol('review'))
  useEffect(() => {
    if (!dirty) return
    const id = key.current
    pending.add(id)
    // Several response editors can be dirty; the first registered editor asks once.
    const ownsGuard = () => pending.values().next().value === id
    const scope = (event: Event) => { if (ownsGuard() && !event.defaultPrevented && !confirmAssessmentReviewLeave()) event.preventDefault() }
    const click = (event: MouseEvent) => {
      if (!ownsGuard() || event.defaultPrevented || !(event.target instanceof Element) || !event.target.closest('a[href], [data-assessment-leave]')) return
      const link = event.target.closest('a[href]') as HTMLAnchorElement | null
      if (link && (link.target === '_blank' || link.hasAttribute('download') || event.metaKey || event.ctrlKey || event.shiftKey || link.getAttribute('href')?.startsWith('#'))) return
      if (!confirmAssessmentReviewLeave()) { event.preventDefault(); event.stopPropagation() }
    }
    const unload = (event: BeforeUnloadEvent) => { if (ownsGuard()) { event.preventDefault(); event.returnValue = '' } }
    document.addEventListener('click', click, true)
    window.addEventListener(ASSESSMENT_SCOPE_CHANGE, scope)
    window.addEventListener('beforeunload', unload)
    return () => { pending.delete(id); document.removeEventListener('click', click, true); window.removeEventListener(ASSESSMENT_SCOPE_CHANGE, scope); window.removeEventListener('beforeunload', unload) }
  }, [dirty])
}
