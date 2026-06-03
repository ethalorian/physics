"use client"

import { useCallback, useEffect, useState } from 'react'
import { Lock, Unlock, Trophy, AlertTriangle, Clock, KeyRound, Users, Eye, EyeOff, Radio, Check, UserMinus, UserPlus } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import type { AvatarTraits, EquippedItems, AvatarItem } from '@/lib/avatar/types'

interface DashMember {
  user_id: string
  name: string
  group_id: string | null
  traits: AvatarTraits
  equipped: EquippedItems
}
interface MemberClue { user_id: string; ordinal: number; clue: string | null; solved: boolean }
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
  members: MemberClue[]
}
interface DashData {
  room: { id?: string; title: string; lockCount: number; accent?: string | null; locks: { title: string; code: string }[]; lockTitles: string[] }
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
const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) || n % 10 > 3 ? 0 : n % 10]}`

export default function EscapeDashboard({
  sessionId, members, avatarItems, card, groups = [], onMove, onRemove, ungrouped = [],
}: {
  sessionId: string
  members: DashMember[]
  avatarItems: AvatarItem[]
  card: React.CSSProperties
  groups?: { id: string; label: string }[]
  onMove?: (userId: string, toGroupId: string) => void
  onRemove?: (userId: string) => void
  ungrouped?: DashMember[]
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
  const accent = data.room.accent || 'var(--primary)'
  const byId = new Map(members.map((m) => [m.user_id, m]))

  const rankOf = new Map<string, number>()
  data.groups.filter((g) => g.finished)
    .sort((a, b) => Date.parse(a.finishedAt ?? '') - Date.parse(b.finishedAt ?? ''))
    .forEach((g, i) => rankOf.set(g.group_id, i + 1))

  const chip = (bg: string, fg: string, label: string) => (
    <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: bg, color: fg }}>{label}</span>
  )
  const moveSelect: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--muted-foreground)', fontSize: 10, borderRadius: 6, padding: '1px 4px', cursor: 'pointer' }

  return (
    <div>
      <div className="rounded-2xl px-4 py-3 mb-3 flex items-center justify-between flex-wrap gap-2" style={{ background: `linear-gradient(120deg, color-mix(in oklch, ${accent} 20%, var(--card)), var(--card))`, border: `1px solid color-mix(in oklch, ${accent} 40%, var(--border))` }}>
        <h2 className="text-base font-extrabold inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] px-2 py-0.5 rounded-full" style={{ background: `color-mix(in oklch, ${accent} 22%, transparent)`, color: accent }}><Radio size={11} /> Live</span>
          {data.room.title}
        </h2>
        <div className="flex items-center gap-2">
          {chip('color-mix(in oklch, var(--success) 18%, transparent)', 'var(--success)', `🏆 ${data.summary.finished}/${data.summary.total} escaped`)}
          {data.summary.stuck > 0 && chip('color-mix(in oklch, var(--destructive) 16%, transparent)', 'var(--destructive)', `⚠ ${data.summary.stuck} stuck`)}
        </div>
      </div>

      {/* late joiners / removed students waiting to be placed */}
      {ungrouped.length > 0 && (
        <div className="rounded-xl mb-3 p-3" style={{ background: 'color-mix(in oklch, var(--reward) 12%, transparent)', border: '1px solid color-mix(in oklch, var(--reward) 40%, var(--border))' }}>
          <div className="text-xs font-bold mb-2 inline-flex items-center gap-1.5" style={{ color: 'var(--reward)' }}>
            <UserPlus size={13} /> {ungrouped.length} waiting to be grouped — drop them into a team
          </div>
          <div className="flex flex-wrap gap-2">
            {ungrouped.map((m) => (
              <span key={m.user_id} className="inline-flex items-center gap-1.5 rounded-full pl-1 pr-1.5 py-0.5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <span className="rounded-full overflow-hidden" style={{ width: 20, height: 20, background: 'var(--muted)' }}>
                  <Avatar traits={m.traits} equipped={m.equipped} items={avatarItems} size={20} crop="head" />
                </span>
                <span className="text-xs font-medium">{m.name}</span>
                {groups.length > 0 && onMove && (
                  <select value="" onChange={(e) => { if (e.target.value) onMove(m.user_id, e.target.value) }} style={moveSelect} title="Assign to group" aria-label="Assign to group">
                    <option value="">→ group</option>
                    {groups.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* answer key */}
      <div className="rounded-xl border mb-3" style={card}>
        <button onClick={() => setShowCodes((s) => !s)} className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold" style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer' }}>
          <span className="inline-flex items-center gap-1.5"><KeyRound size={14} style={{ color: accent }} /> Unlock codes (answer key)</span>
          {showCodes ? <EyeOff size={14} style={{ color: 'var(--muted-foreground)' }} /> : <Eye size={14} style={{ color: 'var(--muted-foreground)' }} />}
        </button>
        {showCodes && (
          <div className="px-3 pb-3 grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
            {data.room.locks.map((l, i) => (
              <div key={i} className="rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2" style={{ background: `color-mix(in oklch, ${accent} 9%, var(--muted))` }}>
                <span className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>{i + 1}. {short(l.title)}</span>
                <span className="font-mono font-bold text-sm" style={{ color: accent }}>{l.code}</span>
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
            const stuck = !g.finished && g.wrongAttempts >= 3
            const rank = rankOf.get(g.group_id)
            return (
              <div key={g.group_id} className="rounded-2xl border p-3 relative overflow-hidden" style={{
                ...card,
                borderColor: g.finished ? 'color-mix(in oklch, var(--success) 55%, var(--border))'
                  : stuck ? 'color-mix(in oklch, var(--destructive) 45%, var(--border))'
                    : `color-mix(in oklch, ${accent} 30%, var(--border))`,
                boxShadow: g.finished ? '0 0 22px -8px var(--success)' : undefined,
              }}>
                {g.finished && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(120% 80% at 100% 0%, color-mix(in oklch, var(--success) 16%, transparent), transparent 55%)' }} />}
                <div className="relative flex items-center justify-between mb-2">
                  <span className="font-extrabold text-sm inline-flex items-center gap-1.5">
                    {g.label}
                    {rank && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: rank === 1 ? 'color-mix(in oklch, var(--reward) 22%, transparent)' : 'var(--muted)', color: rank === 1 ? 'var(--reward)' : 'var(--muted-foreground)' }}>{ordinal(rank)}</span>}
                  </span>
                  {g.finished ? (
                    <span className="text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold" style={{ background: 'color-mix(in oklch, var(--success) 18%, transparent)', color: 'var(--success)' }}><Trophy size={12} /> Escaped</span>
                  ) : (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `color-mix(in oklch, ${accent} 14%, transparent)`, color: accent }}>Lock {Math.min(g.stage + 1, g.lockCount)} of {g.lockCount}</span>
                  )}
                </div>

                {/* lock strip */}
                <div className="relative flex items-center gap-2 mb-2.5">
                  {Array.from({ length: g.lockCount }).map((_, i) => {
                    const open = i < g.stage
                    const active = !g.finished && i === g.stage
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-full" style={{ height: 6, background: open ? 'var(--success)' : active ? accent : 'var(--muted)' }} />
                        <span className="text-[9px] inline-flex items-center gap-0.5 font-semibold" style={{ color: open ? 'var(--success)' : active ? accent : 'var(--muted-foreground)' }}>
                          {open ? <Unlock size={9} /> : <Lock size={9} />}{short(data.room.lockTitles[i])}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {!g.finished && (
                  <div className="relative flex items-center gap-1.5 mb-2 text-xs">
                    <Users size={12} style={{ color: accent }} />
                    {Array.from({ length: g.groupSize }).map((_, i) => (
                      <span key={i} className="rounded-full" style={{ width: 11, height: 11, background: i < g.solvedCount ? accent : `color-mix(in oklch, ${accent} 22%, var(--muted))` }} />
                    ))}
                    <span className="font-bold ml-0.5" style={{ color: g.solvedCount >= g.groupSize && g.groupSize > 0 ? 'var(--success)' : 'var(--muted-foreground)' }}>{g.solvedCount}/{g.groupSize} entered this code</span>
                  </div>
                )}

                <div className="relative flex items-center justify-between mb-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {g.wrongAttempts > 0 ? (
                    <span className="inline-flex items-center gap-0.5" style={{ color: stuck ? 'var(--destructive)' : 'var(--muted-foreground)' }}><AlertTriangle size={11} /> {g.wrongAttempts} wrong</span>
                  ) : <span />}
                  <span className="inline-flex items-center gap-1"><Clock size={11} /> {ago(g.finishedAt ?? g.lastAt)}</span>
                </div>

                {/* members: who holds which clue + roster controls */}
                <div className="relative flex flex-col gap-1.5">
                  {g.members.map((mc) => {
                    const m = byId.get(mc.user_id)
                    return (
                      <div key={mc.user_id} className="flex items-start gap-2 rounded-lg px-2 py-1.5" style={{ background: mc.solved ? 'color-mix(in oklch, var(--success) 9%, transparent)' : 'var(--muted)' }}>
                        <div className="rounded-full overflow-hidden shrink-0 mt-0.5" style={{ width: 24, height: 24, background: 'var(--card)' }}>
                          {m ? <Avatar traits={m.traits} equipped={m.equipped} items={avatarItems} size={24} crop="head" /> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold truncate">{m?.name ?? 'Student'}</span>
                            {mc.solved && <Check size={12} style={{ color: 'var(--success)' }} />}
                          </div>
                          {mc.clue && (
                            <div className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                              <span className="font-semibold" style={{ color: accent }}>holds:</span> {mc.clue}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {groups.length > 1 && onMove && (
                            <select value="" onChange={(e) => { if (e.target.value) onMove(mc.user_id, e.target.value) }} style={moveSelect} title="Move to another group" aria-label="Move to another group">
                              <option value="">move…</option>
                              {groups.filter((o) => o.id !== g.group_id).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </select>
                          )}
                          {onRemove && (
                            <button onClick={() => onRemove(mc.user_id)} title="Remove from group" aria-label="Remove from group"
                              className="rounded-md grid place-items-center" style={{ width: 22, height: 22, border: '1px solid var(--border)', background: 'transparent', color: 'var(--destructive)', cursor: 'pointer' }}>
                              <UserMinus size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
