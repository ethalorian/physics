'use client'
import { useEffect, useRef } from 'react'

/** Keep draft edits safe when navigating between connected assignments. */
export function useAssignmentLeaveGuard(dirty: boolean) {
  const changed = useRef(dirty)
  changed.current = dirty
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (changed.current) { event.preventDefault(); event.returnValue = '' } }
    const leave = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]')
      if (!changed.current || !link || link.target === '_blank' || event.ctrlKey || event.metaKey || link.href === window.location.href) return
      if (!window.confirm('You have unsaved assignment changes. Leave without saving them?')) { event.preventDefault(); event.stopPropagation() }
    }
    window.addEventListener('beforeunload', unload)
    document.addEventListener('click', leave, true)
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', leave, true) }
  }, [])
  return () => !changed.current || window.confirm('You have unsaved assignment changes. Leave without saving them?')
}
