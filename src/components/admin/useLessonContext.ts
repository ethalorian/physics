'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

type Selection = { classId: string; lessonId: string }
const empty: Selection = { classId: '', lessonId: '' }
/** Account-scoped preferences are hints only. Each destination validates its scope. */
export function useLessonContext() {
  const { data } = useSession()
  const key = data?.user?.email ? `lesson-workspace:${data.user.email}` : null
  const [selection, setSelection] = useState(empty)
  const [loadedKey,setLoadedKey] = useState<string|null>(null)
  useEffect(() => {
    if (!key) return
    const sync = (event?:Event) => {
      let saved = empty
      try { saved = JSON.parse(localStorage.getItem(key) ?? 'null') ?? empty } catch { /* URL still works. */ }
      const params = new URLSearchParams(event?.type==='lesson-context'?'':window.location.search)
      setSelection({ classId: params.get('class') ?? params.get('course') ?? saved.classId ?? '', lessonId: params.get('lesson') ?? saved.lessonId ?? '' })
    }
    sync(); setLoadedKey(key); window.addEventListener('lesson-context', sync); window.addEventListener('popstate', sync)
    return () => { window.removeEventListener('lesson-context', sync); window.removeEventListener('popstate', sync) }
  }, [key])
  function remember(next: Selection) {
    setSelection(next)
    if (key) { try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* Optional preference. */ } }
    window.dispatchEvent(new Event('lesson-context'))
  }
  return { ...selection, remember, ready: Boolean(key && loadedKey===key) }
}
