"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { VocabularyTerm } from '@/types/assignment'
import { Target, Heart, Flame, Crown, Zap } from 'lucide-react'
import { sfx } from '@/lib/arcade-sound'
import SoundToggle from '@/components/vocabulary/arcade/SoundToggle'

interface VocabularyWordShootGameProps {
  vocabularyTerms: VocabularyTerm[]
  onGameComplete?: (score: number, totalQuestions: number, timeSpent: number) => void
  difficulty?: 'easy' | 'medium' | 'hard'
  gameLength?: number
}

interface Bubble { id: string; term: VocabularyTerm; isCorrect: boolean; x: number; y: number; vx: number; vy: number }
type Phase = 'waiting' | 'playing' | 'feedback' | 'complete'

// `speed` = how fast the target bubbles drift around the arena (px/sec).
const CONFIG = {
  easy: { distractors: 3, time: 9000, lives: 5, base: 10, speed: 42 },
  medium: { distractors: 4, time: 7000, lives: 3, base: 20, speed: 64 },
  hard: { distractors: 5, time: 5000, lives: 2, base: 30, speed: 92 },
}

const BUBBLE = 130   // bubble diameter (px)
const ARENA_H = 540  // arena height (px) — matches the arena style below

export default function VocabularyWordShootGame({ vocabularyTerms, onGameComplete, difficulty = 'medium', gameLength = 20 }: VocabularyWordShootGameProps) {
  const cfg = CONFIG[difficulty]

  const [phase, setPhase] = useState<Phase>('waiting')
  const [terms, setTerms] = useState<VocabularyTerm[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(cfg.lives)
  const [streak, setStreak] = useState(0)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [definition, setDefinition] = useState('')
  const [timeLeft, setTimeLeft] = useState(cfg.time)
  const [floatPts, setFloatPts] = useState<number | null>(null)
  const [shake, setShake] = useState(false)
  const [flash, setFlash] = useState<{ ok: boolean; answer: string } | null>(null)
  const [best, setBest] = useState(0)

  const gameAreaRef = useRef<HTMLDivElement>(null)
  const bubblesRef = useRef<Bubble[]>([])
  const deadlineRef = useRef(0)
  const answeredRef = useRef(false)
  const startRef = useRef(0)
  const total = Math.min(gameLength, terms.length || gameLength)

  // shuffle terms once available
  useEffect(() => {
    if (vocabularyTerms.length > 0) setTerms([...vocabularyTerms].sort(() => Math.random() - 0.5))
  }, [vocabularyTerms])

  // fetch personal best for the live pace target
  useEffect(() => {
    fetch('/api/student-progress/game-scores?game_type=word-shoot')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { score?: number }[]) => setBest(Array.isArray(rows) ? rows.reduce((m, x) => Math.max(m, x.score ?? 0), 0) : 0))
      .catch(() => {})
  }, [])

  const multiplier = Math.min(1 + Math.floor(streak / 3), 5)

  const endGame = useCallback((finalScore: number, answered: number) => {
    setPhase('complete')
    sfx.gameover()
    onGameComplete?.(finalScore, answered, Math.floor((Date.now() - startRef.current) / 1000))
  }, [onGameComplete])

  const beginQuestion = useCallback((index: number) => {
    const correct = terms[index]
    if (!correct) return
    const distractors = terms.filter((t) => t.id !== correct.id).sort(() => Math.random() - 0.5).slice(0, cfg.distractors)
    const pool = [correct, ...distractors].sort(() => Math.random() - 0.5)
    const w = gameAreaRef.current?.clientWidth ?? 900
    const maxX = Math.max(0, w - BUBBLE)
    const maxY = Math.max(0, ARENA_H - BUBBLE)
    const placed: Bubble[] = pool.map((term, i) => {
      // spread starting points across the arena, then send each off in a random
      // direction at the difficulty's speed — moving targets to shoot.
      const ang = Math.random() * Math.PI * 2
      const sp = cfg.speed * (0.8 + Math.random() * 0.4)
      return {
        id: `${term.id}-${index}-${i}`,
        term,
        isCorrect: term.id === correct.id,
        x: 10 + Math.random() * maxX,
        y: 10 + Math.random() * Math.max(0, maxY - 20),
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
      }
    })
    answeredRef.current = false
    bubblesRef.current = placed
    setBubbles(placed)
    setDefinition(correct.definition || '')
    setTimeLeft(cfg.time)
    deadlineRef.current = Date.now() + cfg.time
    setFlash(null)
    setPhase('playing')
  }, [terms, cfg.distractors, cfg.time, cfg.speed])

  const advance = useCallback((answered: number, nextScore: number, nextLives: number) => {
    if (answered >= total || nextLives <= 0) { endGame(nextScore, answered); return }
    setQIndex(answered)
    beginQuestion(answered)
  }, [total, endGame, beginQuestion])

  const startGame = useCallback(() => {
    if (terms.length === 0) return
    sfx.start()
    setScore(0); setLives(cfg.lives); setStreak(0); setQIndex(0)
    startRef.current = Date.now()
    beginQuestion(0)
  }, [terms.length, cfg.lives, beginQuestion])

  // miss: timeout or wrong answer
  const miss = useCallback((shownAnswer: string) => {
    if (answeredRef.current) return
    answeredRef.current = true
    sfx.wrong()
    setShake(true); setTimeout(() => setShake(false), 450)
    setStreak(0)
    setPhase('feedback')
    setFlash({ ok: false, answer: shownAnswer })
    const nextLives = lives - 1
    setLives(nextLives)
    setTimeout(() => advance(qIndex + 1, score, nextLives), 850)
  }, [lives, score, qIndex, advance])

  const hit = useCallback((bubble: Bubble) => {
    if (answeredRef.current || phase !== 'playing') return
    if (!bubble.isCorrect) { miss(bubbles.find((b) => b.isCorrect)?.term.term ?? '') ; return }
    answeredRef.current = true
    const frac = Math.max(0, Math.min(1, timeLeft / cfg.time))
    const pts = Math.round(cfg.base * multiplier * (1 + frac))
    sfx.correct()
    if (streak + 1 >= 3) sfx.streak(streak + 1)
    setFloatPts(pts); setTimeout(() => setFloatPts(null), 900)
    setStreak((s) => s + 1)
    setPhase('feedback')
    setFlash({ ok: true, answer: bubble.term.term })
    const ns = score + pts
    setScore(ns)
    setTimeout(() => advance(qIndex + 1, ns, lives), 350)
  }, [phase, bubbles, timeLeft, cfg.time, cfg.base, multiplier, streak, qIndex, lives, score, miss, advance])

  // countdown
  useEffect(() => {
    if (phase !== 'playing') return
    const iv = setInterval(() => {
      const left = deadlineRef.current - Date.now()
      setTimeLeft(left > 0 ? left : 0)
      if (left <= 0 && !answeredRef.current) miss(bubbles.find((b) => b.isCorrect)?.term.term ?? '')
    }, 100)
    return () => clearInterval(iv)
  }, [phase, bubbles, miss])

  // moving targets: drift each bubble and bounce off the arena walls
  useEffect(() => {
    if (phase !== 'playing') return
    let raf = 0
    let last = performance.now()
    const tick = (ts: number) => {
      const dt = Math.min((ts - last) / 1000, 0.05)
      last = ts
      const w = gameAreaRef.current?.clientWidth ?? 900
      const maxX = Math.max(0, w - BUBBLE)
      const maxY = Math.max(0, ARENA_H - BUBBLE)
      const next = bubblesRef.current.map((b) => {
        let { x, y, vx, vy } = b
        x += vx * dt; y += vy * dt
        if (x <= 0) { x = 0; vx = Math.abs(vx) } else if (x >= maxX) { x = maxX; vx = -Math.abs(vx) }
        if (y <= 0) { y = 0; vy = Math.abs(vy) } else if (y >= maxY) { y = maxY; vy = -Math.abs(vy) }
        return { ...b, x, y, vx, vy }
      })
      bubblesRef.current = next
      setBubbles(next)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  if (terms.length === 0) {
    return <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>No vocabulary terms available.</div>
  }

  if (phase === 'waiting') {
    return (
      <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
        <div className="grid place-items-center mx-auto mb-3" style={{ width: 52, height: 52, borderRadius: 14, background: 'color-mix(in oklch, var(--primary) 16%, transparent)', color: 'var(--primary)' }}><Target size={26} /></div>
        <div className="text-xl font-semibold">Word shoot — time attack</div>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Answer fast: speed and combos multiply your score. {best > 0 && <>Beat your best of <b style={{ color: 'var(--foreground)' }}>{best.toLocaleString()}</b>.</>}</p>
        <div className="text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>{cfg.lives} lives · {Math.round(cfg.time / 1000)}s per term · combo up to ×5</div>
        <Button onClick={startGame} size="lg" className="mt-5"><Zap className="h-4 w-4 mr-2" /> Start</Button>
      </div>
    )
  }

  if (phase === 'complete') {
    return <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>Finishing…</div>
  }

  const timePct = Math.round((timeLeft / cfg.time) * 100)
  const expectedByNow = best > 0 ? Math.round(best * (qIndex / total)) : 0
  const ahead = best > 0 && score >= expectedByNow

  return (
    <div className="space-y-3" style={{ color: 'var(--foreground)' }}>
      <style>{`@keyframes arcadeShake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-7px)}40%,60%{transform:translateX(7px)}}.arcade-shake{animation:arcadeShake .45s}@keyframes arcadeFloat{0%{opacity:0;transform:translate(-50%,0) scale(.7)}20%{opacity:1}100%{opacity:0;transform:translate(-50%,-80px) scale(1.15)}}@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>

      {/* header */}
      <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 text-sm">
            <span style={{ color: 'var(--muted-foreground)' }}>{Math.min(qIndex + 1, total)} / {total}</span>
            <span className="font-bold" style={{ fontSize: 18 }}>{score.toLocaleString()}</span>
            {streak > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: 'color-mix(in oklch, var(--reward) 20%, transparent)', color: 'var(--reward)', transform: `scale(${Math.min(1 + streak * 0.04, 1.3)})` }}>
                <Flame className="h-3.5 w-3.5" /> ×{multiplier}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {best > 0 && (
              <span className="inline-flex items-center gap-1 text-xs" style={{ color: ahead ? 'var(--success)' : 'var(--muted-foreground)' }}>
                <Crown className="h-3.5 w-3.5" /> best {best.toLocaleString()}{qIndex > 0 && <span>· {ahead ? 'ahead' : 'behind'}</span>}
              </span>
            )}
            <div className="flex items-center gap-1">
              {Array.from({ length: lives }).map((_, i) => <Heart key={i} className="h-4 w-4" style={{ color: 'var(--reward)', fill: 'currentColor' }} />)}
            </div>
            <SoundToggle />
          </div>
        </div>
        {/* countdown */}
        <div className="h-2 rounded-full mt-2 overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full transition-[width] duration-100 ease-linear" style={{ width: `${timePct}%`, background: timePct < 30 ? '#C08B8B' : 'var(--primary)' }} />
        </div>
      </div>

      {/* definition */}
      <div className="rounded-2xl border p-3 sm:p-4 text-center" style={{ borderColor: 'color-mix(in oklch, var(--primary) 30%, var(--border))', background: 'color-mix(in oklch, var(--primary) 10%, transparent)' }}>
        <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Shoot the term that means:</div>
        <p className="text-sm sm:text-lg font-medium break-words">{definition}</p>
      </div>

      {/* arena */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div ref={gameAreaRef} className={`relative cursor-crosshair ${shake ? 'arcade-shake' : ''}`}
          style={{ height: 540, background: 'radial-gradient(120% 80% at 50% -10%, color-mix(in oklch, var(--primary) 16%, transparent), transparent 60%), var(--card)' }}>

          {floatPts !== null && (
            <div className="absolute left-1/2 pointer-events-none z-20" style={{ top: '40%', animation: 'arcadeFloat 0.9s ease-out forwards' }}>
              <span className="text-4xl font-extrabold" style={{ color: 'var(--success)' }}>+{floatPts}</span>
            </div>
          )}

          {bubbles.map((b) => {
            const popped = Boolean(flash) && b.isCorrect
            return (
              <button key={b.id} onClick={() => hit(b)} disabled={phase !== 'playing'}
                className="absolute grid place-items-center rounded-full text-center px-2 font-bold hover:brightness-105"
                style={{
                  left: b.x, top: b.y, width: BUBBLE, height: BUBBLE,
                  border: '3px solid',
                  borderColor: popped ? 'var(--success)' : 'color-mix(in oklch, var(--primary) 40%, var(--border))',
                  background: popped ? 'color-mix(in oklch, var(--success) 25%, var(--card))' : 'var(--card)',
                  color: 'var(--foreground)', fontSize: 14, lineHeight: 1.1,
                }}>
                {b.term.term}
              </button>
            )
          })}

          {/* non-blocking feedback flash */}
          {flash && !flash.ok && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
              <div className="rounded-full px-4 py-2 text-sm font-medium" style={{ background: 'color-mix(in oklch, #C08B8B 22%, var(--card))', color: '#7a4b4b' }}>
                Answer: <b>{flash.answer}</b>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
