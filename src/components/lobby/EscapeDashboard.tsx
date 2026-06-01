"use client"

import { useCallback, useEffect, useState } from 'react'
import { Lock, Unlock, Trophy, AlertTriangle, Clock } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import type { AvatarTraits, EquippedItems, AvatarItem } from '@/lib/avatar/types'

interface DashMember {
  user_id: string
  name: string
  group_id: string | null
  traits: AvatarTraits
  equipped: EquippedItems
}
interface GroupProgress {
  group_id: string
  label: string
  stage: number
  lockCount: number
  finished: boolean
  currentLockTitle: string | null
  fragmentCount: number
  wrongAttempts: number
  finishedAt: string | null
  lastAt: string | null
}
interface DashData {
  room: { title: string; lockTitles: string[]; lockCount: number }
  groups: GroupProgress[]
  summary: { total: number; finished: number; stuck: number }
}

function ago(iso: string | null): string {
  if (!iso) return '—'
  const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`
}

function shortLock(title: string | null): string {
  if (!title) return ''
  return title.split('·').pop()?.trim() ?? title
}

export default function EscapeDashboard({
  sessionId,
  members,
  avatarItems,
  card,
}: {
  sessionId: string
  members: DashMember[]
  avatarItems: AvatarItem[]
  card: React.CSSProperties
}) {
  const [data, setData] = useState<DashData | null>(null)

  const load = useCallback(() => {
    fetch(`/api/lobby/sessions/${sessionId}/escape`)
      .then((r) => r.json())
      .then((d: DashData) => { if (d && d.room) setData(d) })
      .catch(() => {})
  }, [sessionId])

  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t) }, [load])

  if (!data) return null

  if (data.groups.length === 0) {
    return (
      <div className="rounded-xl border p-4 text-sm" style={{ ...card, color: 'var(--muted-foreground)' }}>
        Form groups to start <span style={{ color: 'var(--foreground)' }}>{data.room.title}</span>. Each group&apos;s lock progress shows up here live.
      </div>
    )
  }

  const chip = (bg: string, fg: string, label: string) => (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: bg, color: fg }}>{label}</span>
  )

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <h2 className="text-sm font-semibold mr-1">{data.room.title} — live</h2>
        {chip('color-mix(in oklch, var(--success) 16%, transparent)', 'var(--success)', `${data.summary.finished}/${data.summary.total} escaped`)}
        {data.summary.stuck > 0 && chip('color-mix(in oklch, var(--destructive) 14%, transparent)', 'var(--destructive)', `${data.summary.stuck} stuck`)}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {data.groups.map((g) => {
          const gm = members.filter((m) => m.group_id === g.group_id)
          const stuck = !g.finished && g.wrongAttempts >= 3
          return (
            <div key={g.group_id} className="rounded-xl border p-3" style={{
              ...card,
              borderColor: g.finished ? 'color-mix(in oklch, var(--success) 45%, var(--border))'
                : stuck ? 'color-mix(in oklch, var(--destructive) 40%, var(--border))' : 'var(--border)',
            }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{g.label}</span>
                {g.finished ? (
                  <span className="text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium" style={{ background: 'color-mix(in oklch, var(--success) 16%, transparent)', color: 'var(--success)' }}>
                    <Trophy size={12} /> Escaped
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Lock {Math.min(g.stage + 1, g.lockCount)} of {g.lockCount}
                  </span>
                )}
              </div>

              {/* Lock progress strip */}
              <div className="flex items-center gap-2 mb-2">
                {Array.from({ length: g.lockCount }).map((_, i) => {
                  const open = i < g.stage
                  const active = !g.finished && i === g.stage
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full h-1.5 rounded-full" style={{
                        background: open ? 'var(--success)' : active ? 'var(--primary)' : 'var(--muted)',
                      }} />
                      <span className="text-[10px] inline-flex items-center gap-0.5" style={{ color: open ? 'var(--success)' : active ? 'var(--primary)' : 'var(--muted-foreground)' }}>
                        {open ? <Unlock size={10} /> : <Lock size={10} />}
                        {shortLock(data.room.lockTitles[i])}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between mb-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                <span className="inline-flex items-center gap-1">
                  {g.wrongAttempts > 0 && (
                    <span className="inline-flex items-center gap-0.5" style={{ color: stuck ? 'var(--destructive)' : 'var(--muted-foreground)' }}>
                      <AlertTriangle size={11} /> {g.wrongAttempts} wrong
                    </span>
                  )}
                </span>
                <span className="inline-flex items-center gap-1"><Clock size={11} /> {ago(g.finishedAt ?? g.lastAt)}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {gm.map((m) => (
                  <div key={m.user_id} className="flex items-center gap-1.5" title={m.name}>
                    <div className="rounded-full overflow-hidden" style={{ width: 24, height: 24, background: 'var(--muted)' }}>
                      <Avatar traits={m.traits} equipped={m.equipped} items={avatarItems} size={24} crop="head" />
                    </div>
                    <span className="text-xs">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
