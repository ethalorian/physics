"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Hourglass, Lock, Unlock, CheckCircle2, Send } from 'lucide-react'

interface State {
  session_id: string; status: string; task_type: string; prompt: string | null
  joined: boolean; grouped: boolean; word: string | null
  phraseLength: number; enteredWords: string[]; completed: boolean; submitted: boolean
}

export default function LobbyActivityPage() {
  const { code } = useParams<{ code: string }>()
  const [st, setSt] = useState<State | null>(null)
  const [collected, setCollected] = useState<string[]>([])
  const [wordInput, setWordInput] = useState('')
  const [response, setResponse] = useState('')
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

  const submit = async () => {
    if (!sessionId.current) return
    setBusy(true)
    await fetch('/api/lobby/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId.current, response }),
    }).catch(() => {})
    setBusy(false); poll()
  }

  const card: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--card)' }
  const wrap = (inner: React.ReactNode) => (
    <div className="max-w-md mx-auto p-5 mt-8" style={{ color: 'var(--foreground)' }}>
      <div className="rounded-2xl border p-6" style={card}>{inner}</div>
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
          <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={5}
            placeholder="Type your response…"
            className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
          <button onClick={submit} disabled={busy || !response.trim()}
            className="mt-3 w-full text-sm font-semibold rounded-lg px-4 py-2.5 inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
            <Send size={15} /> {busy ? 'Submitting…' : 'Submit'}
          </button>
        </>
      )}
    </div>
  )
}
