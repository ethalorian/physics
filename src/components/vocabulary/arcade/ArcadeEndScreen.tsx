"use client"

import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useVocabAssignmentLink } from '@/components/vocabulary/useVocabAssignmentLink'
import Link from 'next/link'
import { Trophy, Sparkles, RotateCcw, ArrowLeft, Star } from 'lucide-react'
import type { VocabXpStatus } from '@/lib/xp-policy'

// Shared end-of-game screen for every arcade game. It performs the ONE uniform
// save (POST to vocabulary_game_scores) so the score flows into XP, streak,
// personal bests, and the weekly leaderboard (all derived from that table).
// It also detects a new personal best and celebrates with confetti.

interface Props {
  gameType: string
  gameTitle: string
  vocabularySetId?: string | null
  score: number
  maxScore?: number
  accuracy?: number          // 0-100, optional
  detail?: string            // optional one-line summary, e.g. "12 of 15 correct"
  accent?: string            // CSS color; defaults to lavender
  onPlayAgain: () => void
}

function fireConfetti() {
  if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) { canvas.remove(); return }
  // Confetti in the app palette: read the OKLCH tokens off :root (canvas can't
  // use var() directly, but modern Chrome parses oklch() as a fillStyle).
  const rootStyle = getComputedStyle(document.documentElement)
  const colors = ['--primary', '--success', '--reward', '--destructive', '--muted-foreground']
    .map((t) => rootStyle.getPropertyValue(t).trim())
    .filter(Boolean)
  if (colors.length === 0) colors.push('#8b7fd4')
  const parts = Array.from({ length: 140 }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 200,
    y: canvas.height / 3,
    vx: (Math.random() - 0.5) * 12,
    vy: Math.random() * -14 - 4,
    s: Math.random() * 6 + 4,
    c: colors[Math.floor(Math.random() * colors.length)],
    r: Math.random() * Math.PI,
  }))
  let frames = 0
  const tick = () => {
    frames++
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const p of parts) {
      p.vy += 0.4
      p.x += p.vx
      p.y += p.vy
      p.r += 0.1
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.r)
      ctx.fillStyle = p.c
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s)
      ctx.restore()
    }
    if (frames < 130) requestAnimationFrame(tick)
    else canvas.remove()
  }
  requestAnimationFrame(tick)
}

export default function ArcadeEndScreen({ gameType, gameTitle, vocabularySetId, score, maxScore, accuracy, detail, accent = 'var(--primary)', onPlayAgain }: Props) {
  const { assignmentHref, assigned } = useVocabAssignmentLink()
  const [isBest, setIsBest] = useState(false)
  const [prevBest, setPrevBest] = useState<number | null>(null)
  const [xp, setXp] = useState<VocabXpStatus | null>(null)
  const [saveError, setSaveError] = useState('')
  const [retry, setRetry] = useState(0)
  const submission = useRef<{ key: string; id: string; promise: Promise<VocabXpStatus> | null } | null>(null)

  useEffect(() => {
    let active = true
    setXp(null)
    setSaveError('')
    if (!vocabularySetId) {
      setSaveError('No vocabulary set was selected. This score cannot be saved for XP.')
      return
    }
    const key = JSON.stringify([gameType, vocabularySetId, score, maxScore, accuracy])
    if (submission.current?.key !== key) submission.current = { key, id: crypto.randomUUID(), promise: null }
    const game = submission.current
    // Reuse the in-flight request across React effect cleanup/replay. Saving
    // starts immediately; a slow personal-best lookup cannot prevent it.
    game.promise ??= (async () => {
      const r = await fetch('/api/student-progress/game-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ event_id: game.id, vocabulary_set_id: vocabularySetId, game_type: gameType, score, max_score: maxScore ?? score, accuracy }),
      })
      const result = await r.json()
      if (!r.ok || !result.xp || ![result.xp.dailyEarned, result.xp.dailyCap, result.xp.lifetimeEarned].every(Number.isFinite)) {
        throw new Error('The score or XP total could not be confirmed.')
      }
      return result.xp as VocabXpStatus
    })()
    game.promise.then(result => { if (active) { setXp(result); window.dispatchEvent(new CustomEvent('xp-updated')) } }).catch(() => {
      if (active) setSaveError('Save not confirmed. Retry to save this game and check your XP; retries will not count it twice.')
    })
    return () => { active = false }
  }, [gameType, vocabularySetId, score, maxScore, accuracy, retry])

  useEffect(() => {
    let active = true
    const id = submission.current?.id
    setIsBest(false)
    setPrevBest(null)
    fetch(`/api/student-progress/game-scores?game_type=${encodeURIComponent(gameType)}`, { signal: AbortSignal.timeout(15000) })
      .then(async r => {
        if (!r.ok) return
        const rows = await r.json() as { id: string; score?: number }[]
        if (!active || !Array.isArray(rows)) return
        const best = rows.filter(row => row.id !== id).reduce((m, row) => Math.max(m, row.score ?? 0), 0)
        setPrevBest(best)
        setIsBest(score > best)
      }).catch(() => { /* A personal-best lookup must not block saving. */ })
    return () => { active = false }
  }, [gameType, vocabularySetId, score, maxScore, accuracy])

  useEffect(() => { if (xp && isBest && score > 0) fireConfetti() }, [xp, isBest, score])

  return (
    <Card className="max-w-md mx-auto items-center gap-0 p-6 text-center">
      <div className="grid place-items-center mx-auto mb-3" style={{ width: 56, height: 56, borderRadius: '50%', background: `color-mix(in oklch, ${accent} 18%, transparent)`, color: accent }}>
        <Trophy size={28} />
      </div>
      <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{gameTitle} complete</div>
      <div className="text-5xl font-bold mt-1" style={{ color: accent }}>{score.toLocaleString()}</div>
      <div className="text-sm text-muted-foreground">Game points</div>
      <div role="status" aria-live="polite" className="mt-3 space-y-1 text-sm">
        {xp ? <>
          <div className="text-success">Score saved</div>
          <div className="inline-flex items-center gap-1.5"><Star size={15} /> Vocabulary XP today: {xp.dailyEarned} / {xp.dailyCap}</div>
          <div className="text-muted-foreground">Total XP earned: {xp.lifetimeEarned.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">{xp.dailyEarned >= xp.dailyCap ? 'Daily vocabulary game XP limit reached. More games still count toward your personal best. Assigned checks earn their own XP.' : `All vocabulary games share a ${xp.dailyCap} XP daily limit.`}</p>
        </> : saveError ? <>
          <p className="text-destructive">{saveError}</p>
          {vocabularySetId && <Button variant="outline" onClick={() => {
            if (submission.current) submission.current.promise = null
            setSaveError('')
            setRetry(n => n + 1)
          }}>Retry save</Button>}
        </> : <p className="text-muted-foreground">Saving score and checking XP…</p>}
      </div>

      {xp && isBest && score > 0 && (
        <div className="inline-flex items-center gap-1.5 text-sm font-medium rounded-full px-3 py-1 mt-3" style={{ background: 'color-mix(in oklch, var(--reward) 18%, transparent)', color: 'var(--foreground)' }}>
          <Sparkles size={15} /> New personal best!
        </div>
      )}
      {!isBest && prevBest !== null && prevBest > 0 && (
        <div className="text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>Your best: {prevBest.toLocaleString()} — so close!</div>
      )}

      {(detail || accuracy !== undefined) && (
        <div className="text-sm mt-3" style={{ color: 'var(--muted-foreground)' }}>
          {detail}{detail && accuracy !== undefined ? ' · ' : ''}{accuracy !== undefined ? `${Math.round(accuracy)}% accuracy` : ''}
        </div>
      )}

      <div className="flex items-center gap-2 justify-center mt-5">
        <Button onClick={onPlayAgain} disabled={Boolean(vocabularySetId) && !xp}>
          <RotateCcw size={15} /> Play again
        </Button>
        <Link href={assignmentHref} className="inline-flex items-center gap-1.5 text-sm rounded-lg border px-4 py-2" style={{ borderColor: 'var(--border)' }}>
          <ArrowLeft size={15} /> {assigned ? 'Return to assignment & check' : 'Assignments'}
        </Link>
      </div>
    </Card>
  )
}
