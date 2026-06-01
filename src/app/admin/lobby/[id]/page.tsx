"use client"

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, KeyRound, Shuffle, Play, Square, CheckCircle2, Clock, Trash2, Megaphone } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import EscapeDashboard from '@/components/lobby/EscapeDashboard'
import type { AvatarTraits, EquippedItems, AvatarItem } from '@/lib/avatar/types'

interface Member {
  user_id: string; name: string; email: string | null; group_id: string | null; word: string | null
  role: string | null
  builtOn: { who_alias: string; note: string } | null
  creditedBy: number
  piece: string | null
  joined_at: string; phrase_completed_at: string | null
  word_entries: { word: string; at: string }[]
  traits: AvatarTraits; equipped: EquippedItems
  artifact: { response: unknown; created_at: string } | null
}
interface Group { id: string; label: string; passphrase: string[] }
interface SessionRow {
  id: string; code: string; status: string; task_type: string
  grouping_mode: string; group_size: number; prompt: string | null
}

function artifactText(r: unknown): string {
  if (r && typeof r === 'object' && 'text' in r) return String((r as { text: unknown }).text ?? '')
  if (r && typeof r === 'object' && ('strokes' in r || 'built_on' in r)) return ''
  return r ? JSON.stringify(r) : ''
}

type StrokeShape = { color?: string; points?: { x: number; y: number }[] }
function hasStrokes(r: unknown): r is { strokes: StrokeShape[] } {
  return !!r && typeof r === 'object' && Array.isArray((r as { strokes?: unknown }).strokes)
}
function StrokesSvg({ strokes }: { strokes: StrokeShape[] }) {
  if (!strokes.length) return <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>[empty drawing]</span>
  return (
    <svg viewBox="0 0 640 360" style={{ width: '100%', maxWidth: 260, height: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }} role="img" aria-label="Student drawing">
      {strokes.map((s, i) => (
        <polyline key={i} points={(s.points ?? []).map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={s.color || 'var(--foreground)'} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  )
}

function GroupTimeline({ group, members, card }: { group: Group; members: Member[]; card: React.CSSProperties }) {
  const parse = (s: string) => Date.parse(s)
  const times: number[] = []
  members.forEach((m) => {
    times.push(parse(m.joined_at))
    m.word_entries.forEach((e) => times.push(parse(e.at)))
    if (m.phrase_completed_at) times.push(parse(m.phrase_completed_at))
  })
  const valid = times.filter((t) => !Number.isNaN(t))
  if (!valid.length) return null
  const t0 = Math.min(...valid)
  const t1 = Math.max(...valid)
  const span = Math.max(1, t1 - t0)
  const norm = (t: number) => `${((t - t0) / span) * 100}%`
  const elapsed = Math.round((t1 - t0) / 1000)

  return (
    <div className="rounded-xl border p-3" style={card}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">{group.label}</span>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{elapsed}s window</span>
      </div>
      <div className="grid gap-2">
        {members.map((m) => {
          const done = m.phrase_completed_at ? parse(m.phrase_completed_at) : null
          return (
            <div key={m.user_id} className="flex items-center gap-2">
              <span className="text-xs w-24 truncate" title={m.name}>{m.name}</span>
              <div className="relative flex-1 h-5 rounded" style={{ background: 'var(--muted)' }}>
                {m.word_entries.map((e, i) => {
                  const t = parse(e.at)
                  if (Number.isNaN(t)) return null
                  return (
                    <span key={i} title={`${e.word} · ${new Date(t).toLocaleTimeString()}`}
                      className="absolute top-1/2 rounded-full"
                      style={{ left: norm(t), width: 7, height: 7, marginLeft: -3, marginTop: -3, background: 'var(--primary)' }} />
                  )
                })}
                {done != null && (
                  <span title={`completed ${new Date(done).toLocaleTimeString()}`} className="absolute top-1/2"
                    style={{ left: norm(done), marginLeft: -7, marginTop: -7, color: 'var(--success)' }}>
                    <CheckCircle2 size={14} />
                  </span>
                )}
              </div>
              <span className="text-[11px] w-9 text-right" style={{ color: done ? 'var(--success)' : 'var(--muted-foreground)' }}>
                {done ? `${Math.round((done - t0) / 1000)}s` : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function LobbyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [session, setSession] = useState<SessionRow | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [avatarItems, setAvatarItems] = useState<AvatarItem[]>([])
  const [spotlight, setSpotlight] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const pickReporter = (gid: string, gm: Member[]) => {
    if (!gm.length) return
    const pick = gm[Math.floor(Math.random() * gm.length)]
    setSpotlight((s) => ({ ...s, [gid]: pick.user_id }))
  }

  const load = useCallback(() => {
    fetch(`/api/lobby/sessions/${id}`).then((r) => r.json()).then((d) => {
      if (d.session) setSession(d.session)
      setGroups(d.groups ?? [])
      setMembers(d.members ?? [])
      setAvatarItems(d.avatarItems ?? [])
    }).catch(() => {})
  }, [id])

  useEffect(() => {
    load()
    const t = setInterval(load, 4000) // live poll
    return () => clearInterval(t)
  }, [load])

  const act = async (fn: () => Promise<unknown>) => { setBusy(true); await fn().catch(() => {}); setBusy(false); load() }
  const formGroups = () => act(() => fetch(`/api/lobby/sessions/${id}/group`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }))
  const setStatus = (status: string) => act(() => fetch(`/api/lobby/sessions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }))
  const del = async () => {
    if (!window.confirm('Delete this lobby session? This permanently removes its groups and any student submissions.')) return
    await fetch(`/api/lobby/sessions/${id}`, { method: 'DELETE' }).catch(() => {})
    router.push('/admin/lobby')
  }
  const reassign = (user_id: string, to_group_id: string) => {
    if (!to_group_id) return
    return act(() => fetch(`/api/lobby/sessions/${id}/reassign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id, to_group_id }) }))
  }
  const moveSelect: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--muted-foreground)', fontSize: 11, borderRadius: 6, padding: '1px 4px' }

  const card: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--card)' }
  const ungrouped = members.filter((m) => !m.group_id)
  const btn = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--primary)' : 'transparent',
    color: active ? 'var(--primary-foreground)' : 'var(--foreground)',
    border: `1px solid var(--border)`, cursor: 'pointer',
  })

  return (
    <div className="max-w-4xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <Link href="/admin/lobby" className="text-sm inline-flex items-center gap-1 mb-3" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={14} /> All sessions
      </Link>

      {session && (
        <>
          <div className="rounded-2xl border p-5 mb-5 flex flex-wrap items-center gap-4 justify-between" style={card}>
            <div>
              <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>Lobby code</div>
              <div className="font-mono font-bold text-4xl tracking-[0.3em] flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                <KeyRound size={28} />{session.code}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {session.grouping_mode} · groups of {session.group_size} · {session.task_type} · <strong>{session.status}</strong>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={formGroups} disabled={busy} className="text-sm font-semibold rounded-lg px-3 py-2 inline-flex items-center gap-1.5" style={btn(true)}>
                <Shuffle size={15} /> {groups.length ? 'Re-shuffle' : 'Form groups'}
              </button>
              <button onClick={() => setStatus('open')} disabled={busy} className="text-sm rounded-lg px-3 py-2 inline-flex items-center gap-1.5" style={btn(session.status === 'open')}>
                <Play size={15} /> Open
              </button>
              <button onClick={() => setStatus('closed')} disabled={busy} className="text-sm rounded-lg px-3 py-2 inline-flex items-center gap-1.5" style={btn(session.status === 'closed')}>
                <Square size={15} /> Close
              </button>
              <button onClick={del} disabled={busy} className="text-sm rounded-lg px-3 py-2 inline-flex items-center gap-1.5"
                style={{ background: 'transparent', color: 'var(--destructive)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>

          {session.prompt && (
            <p className="text-sm mb-4 rounded-lg px-3 py-2" style={{ background: 'color-mix(in oklch, var(--primary) 8%, transparent)' }}>{session.prompt}</p>
          )}

          <div className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
            {members.length} in lobby
            {session.task_type !== 'escape' && <> · {members.filter((m) => m.phrase_completed_at).length} assembled phrase · {members.filter((m) => m.artifact).length} submitted</>}
          </div>

          {ungrouped.length > 0 && (
            <div className="rounded-xl border p-3 mb-4" style={card}>
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>Waiting to be grouped ({ungrouped.length})</div>
              <div className="flex flex-wrap gap-1.5">
                {ungrouped.map((m) => (
                  <span key={m.user_id} className="text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1" style={{ background: 'var(--muted)' }}>
                    {m.name}
                    {groups.length > 0 && (
                      <select value="" onChange={(e) => reassign(m.user_id, e.target.value)} style={moveSelect} title="Assign to group">
                        <option value="">→</option>
                        {groups.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {session.task_type === 'escape' && (
            <EscapeDashboard sessionId={id} members={members} avatarItems={avatarItems} card={card} />
          )}

          {session.task_type !== 'escape' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((g) => {
              const gm = members.filter((m) => m.group_id === g.id)
              return (
                <div key={g.id} className="rounded-xl border p-3" style={card}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{g.label}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                      {g.passphrase.join(' · ')}
                    </span>
                  </div>
                  <button onClick={() => pickReporter(g.id, gm)} disabled={gm.length === 0}
                    className="text-[11px] mb-2 rounded px-2 py-0.5 inline-flex items-center gap-1 disabled:opacity-40"
                    style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--primary)', cursor: 'pointer' }}>
                    <Megaphone size={12} /> Spotlight a reporter
                  </button>
                  <div className="grid gap-1.5">
                    {gm.map((m) => (
                      <div key={m.user_id} className="flex items-start justify-between gap-2 text-sm border-t pt-1.5"
                        style={{ borderColor: 'var(--border)', background: spotlight[g.id] === m.user_id ? 'color-mix(in oklch, var(--primary) 12%, transparent)' : undefined, borderRadius: spotlight[g.id] === m.user_id ? 6 : undefined }}>
                        <div className="flex items-start gap-2 min-w-0">
                          <div className="shrink-0 rounded-full overflow-hidden mt-0.5" style={{ width: 30, height: 30, background: 'var(--muted)' }}>
                            <Avatar traits={m.traits} equipped={m.equipped} items={avatarItems} size={30} crop="head" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {m.phrase_completed_at
                                ? <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                                : <Clock size={14} style={{ color: 'var(--muted-foreground)' }} />}
                              <span>{m.name}</span>
                              <span className="font-mono text-xs px-1.5 rounded" style={{ background: 'color-mix(in oklch, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>{m.word}</span>
                              {m.role && <span className="text-[10px] px-1.5 rounded-full" style={{ background: 'color-mix(in oklch, var(--reward) 16%, transparent)', color: 'var(--reward)' }}>{m.role}</span>}
                              {m.group_id && (
                                <span className="text-[10px] px-1.5 rounded-full" title="How many groupmates built on this student's idea"
                                  style={{ background: m.creditedBy > 0 ? 'color-mix(in oklch, var(--success) 16%, transparent)' : 'color-mix(in oklch, var(--destructive) 14%, transparent)', color: m.creditedBy > 0 ? 'var(--success)' : 'var(--destructive)' }}>
                                  credited ×{m.creditedBy}
                                </span>
                              )}
                              {spotlight[g.id] === m.user_id && (
                                <span className="text-[10px] px-1.5 rounded-full inline-flex items-center gap-0.5" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                                  <Megaphone size={10} /> on deck
                                </span>
                              )}
                            </div>
                            {m.email && <div className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>{m.email}</div>}
                            {m.piece && <div className="text-[11px] mt-0.5" style={{ color: 'var(--primary)' }}>piece: {m.piece}</div>}
                            {m.artifact && (hasStrokes(m.artifact.response) ? (
                              <div className="mt-1"><StrokesSvg strokes={m.artifact.response.strokes} /></div>
                            ) : artifactText(m.artifact.response) ? (
                              <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>“{artifactText(m.artifact.response).slice(0, 140)}”</div>
                            ) : null)}
                            {m.builtOn && (m.builtOn.who_alias || m.builtOn.note) && (
                              <div className="text-[11px] mt-0.5" style={{ color: 'var(--reward)' }}>↳ built on {m.builtOn.who_alias}: {m.builtOn.note.slice(0, 120)}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                            {m.word_entries.length}/{g.passphrase.length} words
                          </span>
                          {groups.length > 1 && (
                            <select value="" onChange={(e) => reassign(m.user_id, e.target.value)} style={moveSelect} title="Move to group">
                              <option value="">move…</option>
                              {groups.filter((o) => o.id !== g.id).map((o) => (
                                <option key={o.id} value={o.id}>{o.label}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          )}

          {session.task_type !== 'escape' && groups.length > 0 && members.some((m) => m.word_entries.length > 0) && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>Collaboration timeline</h2>
              <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
                Each dot is a word entered; the check marks when the full passphrase was assembled. Far-right or missing checks = who lagged.
              </p>
              <div className="grid gap-3">
                {groups.map((g) => (
                  <GroupTimeline key={g.id} group={g} members={members.filter((m) => m.group_id === g.id)} card={card} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
