"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Hourglass, Lock, Unlock, CheckCircle2, Send } from 'lucide-react'
import InkPad from '@/components/blocks/InkPad'
import type { Stroke } from '@/components/blocks/DoodleCanvas'
import Avatar from '@/components/avatar/Avatar'
import type { AvatarTraits, EquippedItems, AvatarItem } from '@/lib/avatar/types'

interface AvatarBundle { alias: string; traits: AvatarTraits; equipped: EquippedItems }
interface GroupMate extends AvatarBundle { completed: boolean; isMe: boolean }

interface State {
  session_id: string; status: string; task_type: string; prompt: string | null
  joined: boolean; grouped: boolean; word: string | null
  phraseLength: number; enteredWords: string[]; completed: boolean; submitted: boolean
  self?: AvatarBundle; group?: GroupMate[]; avatarItems?: AvatarItem[]
}

export default function LobbyActivityPage() {
  const { code } = useParams<{ code: string }>()
  const [st, setSt] = useState<State | null>(null)
  const [collected, setCollected] = useState<string[]>([])
  const [wordInput, setWordInput] = useState('')
  const [response, setResponse] = useState('')
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [missing, setMissing] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const sessionId = useRef<string | null>(null)

  const poll = useCallback(() => {
    fetch(`/api/lobby/join?code=${code}`).then((r) => r.json()).then((d: State) => {
      if (d.session_id) {
        setSt(d)
        sessionId.current = d.session_id
        setCollected((prev) => Array.from(new Set([...prev, ...(d.enteredWords ?? [])])))
      }
    }).catch(() => {})
  }, [code])

  useEffect(() => { poll(); const t = setInterval(poll, 3000); return () => clearInterval(t) }, [poll])

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
    const payload = isDrawing ? { strokes } : response
    await fetch('/api/lobby/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId.current, response: payload }),
    }).catch(() => {})
    setBusy(false); poll()
  }

  const card: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--card)' }
  const wrap = (inner: React.ReactNode) => (
    <div className="max-w-md mx-auto p-5 mt-8" style={{ color: 'var(--foreground)' }}>
      <div className="rounded-2xl border p-6" style={card}>{inner}</div>
    </div>
  )
  const renderAv = (b: { traits: AvatarTraits; equipped: EquippedItems }, size = 44) => (
    <Avatar traits={b.traits} equipped={b.equipped} items={st?.avatarItems} size={size} crop="head" />
  )
  const selfHeader = st?.self && (
    <div className="flex items-center justify-center gap-2 mb-3">
      {renderAv(st.self, 36)}
      <span className="text-sm font-semibold">{st.self.alias}</span>
      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'color-mix(in oklch, var(--primary) 14%, transparent)', color: 'var(--primary)' }}>you</span>
    </div>
  )

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
      {selfHeader}
      <Hourglass size={36} style={{ color: 'var(--primary)' }} className="mx-auto mb-2" />
      <h1 className="text-lg font-semibold">You&apos;re in the lobby</h1>
      <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Waiting for your teacher to make groups…</p>
    </div>
  )

  // Grouped. Show the word + the gate, or the artifact form once completed.
  const need = st.phraseLength
  const blanks = Math.max(0, need - 1)

  return wrap(
    <div>
      {st.prompt && <p className="text-sm mb-4 rounded-lg px-3 py-2" style={{ background: 'color-mix(in oklch, var(--primary) 8%, transparent)' }}>{st.prompt}</p>}

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
              </div>
            ))}
          </div>
        </div>
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
            <InkPad value={strokes} onChange={setStrokes} />
          ) : (
            <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={5}
              placeholder="Type your response…"
              className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
          )}
          <button onClick={submit} disabled={busy || (isDrawing ? strokes.length === 0 : !response.trim())}
            className="mt-3 w-full text-sm font-semibold rounded-lg px-4 py-2.5 inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
            <Send size={15} /> {busy ? 'Submitting…' : 'Submit'}
          </button>
        </>
      )}
    </div>
  )
}
