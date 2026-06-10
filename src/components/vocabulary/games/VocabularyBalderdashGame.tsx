"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { Feather, Check, Copy, Crown, Eye, Users, Clock } from 'lucide-react'
import { MAX_DEF_LEN } from '@/lib/balderdash'

// Physics Balderdash — live room client. Polls every 1.5s (house convention);
// the server runs the phase machine. Three in-round phases:
//   writing — forge a fake definition for the term
//   voting  — anonymous ballot (all fakes + the real one, shuffled)
//   reveal  — authors, votes, and the real definition exposed

interface RevealEntry { text: string; real: boolean; author: string | null; mine: boolean; voters: (string | null)[] }
interface RoundView {
  term: string
  wroteCount: number
  votedCount: number
  myText: string | null
  myVote: number | null
  phaseEndsAt?: number
  ballot?: string[]
  myEntryIndex?: number
  reveal?: RevealEntry[]
}
export interface BalView {
  id: string
  code: string
  status: 'waiting' | 'playing' | 'finished'
  label: string
  vocabularySetId: string | null
  isHost: boolean
  minPlayers: number
  players: { name: string; score: number; isYou: boolean }[]
  currentRound: number
  totalRounds: number
  phase?: 'writing' | 'voting' | 'reveal'
  serverNow: number
  round: RoundView | null
  recap?: { term: string; real: string; myText: string | null; spotted: boolean; fooled: number }[]
}

const POLL_MS = 1500

export default function VocabularyBalderdashGame({ roomId, onComplete }: { roomId: string; onComplete: (v: BalView) => void }) {
  const [game, setGame] = useState<BalView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [now, setNow] = useState(Date.now())
  const [copied, setCopied] = useState(false)
  const clockOffset = useRef(0)
  const busy = useRef(false)
  const done = useRef(false)
  const draftRound = useRef(-1)

  const apply = useCallback((v: BalView) => {
    clockOffset.current = v.serverNow - Date.now()
    setGame(v)
  }, [])

  const poll = useCallback(async () => {
    try {
      const r = await fetch(`/api/balderdash/${roomId}`)
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        setError(d.error ?? 'Could not reach the game')
        return
      }
      setError(null)
      apply((await r.json()) as BalView)
    } catch { /* transient; next poll recovers */ }
  }, [roomId, apply])

  useEffect(() => {
    poll()
    const t = setInterval(poll, POLL_MS)
    return () => clearInterval(t)
  }, [poll])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (game?.status === 'finished' && !done.current) {
      done.current = true
      onComplete(game)
    }
  }, [game, onComplete])

  const act = async (body: Record<string, unknown>) => {
    if (busy.current) return
    busy.current = true
    setActionError(null)
    try {
      const r = await fetch(`/api/balderdash/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) setActionError((d as { error?: string }).error ?? 'That didn’t go through')
      else apply(d as BalView)
    } finally {
      busy.current = false
    }
  }

  if (error) return <Panel><div className="text-sm" style={{ color: '#C08B8B' }}>{error}</div></Panel>
  if (!game) return <Panel><div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Joining the table…</div></Panel>

  const serverNow = now + clockOffset.current
  const r = game.round
  const secsLeft = r?.phaseEndsAt ? Math.max(0, Math.ceil((r.phaseEndsAt - serverNow) / 1000)) : null

  // Reset the draft when a new round's writing phase begins.
  if (game.phase === 'writing' && draftRound.current !== game.currentRound) {
    draftRound.current = game.currentRound
    if (draft) setDraft('')
  }

  // ---- lobby ---------------------------------------------------------------
  if (game.status === 'waiting') {
    return (
      <Panel>
        <div className="grid place-items-center mx-auto mb-3" style={{ width: 56, height: 56, borderRadius: '50%', background: 'color-mix(in oklch, var(--primary) 18%, transparent)', color: 'var(--primary)' }}>
          <Feather size={28} />
        </div>
        <div className="text-lg font-semibold">Gathering players…</div>
        <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Classmates join with this code:</div>
        <button
          onClick={() => { navigator.clipboard?.writeText(game.code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          className="inline-flex items-center gap-2 text-4xl font-bold tracking-[0.3em] rounded-xl border px-6 py-3 mt-4"
          style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
        >
          {game.code} <Copy size={18} style={{ color: 'var(--muted-foreground)' }} />
        </button>
        <div className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>{copied ? 'Copied!' : game.label}</div>
        <div className="flex items-center justify-center gap-1.5 text-sm mt-4" style={{ color: 'var(--muted-foreground)' }}>
          <Users size={15} /> {game.players.length} seated
        </div>
        <div className="flex flex-wrap justify-center gap-1.5 mt-2">
          {game.players.map((p, i) => (
            <span key={i} className="text-xs rounded-full border px-2.5 py-1" style={{ borderColor: 'var(--border)', color: p.isYou ? 'var(--primary)' : 'var(--foreground)' }}>
              {i === 0 && <Crown size={11} className="inline mr-1" style={{ color: 'var(--reward)' }} />}{p.name}{p.isYou ? ' (you)' : ''}
            </span>
          ))}
        </div>
        {game.isHost ? (
          <>
            <button
              onClick={() => act({ action: 'start' })}
              disabled={game.players.length < game.minPlayers}
              className="rounded-lg px-5 py-2.5 text-sm font-medium mt-5"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground, white)', opacity: game.players.length < game.minPlayers ? 0.5 : 1 }}
            >
              Start game
            </button>
            {game.players.length < game.minPlayers && (
              <div className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>Need {game.minPlayers - game.players.length} more to start</div>
            )}
          </>
        ) : (
          <div className="text-sm mt-5" style={{ color: 'var(--muted-foreground)' }}>Waiting for the host to start…</div>
        )}
        {actionError && <div className="text-xs mt-2" style={{ color: '#C08B8B' }}>{actionError}</div>}
      </Panel>
    )
  }

  if (!r) return <Panel><div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Finishing up…</div></Panel>

  const header = (
    <div className="flex items-center justify-between text-sm mb-4">
      <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Round {game.currentRound + 1} of {game.totalRounds}</div>
      <div className="flex items-center gap-3">
        {secsLeft !== null && (
          <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: secsLeft <= 10 ? '#C08B8B' : 'var(--muted-foreground)' }}>
            <Clock size={13} /> {secsLeft}s
          </span>
        )}
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {game.players.filter((p) => p.isYou).map((p) => `${p.score} pts`)}
        </span>
      </div>
    </div>
  )

  // ---- writing --------------------------------------------------------------
  if (game.phase === 'writing') {
    const submitted = !!r.myText
    return (
      <Panel wide>
        {header}
        <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted-foreground)' }}>Forge a definition for</div>
        <div className="text-2xl font-bold mb-3" style={{ color: 'var(--primary)' }}>{r.term}</div>
        <div className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Write a fake definition convincing enough to fool your classmates. Sound like the textbook.
        </div>
        <textarea
          value={draft || r.myText || ''}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={MAX_DEF_LEN}
          rows={3}
          placeholder="The measure of…"
          className="w-full rounded-xl border p-3 text-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{r.wroteCount} of {game.players.length} submitted</span>
          <button
            onClick={() => act({ action: 'write', text: draft || r.myText || '' })}
            disabled={(draft || r.myText || '').trim().length < 3}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: submitted ? 'var(--success)' : 'var(--primary)', color: 'var(--primary-foreground, white)' }}
          >
            {submitted ? 'Update fake' : 'Submit fake'}
          </button>
        </div>
        {submitted && <div className="text-xs mt-2 inline-flex items-center gap-1" style={{ color: 'var(--success)' }}><Check size={13} /> Locked in — you can still edit until time runs out</div>}
        {actionError && <div className="text-xs mt-2" style={{ color: '#C08B8B' }}>{actionError}</div>}
      </Panel>
    )
  }

  // ---- voting ---------------------------------------------------------------
  if (game.phase === 'voting') {
    const voted = r.myVote !== null && r.myVote !== undefined
    return (
      <Panel wide>
        {header}
        <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted-foreground)' }}>Which is the real definition of</div>
        <div className="text-2xl font-bold mb-3" style={{ color: 'var(--primary)' }}>{r.term}</div>
        <div className="grid gap-2">
          {(r.ballot ?? []).map((text, i) => {
            const mine = i === r.myEntryIndex
            const picked = r.myVote === i
            return (
              <button
                key={i}
                onClick={() => !mine && !voted && act({ action: 'vote', index: i })}
                disabled={mine || voted}
                className="rounded-xl border px-4 py-3 text-left text-sm"
                style={{
                  borderColor: picked ? 'var(--primary)' : 'var(--border)',
                  background: picked ? 'color-mix(in oklch, var(--primary) 14%, transparent)' : 'var(--card)',
                  color: 'var(--foreground)',
                  opacity: mine ? 0.45 : voted && !picked ? 0.6 : 1,
                }}
              >
                {text}
                {mine && <span className="block text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>your fake — can’t vote for it</span>}
              </button>
            )
          })}
        </div>
        <div className="text-xs mt-3 text-center" style={{ color: 'var(--muted-foreground)' }}>
          {voted ? `Vote cast — ${r.votedCount} of ${game.players.length} in` : 'Pick the one you think is real'}
        </div>
        {actionError && <div className="text-xs mt-2" style={{ color: '#C08B8B' }}>{actionError}</div>}
      </Panel>
    )
  }

  // ---- reveal ---------------------------------------------------------------
  return (
    <Panel wide>
      {header}
      <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted-foreground)' }}>The truth about</div>
      <div className="text-2xl font-bold mb-3" style={{ color: 'var(--primary)' }}>{r.term}</div>
      <div className="grid gap-2">
        {(r.reveal ?? []).map((e, i) => (
          <div key={i} className="rounded-xl border px-4 py-3 text-sm" style={{
            borderColor: e.real ? 'var(--success)' : 'var(--border)',
            background: e.real ? 'color-mix(in oklch, var(--success) 10%, transparent)' : 'var(--card)',
          }}>
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: e.real ? 'var(--success)' : 'var(--muted-foreground)' }}>
              {e.real ? <><Eye size={12} /> The real definition</> : <><Feather size={12} /> {e.author}{e.mine ? ' (you)' : ''}</>}
              {e.voters.length > 0 && (
                <span className="ml-auto" style={{ color: 'var(--reward)' }}>
                  {e.real ? `spotted by ${e.voters.join(', ')}` : `fooled ${e.voters.join(', ')}`}
                </span>
              )}
            </div>
            {e.text}
          </div>
        ))}
      </div>
      <div className="text-xs mt-3 text-center" style={{ color: 'var(--muted-foreground)' }}>Next round shortly…</div>
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
