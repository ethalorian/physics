"use client"

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, KeyRound, Shuffle, Play, Square, CheckCircle2, Clock } from 'lucide-react'

interface Member {
  user_id: string; name: string; group_id: string | null; word: string | null
  joined_at: string; phrase_completed_at: string | null
  word_entries: { word: string; at: string }[]
  artifact: { response: unknown; created_at: string } | null
}
interface Group { id: string; label: string; passphrase: string[] }
interface SessionRow {
  id: string; code: string; status: string; task_type: string
  grouping_mode: string; group_size: number; prompt: string | null
}

function artifactText(r: unknown): string {
  if (r && typeof r === 'object' && 'text' in r) return String((r as { text: unknown }).text ?? '')
  return r ? JSON.stringify(r) : ''
}

export default function LobbyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<SessionRow | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/lobby/sessions/${id}`).then((r) => r.json()).then((d) => {
      if (d.session) setSession(d.session)
      setGroups(d.groups ?? [])
      setMembers(d.members ?? [])
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
            </div>
          </div>

          {session.prompt && (
            <p className="text-sm mb-4 rounded-lg px-3 py-2" style={{ background: 'color-mix(in oklch, var(--primary) 8%, transparent)' }}>{session.prompt}</p>
          )}

          <div className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
            {members.length} in lobby · {members.filter((m) => m.phrase_completed_at).length} assembled phrase · {members.filter((m) => m.artifact).length} submitted
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
                  <div className="grid gap-1.5">
                    {gm.map((m) => (
                      <div key={m.user_id} className="flex items-start justify-between gap-2 text-sm border-t pt-1.5" style={{ borderColor: 'var(--border)' }}>
                        <div>
                          <div className="flex items-center gap-1.5">
                            {m.phrase_completed_at
                              ? <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                              : <Clock size={14} style={{ color: 'var(--muted-foreground)' }} />}
                            <span>{m.name}</span>
                            <span className="font-mono text-xs px-1.5 rounded" style={{ background: 'color-mix(in oklch, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>{m.word}</span>
                          </div>
                          {m.artifact && (
                            <div className="text-xs mt-0.5 pl-5" style={{ color: 'var(--muted-foreground)' }}>“{artifactText(m.artifact.response).slice(0, 140)}”</div>
                          )}
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
        </>
      )}
    </div>
  )
}
