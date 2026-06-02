"use client"

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import type { AvatarItem } from '@/lib/avatar/types'

/**
 * The whole-class avatar wall. Hearts are appreciation, NOT a ranking — there
 * is deliberately no "most liked" board (a popularity contest is the wrong
 * thing to put in front of teenagers). Everyone is shown in neutral order; you
 * can heart anyone but yourself, and you see each avatar's total hearts.
 *
 * Reused on the avatar page and the leaderboard.
 */
interface GalleryAvatar {
  user_id: string
  name: string
  traits: Record<string, string>
  equipped: Record<string, string>
  likes: number
  liked_by_me: boolean
  is_me: boolean
}

export default function AvatarGallery() {
  const [data, setData] = useState<{ items: AvatarItem[]; avatars: GalleryAvatar[] } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/avatar/gallery')
      .then((r) => r.json())
      .then((d) => setData({ items: d.items ?? [], avatars: d.avatars ?? [] }))
      .catch(() => setData({ items: [], avatars: [] }))
  }, [])

  const like = async (a: GalleryAvatar) => {
    if (a.is_me) return
    setBusy(a.user_id)
    const res = await fetch('/api/avatar/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: a.user_id }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
    setBusy(null)
    if (res && data) {
      setData({
        ...data,
        avatars: data.avatars.map((x) =>
          x.user_id === a.user_id ? { ...x, likes: res.count, liked_by_me: res.liked } : x,
        ),
      })
    }
  }

  if (!data) {
    return <div className="text-sm py-8 text-center text-muted-foreground">Loading the gallery…</div>
  }
  if (data.avatars.length === 0) {
    return (
      <div className="rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">
        No avatars on the wall yet — build your Mii and turn on “Show my Mii” to be the first.
      </div>
    )
  }

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(116px, 1fr))' }}>
      {data.avatars.map((a) => (
        <div
          key={a.user_id}
          className="rounded-xl border p-2 flex flex-col items-center bg-card"
          style={{ borderColor: a.is_me ? 'var(--primary)' : 'var(--border)' }}
        >
          <Avatar traits={a.traits} equipped={a.equipped} items={data.items} size={104} crop="medium" />
          <div className="text-xs font-semibold mt-1 text-center w-full truncate">
            {a.name}{a.is_me ? ' (you)' : ''}
          </div>
          <button
            onClick={() => like(a)}
            disabled={a.is_me || busy === a.user_id}
            aria-label={a.is_me ? 'Your avatar' : a.liked_by_me ? `Unlike ${a.name}` : `Like ${a.name}`}
            className="mt-1 inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1 transition-transform active:scale-95"
            style={{
              border: '1px solid var(--border)',
              background: a.liked_by_me ? 'color-mix(in oklch, var(--destructive) 14%, var(--card))' : 'var(--card)',
              color: a.liked_by_me ? 'var(--destructive)' : 'var(--muted-foreground)',
              cursor: a.is_me ? 'default' : 'pointer',
              opacity: a.is_me ? 0.55 : 1,
            }}
          >
            <Heart size={12} style={{ fill: a.liked_by_me ? 'currentColor' : 'none' }} /> {a.likes}
          </button>
        </div>
      ))}
    </div>
  )
}
