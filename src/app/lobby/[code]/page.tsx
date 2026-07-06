"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Hourglass, Lock, Unlock, CheckCircle2, Send, Target } from 'lucide-react'
import PaintPad from '@/components/blocks/PaintPad'
import type { Stroke } from '@/components/blocks/DoodleCanvas'
import Avatar from '@/components/avatar/Avatar'
import EscapeRoom from '@/components/lobby/EscapeRoom'
import type { AvatarTraits, EquippedItems, AvatarItem } from '@/lib/avatar/types'

interface AvatarBundle { alias: string; traits: AvatarTraits; equipped: EquippedItems }
interface GroupMate extends AvatarBundle { completed: boolean; isMe: boolean; role?: string; idx?: number }
interface RoomMate { alias: string; isMe: boolean }
interface Role { label: string; blurb: string; stem: string }

interface State {
  session_id: string; status: string; task_type: string; prompt: string | null
  joined: boolean; grouped: boolean; word: string | null
  phraseLength: number; enteredWords: string[]; completed: boolean; submitted: boolean
  self?: AvatarBundle; group?: GroupMate[]; room?: RoomMate[]; avatarItems?: AvatarItem[]
  myRole?: Role | null; talkMoves?: string[]
  myPiece?: string | null; jigsawCount?: number
}

// "MG"-style initials for the who's-in-the-room chips.
function initialsOf(alias: string): string {
  const parts = alias.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// One join/leave line derived by diffing successive poll results.
function presenceDiff(prev: string[], next: string[]): string | null {
  const joined = next.filter((n) => !prev.includes(n))
  const left = prev.filter((n) => !next.includes(n))
  if (joined.length > 0) {
    return joined.length === 1 ? `${joined[0]} joined` : `${joined[0]} and ${joined.length - 1} other${joined.length > 2 ? 's' : ''} joined`
  }
  if (left.length > 0) {
    return left.length === 1 ? `${left[0]} left` : `${left[0]} and ${left.length - 1} other${left.length > 2 ? 's' : ''} left`
  }
  return null
}

export default function LobbyActivityPage() {
  const { code } = useParams<{ code: string }>()
  const [st, setSt] = useState<State | null>(null)
  const [collected, setCollected] = useState<string[]>([])
  const [wordInput, setWordInput] = useState('')
  const [response, setResponse] = useState('')
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [buildWho, setBuildWho] = useState('')
  const [buildNote, setBuildNote] = useState('')
  const [missing, setMissing] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const sessionId = useRef<string | null>(null)
  // Liveness: `tick` bumps once per successful poll (drives the one-shot pulse),
  // `conn` flips to reconnecting when a poll fails so the wait never goes silent.
  const [tick, setTick] = useState(0)
  const [conn, setConn] = useState<'connecting' | 'live' | 'reconnecting'>('connecting')
  // Presence events, derived by diffing successive poll rosters client-side.
  const [presenceMsg, setPresenceMsg] = useState<string | null>(null)
  const prevRoom = useRef<string[] | null>(null)
  const presenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const poll = useCallback(() => {
    fetch(`/api/lobby/join?code=${code}`).then((r) => r.json()).then((d: State) => {
      if (d.session_id) {
        setSt(d)
        sessionId.current = d.session_id
        setCollected((prev) => Array.from(new Set([...prev, ...(d.enteredWords ?? [])])))
        setConn('live')
        setTick((t) => t + 1) // data arrived — pulse once
        const names = (d.room ?? []).map((m) => m.alias)
        if (prevRoom.current) {
          const msg = presenceDiff(prevRoom.current, names)
          if (msg) {
            setPresenceMsg(msg)
            if (presenceTimer.current) clearTimeout(presenceTimer.current)
            presenceTimer.current = setTimeout(() => setPresenceMsg(null), 4000)
          }
        }
        prevRoom.current = names
      } else {
        setConn('reconnecting')
      }
    }).catch(() => setConn('reconnecting'))
  }, [code])

  useEffect(() => {
    poll()
    const t = setInterval(poll, 3000)
    return () => {
      clearInterval(t)
      if (presenceTimer.current) clearTimeout(presenceTimer.current)
    }
  }, [poll])

  const addWord = async () => {
    const w = wordInput.trim().toLowerCase()
    if (!w || !sessionId.current) return
    const next = Array.from(new Set([...collected, w]))
    setCollected(next); setWordInput('')
    const r = await fetch('/api/lobby/progress', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId.current, entered: next }),
    })
    const d = await r.json().catch(() => ({}))
    if (typeof d.missing === 'number') setMissing(d.missing)
    if (d.completed) poll()
  }

  const isDrawing = st?.task_type === 'drawing'

  const submit = async () => {
    if (!sessionId.current) return
    setBusy(true)
    const mate = st?.group?.find((g) => String(g.idx) === buildWho)
    const built_on = mate ? { who_idx: mate.idx, who_alias: mate.alias, note: buildNote.trim() } : undefined
    const payload = isDrawing ? { strokes, built_on } : { text: response, built_on }
    await fetch('/api/lobby/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId.current, response: payload }),
    }).catch(() => {})
    setBusy(false); poll()
  }

  const card: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--card)' }
  const wrap = (inner: React.ReactNode) => (
    <div className="max-w-md mx-auto p-5 mt-8" style={{ color: 'var(--foreground)' }}>
      {/* One-shot animations only — the pulse re-runs per poll tick (keyed), never
          idles, and the global prefers-reduced-motion rule collapses both. */}
      <style>{`
        @keyframes lobby-pulse { 0% { transform: scale(0.6); box-shadow: 0 0 0 0 color-mix(in oklch, var(--success) 45%, transparent); } 100% { transform: scale(1); box-shadow: 0 0 0 6px transparent; } }
        @keyframes lobby-fade-in { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }
      `}</style>
      <div className="rounded-2xl border p-6" style={card}>{inner}</div>
    </div>
  )
  const renderAv = (b: { traits: AvatarTraits; equipped: EquippedItems }, size = 44) => (
    <Avatar traits={b.traits} equipped={b.equipped} items={st?.avatarItems} size={size} crop="head" />
  )
  // Connected pulse: the dot re-mounts on every successful poll (key={tick}),
  // firing one ≤300ms pulse per data arrival. Amber when the poll stalls.
  const liveStatus = (
    <div className="flex items-center justify-center gap-1.5 mb-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
      <span
        key={tick}
        aria-hidden
        style={{
          width: 7, height: 7, borderRadius: 999, flexShrink: 0,
          background: conn === 'live' ? 'var(--success)' : 'var(--reward)',
          animation: conn === 'live' && tick > 0 ? 'lobby-pulse 300ms cubic-bezier(0.16, 1, 0.3, 1)' : undefined,
        }}
      />
      <span>{conn === 'live' ? 'Live · connected' : conn === 'reconnecting' ? 'Reconnecting…' : 'Connecting…'}</span>
      {presenceMsg && (
        <span style={{ color: 'var(--foreground)', fontWeight: 500, animation: 'lobby-fade-in 240ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
          · {presenceMsg}
        </span>
      )}
    </div>
  )
  const selfHeader = st?.self && (
    <div className="flex items-center justify-center gap-2 mb-3">
      {renderAv(st.self, 36)}
      <span className="text-sm font-semibold">{st.self.alias}</span>
      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'color-mix(in oklch, var(--primary) 14%, transparent)', color: 'var(--primary)' }}>you</span>
    </div>
  )
  // Escape sessions store their room config (JSON) in `prompt`; never show it as a task.
  const taskCallout = st?.prompt && st.task_type !== 'escape' ? (
    <div className="mb-4 rounded-xl p-4 text-left" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ opacity: 0.85 }}>
        <Target size={13} /> Your task
      </div>
      <div className="text-base font-semibold" style={{ lineHeight: 1.35 }}>{st.prompt}</div>
    </div>
  ) : null

  if (!st) return wrap(<p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>)
  if (st.status === 'closed' && !st.submitted) return wrap(<p className="text-sm">This lobby is closed.</p>)

  if (st.submitted) return wrap(
    <div className="text-center">
      <CheckCircle2 size={40} style={{ color: 'var(--success)' }} className="mx-auto mb-2" />
      <h1 className="text-lg font-semibold">Submitted!</h1>
      <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Your work is in. You can close this page.</p>
    </div>
  )

  if (!st.grouped) return wrap(
    <div className="text-center">
      {liveStatus}
      {selfHeader}
      {taskCallout}
      <Hourglass size={36} style={{ color: 'var(--primary)' }} className="mx-auto mb-2" />
      <h1 className="text-lg font-semibold">You&apos;re in the lobby</h1>
      <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
        Waiting for your teacher to make groups — you&apos;ll be moved automatically.
      </p>
      {st.room && st.room.length > 0 && (
        <div className="mt-5">
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
            {st.room.length} in the room
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {st.room.slice(0, 24).map((m, i) => (
              <span
                key={`${m.alias}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs"
                style={{
                  borderColor: m.isMe ? 'color-mix(in oklch, var(--primary) 45%, var(--border))' : 'var(--border)',
                  background: 'var(--card)', color: 'var(--foreground)',
                }}
              >
                <span
                  aria-hidden
                  className="grid place-items-center rounded-full font-semibold"
                  style={{ width: 18, height: 18, fontSize: 10, background: 'color-mix(in oklch, var(--primary) 14%, transparent)', color: 'var(--primary)' }}
                >
                  {initialsOf(m.alias)}
                </span>
                <span>{m.alias}{m.isMe ? ' (you)' : ''}</span>
              </span>
            ))}
            {st.room.length > 24 && (
              <span className="text-xs px-2 py-1" style={{ color: 'var(--muted-foreground)' }}>+{st.room.length - 24} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  )

  // Escape rooms run their own multi-lock flow once grouped.
  if (st.task_type === 'escape') {
    return <EscapeRoom sessionId={st.session_id} group={st.group} avatarItems={st.avatarItems} myRole={st.myRole} />
  }

  // Grouped. Show the word + the gate, or the artifact form once completed.
  const need = st.phraseLength
  const blanks = Math.max(0, need - 1)

  return wrap(
    <div>
      {liveStatus}
      {taskCallout}

      {st.myRole && (
        <div className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ background: 'color-mix(in oklch, var(--reward) 14%, transparent)', borderLeft: '3px solid var(--reward)' }}>
          <span className="font-semibold">Your role: {st.myRole.label}</span>
          <span style={{ color: 'var(--muted-foreground)' }}> — {st.myRole.blurb}</span>
        </div>
      )}

      {st.myPiece && (
        <div className="mb-4 rounded-lg p-3" style={{ background: 'color-mix(in oklch, var(--primary) 10%, transparent)', border: '1px solid color-mix(in oklch, var(--primary) 35%, transparent)' }}>
          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--primary)' }}>Your piece — only you have this</div>
          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{st.myPiece}</div>
          <div className="text-xs mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
            Your group holds {st.jigsawCount || 'several'} pieces in all. Share yours out loud and collect the rest — you can&apos;t answer without every piece.
          </div>
        </div>
      )}

      <div className="text-center mb-4">
        <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>Your word</div>
        <div className="font-mono font-bold text-3xl" style={{ color: 'var(--primary)' }}>{st.word}</div>
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Collect {blanks} more {blanks === 1 ? 'word' : 'words'} from your group to unlock the task.
        </p>
      </div>

      {st.group && st.group.length > 0 && (
        <div className="mb-4">
          <div className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>Find your group and trade words:</div>
          <div className="flex flex-wrap justify-center gap-3">
            {st.group.map((mate, i) => (
              <div key={i} className="flex flex-col items-center gap-1" style={{ width: 64, opacity: mate.isMe ? 1 : 0.95 }}>
                <div className="relative">
                  {renderAv(mate, 48)}
                  {mate.completed && (
                    <CheckCircle2 size={16} style={{ color: 'var(--success)', position: 'absolute', right: -2, bottom: -2, background: 'var(--card)', borderRadius: 999 }} />
                  )}
                </div>
                <span className="text-xs truncate w-full text-center" title={mate.alias}>
                  {mate.alias}{mate.isMe ? ' (you)' : ''}
                </span>
                {mate.role && <span className="text-[10px] truncate w-full text-center" style={{ color: 'var(--muted-foreground)' }}>{mate.role}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {st.talkMoves && st.talkMoves.length > 0 && (
        <details className="mb-4 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
          <summary className="text-xs px-3 py-2 cursor-pointer" style={{ color: 'var(--muted-foreground)' }}>Stuck? Try a sentence starter</summary>
          <div className="px-3 pb-3 flex flex-col gap-1">
            {st.myRole && <span className="text-sm" style={{ color: 'var(--reward)' }}>{st.myRole.stem}</span>}
            {st.talkMoves.map((s, i) => <span key={i} className="text-sm" style={{ color: 'var(--foreground)' }}>{s}</span>)}
          </div>
        </details>
      )}

      {!st.completed ? (
        <>
          <div className="flex items-center gap-2 mb-2 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
            <Lock size={15} /> {collected.length}/{need} words gathered
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {collected.map((w) => <span key={w} className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: 'var(--muted)' }}>{w}</span>)}
          </div>
          <div className="flex gap-2">
            <input value={wordInput} onChange={(e) => setWordInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addWord() }}
              placeholder="type a word you heard"
              className="flex-1 rounded-lg border p-2 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            <button onClick={addWord} className="text-sm font-semibold rounded-lg px-3" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>Add</button>
          </div>
          {missing != null && missing > 0 && (
            <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>{missing} still missing — keep talking to your group.</p>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3 text-sm font-medium" style={{ color: 'var(--success)' }}>
            <Unlock size={15} /> Passphrase complete — submit your work.
          </div>
          {isDrawing ? (
            <PaintPad value={strokes} onChange={setStrokes} />
          ) : (
            <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={5}
              placeholder="Type your response…"
              className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
          )}

          <div className="mt-3 rounded-lg p-2.5" style={{ background: 'color-mix(in oklch, var(--reward) 8%, transparent)', border: '1px solid color-mix(in oklch, var(--reward) 30%, transparent)' }}>
            <label className="block text-xs mb-1 font-medium">Build on a groupmate&apos;s idea (required):</label>
            <select value={buildWho} onChange={(e) => setBuildWho(e.target.value)}
              className="w-full rounded-lg border p-2 text-sm mb-2" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}>
              <option value="">Choose a groupmate…</option>
              {st.group?.filter((g) => !g.isMe).map((g) => <option key={g.idx} value={String(g.idx)}>{g.alias}</option>)}
            </select>
            <textarea value={buildNote} onChange={(e) => setBuildNote(e.target.value)} rows={2}
              placeholder="How did their thinking shape your answer?"
              className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
          </div>

          <button onClick={submit} disabled={busy || !buildWho || !buildNote.trim() || (isDrawing ? strokes.length === 0 : !response.trim())}
            className="mt-3 w-full text-sm font-semibold rounded-lg px-4 py-2.5 inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
            <Send size={15} /> {busy ? 'Submitting…' : 'Submit'}
          </button>
        </>
      )}
    </div>
  )
}
