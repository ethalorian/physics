'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, AlertCircle, RefreshCw } from 'lucide-react'

/**
 * Self-serve class-code join for the enrollment gate, plus the auto-unlock
 * poller. Two ways in, one component:
 *  1. Student types the 6-character code their teacher wrote on the board →
 *     POST /api/courses/enroll → hard reload into /home.
 *  2. Teacher adds them to the roster out-of-band → the poller notices
 *     (GET /api/me/enrollment every 30s) and reloads without any action.
 * Tokenized to match the gate screen — no raw palette colors.
 */
export default function GateJoinCode() {
  const [code, setCode] = useState('')
  const [state, setState] = useState<'idle' | 'checking' | 'valid' | 'invalid' | 'joining'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [courseName, setCourseName] = useState<string | null>(null)
  const lastValidated = useRef('')

  const onChange = (v: string) => {
    setCode(v.toUpperCase().replace(/\s/g, '').slice(0, 6))
    setState('idle')
    setMessage(null)
    setCourseName(null)
  }

  const validate = async () => {
    const c = code.trim()
    if (c.length < 6 || c === lastValidated.current) return
    lastValidated.current = c
    setState('checking')
    try {
      const r = await fetch(`/api/courses/enroll?code=${encodeURIComponent(c)}`)
      const d = await r.json()
      if (d.valid) {
        setState('valid')
        setCourseName(d.course?.name ?? null)
        setMessage(null)
      } else {
        setState('invalid')
        setMessage(d.message || 'That code doesn’t match a class.')
      }
    } catch {
      setState('idle') // network hiccup — let them try the join button anyway
    }
  }

  const join = async () => {
    if (!code.trim() || state === 'joining') return
    setState('joining')
    setMessage(null)
    try {
      const r = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: code.trim() }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Couldn’t join with that code.')
      // Enrolled — hard reload so every gate (and its cache) re-checks.
      window.location.href = '/home'
    } catch (e) {
      setState('invalid')
      setMessage(e instanceof Error ? e.message : 'Couldn’t join with that code.')
    }
  }

  // Auto-unlock: if the teacher rosters the student while this screen is up,
  // notice within ~30s and reload. No "just refresh" homework for the student.
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const r = await fetch('/api/me/enrollment')
        if (!r.ok) return
        const d = await r.json()
        if (d.enrolled) window.location.reload()
      } catch { /* offline — keep waiting */ }
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onBlur={validate}
          onKeyDown={(e) => { if (e.key === 'Enter') { validate(); join() } }}
          placeholder="ABC123"
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Class code"
          className="font-mono text-lg tracking-widest uppercase rounded-xl px-3 py-2 w-36"
          style={{
            border: `1.5px solid ${state === 'invalid' ? 'var(--destructive)' : state === 'valid' ? 'var(--success)' : 'var(--border)'}`,
            background: 'var(--card)',
            color: 'var(--foreground)',
            outlineColor: 'var(--primary)',
          }}
        />
        <button
          onClick={join}
          disabled={code.trim().length < 6 || state === 'joining' || state === 'invalid'}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-40"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}
        >
          {state === 'joining' ? <RefreshCw size={15} className="animate-spin" /> : null}
          Join <ArrowRight size={15} />
        </button>
      </div>

      {state === 'checking' && (
        <p className="text-xs mt-2 inline-flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
          <RefreshCw size={12} className="animate-spin" /> Checking that code…
        </p>
      )}
      {state === 'valid' && courseName && (
        <p className="text-xs mt-2 inline-flex items-center gap-1.5 font-medium" style={{ color: 'var(--success)' }}>
          <Check size={13} /> Found it: {courseName}. Hit Join.
        </p>
      )}
      {state === 'invalid' && message && (
        <p className="text-xs mt-2 inline-flex items-center gap-1.5" style={{ color: 'var(--destructive)' }}>
          <AlertCircle size={13} /> {message}
        </p>
      )}
    </div>
  )
}
