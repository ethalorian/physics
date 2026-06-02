"use client"

import { useCallback, useEffect, useState } from 'react'
import { Lock, Unlock, Trophy, AlertTriangle, Clock, KeyRound, Users, Eye, EyeOff } from 'lucide-react'
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
  solvedCount: number
  groupSize: number
}
interface DashData {
  room: { title: string; lockCount: number; locks: { title: string; code: string }[]; lockTitles: string[] }
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
const short = (title: string | null) => title?.split('·').pop()?.trim() ?? (title ?? '')

export default function EscapeDashboard({
  sessionId, members, avatarItems, card,
}: {
  sessionId: string
  members: DashMember[]
  avatarItems: AvatarItem[]
  card: React.CSSProperties
}) {
  const [data, setData] = useState<DashData | null>(null)
  const [showCodes, setShowCodes] = useState(true)

  const load = useCallback(() => {
    fetch(`/api/lobby/sessions/${sessionId}/escape`)
      .then((r) => r.json())
      .then((d: DashData) => { if (d && d.room) setData(d) })
      .catch(() => {})
  }, [sessionId])
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t) }, [load])

  if (!data) return null

  const chip = (bg: string, fg: string, label: string) => (
    <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: bg, color: fg }}>{label}</span>
  )

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <h2 className="text-sm font-bold mr-1">{data.room.title} — live</h2>
        {chip('color-mix(in oklch, var(--success) 16%, transparent)', 'var(--success)', `${data.summary.finished}/${data.summary.total} escaped`)}
        {data.summary.stuck > 0 && chip('color-mix(in oklch, var(--destructive) 14%, transparent)', 'var(--destructive)', `${data.summary.stuck} stuck`)}
      </div>

      {/* Answer key — the code for each lock (teacher-only) */}
      <div className="rounded-xl border mb-3" style={card}>
        <button onClick={() => setShowCodes((s) => !s)} className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold" style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer' }}>
          <span className="inline-flex items-center gap-1.5"><KeyRound size={14} style={{ color: 'var(--primary)' }} /> Unlock codes (answer key)</span>
          {showCodes ? <EyeOff size={14} style={{ color: 'var(--muted-foreground)' }} /> : <Eye size={14} style={{ color: 'var(--muted-foreground)' }} />}
        </button>
        {showCodes && (
          <div className="px-3 pb-3 grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
            {data.room.locks.map((l, i) => (
              <div key={i} className="rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2" style={{ background: 'var(--muted)' }}>
                <span className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>{i + 1}. {short(l.title)}</span>
                <span className="font-mono font-bold text-sm" style={{ color: 'var(--primary)' }}>{l.code}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {data.groups.length === 0 ? (
        <div className="rounded-xl border p-4 text-sm" style={{ ...card, color: 'var(--muted-foreground)' }}>
          Form groups to start the room. Each group&apos;s lock progress shows up here live.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.groups.map((g) => {
            const gm = members.filter((m) => m.group_id === g.group_id)
            const stuck = !g.finished && g.wrongAttempts >= 3
            return (
              <div key={g.group_id} className="rounded-2xl border p-3" style={{
                ...card,
                borderColor: g.finished ? 'color-mix(in oklch, var(--success) 50%, var(--border))'
                  : stuck ? 'color-mix(in oklch, var(--destructive) 45%, var(--border))' : 'var(--border)',
                boxShadow: g.finished ? '0 0 0 1px color-mix(in oklch, var(--success) 30%, transparent)' : undefined,
              }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">{g.label}</span>
                  {g.finished ? (
                    <span className="text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold" style={{ background: 'color-mix(in oklch, var(--success) 18%, transparent)', color: 'var(--success)' }}>
                      <Trophy size={12} /> Escaped
                    </span>
                  ) : (
                    <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                      Lock {Math.min(g.stage + 1, g.lockCount)} of {g.lockCount}
                    </span>
                  )}
                </div>

                {/* lock strip */}
                <div className="flex items-center gap-2 mb-2.5">
                  {Array.from({ length: g.lockCount }).map((_, i) => {
                    const open = i < g.stage
                    const active = !g.finished && i === g.stage
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-full" style={{ height: 6, background: open ? 'var(--success)' : active ? 'var(--primary)' : 'var(--muted)' }} />
                        <span className="text-[9px] inline-flex items-center gap-0.5" style={{ color: open ? 'var(--success)' : active ? 'var(--primary)' : 'var(--muted-foreground)' }}>
                          {open ? <Unlock size={9} /> : <Lock size={9} />}{short(data.room.lockTitles[i])}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* current lock: how many members have entered the code */}
                {!g.finished && (
                  <div className="flex items-center gap-1.5 mb-2 text-xs">
                    <Users size={12} style={{ color: 'var(--primary)' }} />
                    {Array.from({ length: g.groupSize }).map((_, i) => (
                      <span key={i} className="rounded-full" style={{ width: 11, height: 11, background: i < g.solvedCount ? 'var(--primary)' : 'color-mix(in oklch, var(--primary) 22%, var(--muted))' }} />
                    ))}
                    <span className="font-semibold ml-0.5" style={{ color: g.solvedCount >= g.groupSize && g.groupSize > 0 ? 'var(--success)' : 'var(--muted-foreground)' }}>
                      {g.solvedCount}/{g.groupSize} entered this code
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {g.wrongAttempts > 0 ? (
                    <span className="inline-flex items-center gap-0.5" style={{ color: stuck ? 'var(--destructive)' : 'var(--muted-foreground)' }}>
                      <AlertTriangle size={11} /> {g.wrongAttempts} wrong
                    </span>
                  ) : <span />}
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
      )}
    </div>
  )
}
