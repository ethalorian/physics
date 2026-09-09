'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Heart } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import { Button } from '@/components/ui/button'
import type { AvatarItem } from '@/lib/avatar/types'
import type { GalleryAvatar } from '@/app/api/avatar/gallery/route'
interface Page { items: AvatarItem[]; avatars: GalleryAvatar[]; next_offset: number | null }
export default function AvatarGallery() {
  const [data, setData] = useState<Page | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<Set<string>>(new Set())
  const locks = useRef(new Set<string>())
  const mounted = useRef(true)
  const load = useCallback(async (offset = 0) => {
    setLoading(true); setError('')
    try {
      const r = await fetch(`/api/avatar/gallery?offset=${offset}`)
      const d = await r.json()
      if (!r.ok || !Array.isArray(d.avatars) || !Array.isArray(d.items)) throw new Error(d.error ?? 'Could not load the gallery.')
      if (mounted.current) setData(p => offset && p ? { ...d, avatars: [...new Map([...p.avatars, ...d.avatars].map(a => [a.user_id, a])).values()], items: [...new Map([...p.items, ...d.items].map(i => [i.slug, i])).values()] } : d)
    } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'Could not load the gallery.') }
    finally { if (mounted.current) setLoading(false) }
  }, [])
  useEffect(() => { mounted.current = true; void load(); return () => { mounted.current = false } }, [load])
  const like = async (a: GalleryAvatar) => {
    if (a.is_me || locks.current.has(a.user_id)) return
    locks.current.add(a.user_id); setPending(new Set(locks.current)); setError('')
    try {
      const r = await fetch('/api/avatar/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_user_id: a.user_id, liked: !a.liked_by_me }) })
      const d = await r.json()
      if (!r.ok || typeof d.liked !== 'boolean') throw new Error(d.error ?? 'Could not save appreciation.')
      setData(p => p ? { ...p, avatars: p.avatars.map(x => x.user_id === a.user_id ? { ...x, liked_by_me: d.liked } : x) } : p)
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.') }
    finally { locks.current.delete(a.user_id); setPending(new Set(locks.current)) }
  }
  return <section aria-label="Class avatar gallery" className="space-y-4">
    <p className="text-sm text-muted-foreground">Avatars from your classes. Only you see your appreciation total.</p>
    {error && <div role="alert" className="rounded-xl border p-3 text-sm">{error} <Button variant="outline" onClick={() => load(data?.next_offset ?? 0)}>Retry</Button></div>}
    {!data && loading && <p role="status">Loading the gallery…</p>}
    {data?.avatars.length === 0 && <p className="rounded-xl border p-6 text-sm text-muted-foreground">No completed avatars in your classes yet. Saved avatars appear here automatically.</p>}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {data?.avatars.map(a => <div key={a.user_id} className="flex flex-col items-center rounded-xl border bg-card p-3">
        <Avatar traits={a.traits} equipped={a.equipped} items={data.items} size={104} crop="medium" decorative />
        <p className="w-full truncate text-center text-sm font-semibold">{a.name}{a.is_me ? ' (you)' : ''}</p>
        {a.is_me ? <p className="mt-2 text-xs text-muted-foreground">{a.likes ?? 0} appreciations · only you</p> : <Button variant="ghost" className="mt-1 min-h-11" disabled={pending.has(a.user_id)} aria-pressed={a.liked_by_me} aria-label={`${a.liked_by_me ? 'Remove appreciation for' : 'Appreciate'} ${a.name}`} onClick={() => like(a)}><Heart size={16} fill={a.liked_by_me ? 'currentColor' : 'none'} />{a.liked_by_me ? 'Appreciated' : 'Appreciate'}</Button>}
      </div>)}
    </div>
    {data?.next_offset != null && <Button variant="outline" disabled={loading} onClick={() => load(data.next_offset!)}>{loading ? 'Loading…' : 'Load more'}</Button>}
  </section>
}
