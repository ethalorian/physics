"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { Swords, Check, X, Clock, Wifi, WifiOff, Copy, Ghost } from 'lucide-react'
import { ROUND_MS, type DuelMode, type DuelRole, type DuelStatus } from '@/lib/duel'

// Vocab Duel — the live match client. No websockets: it polls the match API
// every 1.5s (the app's lobby convention) and the server adjudicates fastest-
// correct per round, so the buzzer-race feel survives polling latency.
//
// Three play contexts share this component:
//   live match      — both seats filled, racing in real time
//   ghost recording — the host plays solo; the run becomes an open challenge
//   ghost playback  — a challenger races the recorded answers

interface RoundView {
  prompt: string
  options: string[]
  startedAt?: string
  correct?: number
  winner?: DuelRole | 'draw'
  mine?: { answer: number; ms: number } | null
  theirs?: { answer: number; ms: number } | null
  theirsAnswered?: boolean
}

export interface MatchView {
  id: string
  code: string
  mode: DuelMode
  status: DuelStatus
  label: string
  vocabularySetId: string | null
  role: DuelRole
  hostName: string
  guestName: string | null
  currentRound: number
  totalRounds: number
  wins: { host: number; guest: number }
  winner: DuelRole | 'tie' | null
  opponentSeenAgoMs: number | null
  serverNow: number
  rounds: RoundView[]
}

const POLL_MS = 1500

export default function VocabularyDuelGame({ matchId, onComplete }: { matchId: string; onComplete: (m: MatchView) => void }) {
  const [match, setMatch] = useState<MatchView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())
  const [copied, setCopied] = useState(false)
  const clockOffset = useRef(0) // serverNow - clientNow, refreshed each poll
  const shownAt = useRef<{ round: number; at: number } | null>(null) // when the live question was painted
  const submitting = useRef(false)
  const done = useRef(false)

  const poll = useCallback(async () => {
    try {
      const r = await fetch(`/api/duel/${matchId}`)
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        setError(d.error ?? 'Could not reach the duel')
        return
      }
      const m = (await r.json()) as MatchView
      clockOffset.current = m.serverNow - Date.now()
      setError(null)
      setMatch(m)
    } catch {
      /* transient network blip — next poll will recover */
    }
  }, [matchId])

  useEffect(() => {
    poll()
    const t = setInterval(poll, POLL_MS)
    return () => clearInterval(t)
  }, [poll])

  // A fast local tick drives the countdown / timer bar between polls.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(t)
  }, [])

  // Hand off exactly once: a finished match, or (for the host) a posted ghost.
  useEffect(() => {
    if (!match || done.current) return
    const ghostPosted = match.status === 'open' && match.role === 'host'
    if (match.status === 'finished' || ghostPosted) {
      done.current = true
      onComplete(match)
    }
  }, [match, onComplete])

  if (error) return <Panel><div className="text-sm" style={{ color: '#C08B8B' }}>{error}</div></Panel>
  if (!match) return <Panel><div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Connecting to duel…</div></Panel>

  const serverNow = now + clockOffset.current
  const recording = match.status === 'recording'
  const ghostPlayback = match.mode === 'ghost' && match.status === 'active'
  const me = match.role
  const opp: DuelRole = me === 'host' ? 'guest' : 'host'
  const myName = me === 'host' ? match.hostName : match.guestName ?? 'You'
  const oppName = ghostPlayback ? `${match.hostName}'s ghost` : opp === 'host' ? match.hostName : match.guestName ?? 'Opponent'
  const oppOnline = match.opponentSeenAgoMs !== null && match.opponentSeenAgoMs < 6000

  // ---- waiting room (live mode only) --------------------------------------
  if (match.status === 'waiting') {
    return (
      <Panel>
        <div className="grid place-items-center mx-auto mb-3" style={{ width: 56, height: 56, borderRadius: '50%', background: 'color-mix(in oklch, var(--primary) 18%, transparent)', color: 'var(--primary)' }}>
          <Swords size={28} />
        </div>
        <div className="text-lg font-semibold">Waiting for a challenger…</div>
        <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Have a classmate enter this code on the Vocab Duel page:</div>
        <button
          onClick={() => { navigator.clipboard?.writeText(match.code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          className="inline-flex items-center gap-2 text-4xl font-bold tracking-[0.3em] rounded-xl border px-6 py-3 mt-4"
          style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
          title="Copy code"
        >
          {match.code} <Copy size={18} style={{ color: 'var(--muted-foreground)' }} />
        </button>
        <div className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>{copied ? 'Copied!' : match.label}</div>
        <div className="text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>Your challenge is listed for classmates while you wait here. Leaving cancels it.</div>
      </Panel>
    )
  }

  if (match.status === 'open') {
    // Brief flash before onComplete hands off to the end screen.
    return <Panel><div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Ghost recorded…</div></Panel>
  }

  const idx = match.currentRound
  const round = match.rounds[idx]
  const started = round?.startedAt ? Date.parse(round.startedAt) : null
  const lastResolved = [...match.rounds].reverse().find((r) => r.winner !== undefined) ?? null
  const inCountdown = started !== null && serverNow < started
  const timeLeft = started !== null ? Math.max(0, started + ROUND_MS - serverNow) : 0

  // Stamp the moment the live question first appears (drives elapsed ms).
  if (round && started !== null && serverNow >= started && shownAt.current?.round !== idx) {
    shownAt.current = { round: idx, at: Date.now() }
  }

  const answer = async (i: number) => {
    if (!round || round.mine || submitting.current) return
    submitting.current = true
    const ms = shownAt.current?.round === idx ? Date.now() - shownAt.current.at : ROUND_MS
    try {
      const r = await fetch(`/api/duel/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round: idx, answer: i, ms }),
      })
      if (r.ok) {
        const m = (await r.json()) as MatchView
        clockOffset.current = m.serverNow - Date.now()
        setMatch(m)
      }
    } finally {
      submitting.current = false
    }
  }

  const scoreStrip = recording ? (
    <div className="flex items-center justify-between text-sm mb-4">
      <div className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--primary)' }}>
        <Ghost size={16} /> Recording your ghost run
      </div>
      <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        Round {Math.min(idx + 1, match.totalRounds)} of {match.totalRounds}
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-between text-sm mb-4">
      <Score name={myName} wins={match.wins[me]} accent="var(--primary)" me />
      <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        Round {Math.min(idx + 1, match.totalRounds)} of {match.totalRounds}
      </div>
      <div className="flex items-center gap-1.5">
        <Score name={oppName} wins={match.wins[opp]} accent="var(--viz-down, #C08B8B)" />
        {ghostPlayback ? (
          <span title="Racing a recorded run" style={{ color: 'var(--muted-foreground)' }}><Ghost size={14} /></span>
        ) : (
          <span title={oppOnline ? 'Opponent connected' : 'Opponent may have disconnected'} style={{ color: oppOnline ? 'var(--success)' : '#C08B8B' }}>
            {oppOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          </span>
        )}
      </div>
    </div>
  )

  // ---- between rounds: reveal + countdown ---------------------------------
  if (inCountdown) {
    const secs = Math.ceil((started! - serverNow) / 1000)
    return (
      <Panel wide>
        {scoreStrip}
        {!recording && lastResolved && <RoundResult r={lastResolved} me={me} myName={myName} oppName={oppName} />}
        {recording && idx > 0 && (
          <div className="text-sm text-center" style={{ color: 'var(--muted-foreground)' }}>Round {idx} recorded — answers stay sealed until someone races your ghost.</div>
        )}
        <div className="text-center text-sm mt-4" style={{ color: 'var(--muted-foreground)' }}>
          Next round in <span className="font-bold" style={{ color: 'var(--primary)' }}>{secs}</span>…
        </div>
      </Panel>
    )
  }

  if (!round) return <Panel><div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Finishing up…</div></Panel>

  // ---- live round ----------------------------------------------------------
  const locked = round.mine !== undefined && round.mine !== null
  const pct = Math.max(0, Math.min(1, timeLeft / ROUND_MS))
  return (
    <Panel wide>
      {scoreStrip}
      <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: 'var(--muted, #eee)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: pct < 0.25 ? '#C08B8B' : 'var(--primary)', transition: 'width 100ms linear' }} />
      </div>
      <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
        <Clock size={13} /> {Math.ceil(timeLeft / 1000)}s — {recording ? 'your time gets baked into the ghost' : 'first correct answer wins the round'}
      </div>
      <div className="text-lg font-medium leading-snug mb-4">{round.prompt}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {round.options.map((opt, i) => {
          const mine = locked && round.mine!.answer === i
          return (
            <button
              key={i}
              onClick={() => answer(i)}
              disabled={locked || timeLeft <= 0}
              className="rounded-xl border px-4 py-3 text-left text-sm font-medium transition-transform active:scale-[0.98]"
              style={{
                borderColor: mine ? 'var(--primary)' : 'var(--border)',
                background: mine ? 'color-mix(in oklch, var(--primary) 14%, transparent)' : 'var(--card)',
                color: 'var(--foreground)',
                opacity: locked && !mine ? 0.55 : 1,
                cursor: locked ? 'default' : 'pointer',
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {locked && (
        <div className="text-sm text-center mt-4" style={{ color: 'var(--muted-foreground)' }}>
          {recording
            ? `Recorded (${(round.mine!.ms / 1000).toFixed(1)}s)`
            : `Locked in (${(round.mine!.ms / 1000).toFixed(1)}s) — ${round.theirsAnswered || ghostPlayback ? 'revealing…' : `waiting for ${oppName}…`}`}
        </div>
      )}
    </Panel>
  )
}

function Panel({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`${wide ? 'max-w-2xl' : 'max-w-md text-center'} mx-auto rounded-2xl border p-6`} style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
      {children}
    </div>
  )
}

function Score({ name, wins, accent, me }: { name: string; wins: number; accent: string; me?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium truncate" style={{ maxWidth: 120 }}>{me ? `${name} (you)` : name}</span>
      <span className="grid place-items-center text-xs font-bold rounded-full" style={{ width: 22, height: 22, background: `color-mix(in oklch, ${accent} 18%, transparent)`, color: accent }}>{wins}</span>
    </div>
  )
}

function RoundResult({ r, me, myName, oppName }: { r: RoundView; me: DuelRole; myName: string; oppName: string }) {
  const iWon = r.winner === me
  const draw = r.winner === 'draw'
  const headline = draw ? 'Round drawn' : iWon ? `${myName} takes the round!` : `${oppName} takes the round`
  const color = draw ? 'var(--muted-foreground)' : iWon ? 'var(--success)' : '#C08B8B'
  const mineOk = r.mine != null && r.mine.answer === r.correct
  const theirsOk = r.theirs != null && r.theirs.answer === r.correct
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
      <div className="text-sm font-semibold mb-2" style={{ color }}>{headline}</div>
      <div className="text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>
        Answer: <span className="font-medium" style={{ color: 'var(--foreground)' }}>{r.correct !== undefined ? r.options[r.correct] : '—'}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <AnswerChip label={myName} ok={mineOk} ms={r.mine?.ms ?? null} answered={r.mine != null} />
        <AnswerChip label={oppName} ok={theirsOk} ms={r.theirs?.ms ?? null} answered={r.theirs != null} />
      </div>
    </div>
  )
}

function AnswerChip({ label, ok, ms, answered }: { label: string; ok: boolean; ms: number | null; answered: boolean }) {
  const color = !answered ? 'var(--muted-foreground)' : ok ? 'var(--success)' : '#C08B8B'
  return (
    <div className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5" style={{ borderColor: 'var(--border)', color }}>
      {!answered ? <Clock size={13} /> : ok ? <Check size={13} /> : <X size={13} />}
      <span className="truncate">{label}</span>
      {ms !== null && <span className="ml-auto" style={{ color: 'var(--muted-foreground)' }}>{(ms / 1000).toFixed(1)}s</span>}
      {!answered && <span className="ml-auto" style={{ color: 'var(--muted-foreground)' }}>no answer</span>}
    </div>
  )
}
