"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Trophy, Sparkles, RotateCcw, ArrowLeft, Star } from 'lucide-react'

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
  if (typeof window === 'undefined') return
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) { canvas.remove(); return }
  const colors = ['#8b7fd4', '#7bbf9e', '#e3b341', '#C08B8B', '#6E93A8']
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
  const [isBest, setIsBest] = useState(false)
  const [prevBest, setPrevBest] = useState<number | null>(null)
  const saved = useRef(false)

  useEffect(() => {
    if (saved.current) return
    saved.current = true
    let cancelled = false
    ;(async () => {
      try {
        // prior best for this game (before saving the new score)
        let best = 0
        try {
          const r = await fetch(`/api/student-progress/game-scores?game_type=${encodeURIComponent(gameType)}`)
          if (r.ok) {
            const rows = (await r.json()) as { score?: number }[]
            best = Array.isArray(rows) ? rows.reduce((m, x) => Math.max(m, x.score ?? 0), 0) : 0
          }
        } catch { /* ignore */ }
        if (cancelled) return
        setPrevBest(best)
        const beat = score > best
        setIsBest(beat)
        if (beat && score > 0) fireConfetti()

        // the uniform save (needs a vocabulary set id; skip if absent)
        if (vocabularySetId) {
          await fetch('/api/student-progress/game-scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vocabulary_set_id: vocabularySetId, game_type: gameType, score, max_score: maxScore ?? score }),
          })
        }
      } catch (e) {
        console.error('Arcade score save failed:', e)
      }
    })()
    return () => { cancelled = true }
  }, [gameType, vocabularySetId, score, maxScore])

  return (
    <div className="max-w-md mx-auto rounded-2xl border p-6 text-center" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
      <div className="grid place-items-center mx-auto mb-3" style={{ width: 56, height: 56, borderRadius: '50%', background: `color-mix(in oklch, ${accent} 18%, transparent)`, color: accent }}>
        <Trophy size={28} />
      </div>
      <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{gameTitle} complete</div>
      <div className="text-5xl font-bold mt-1" style={{ color: accent }}>{score.toLocaleString()}</div>
      <div className="inline-flex items-center gap-1.5 text-sm mt-1" style={{ color: 'var(--success)' }}>
        <Star size={15} /> +{score.toLocaleString()} XP
      </div>

      {isBest && score > 0 && (
        <div className="inline-flex items-center gap-1.5 text-sm font-medium rounded-full px-3 py-1 mt-3" style={{ background: 'color-mix(in oklch, var(--reward) 18%, transparent)', color: 'var(--reward)' }}>
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
        <button onClick={onPlayAgain} className="inline-flex items-center gap-1.5 text-sm rounded-lg px-4 py-2 font-medium" style={{ background: accent, color: 'var(--primary-foreground, white)' }}>
          <RotateCcw size={15} /> Play again
        </button>
        <Link href="/vocabulary" className="inline-flex items-center gap-1.5 text-sm rounded-lg border px-4 py-2" style={{ borderColor: 'var(--border)' }}>
          <ArrowLeft size={15} /> Arcade
        </Link>
      </div>
    </div>
  )
}
