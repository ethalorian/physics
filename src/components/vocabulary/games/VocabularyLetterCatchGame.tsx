"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { VocabularyTerm } from '@/types/assignment'
import { ShoppingBasket, Heart, Flame, Crown, Zap } from 'lucide-react'
import { sfx } from '@/lib/arcade-sound'
import SoundToggle from '@/components/vocabulary/arcade/SoundToggle'

interface VocabularyLetterCatchGameProps {
  vocabularyTerms: VocabularyTerm[]
  onGameComplete?: (score: number, totalQuestions: number, timeSpent: number) => void
  difficulty?: 'easy' | 'medium' | 'hard'
  gameLength?: number
}

// One letter drifting down the arena. `ch` is the uppercase character; `inWord`
// flags whether it belongs to the target word at all (used only for spawn mix).
interface FallingLetter { id: string; ch: string; inWord: boolean; x: number; y: number; vy: number }
type Phase = 'waiting' | 'playing' | 'feedback' | 'complete'

// fall = px/sec range for descending letters; spawnMs = ms between new drops;
// distractorRatio = share of non-needed spawns that are letters NOT in the word;
// msPerLetter = round time budget scales with word length.
// highlightTarget = glow the falling tiles that match the next needed letter.
// On in Easy mode only: it turns the game from spelling-recall into "spot the
// glowing letter," a scaffold for the lowest-readiness students.
// goodChance = how often a fresh drop is the letter you currently need (the rest
// are wrong: a mix of pure distractors and in-word-but-not-next letters). Higher
// = more catchable letters on screen, fewer near-misses.
const CONFIG = {
  easy:   { fallMin: 55,  fallMax: 110, spawnMs: 720, distractorRatio: 0.4,  goodChance: 0.66, lives: 5, msPerLetter: 2600, base: 10, maxOnScreen: 11, highlightTarget: true },
  medium: { fallMin: 75,  fallMax: 150, spawnMs: 560, distractorRatio: 0.45, goodChance: 0.56, lives: 3, msPerLetter: 2000, base: 20, maxOnScreen: 13, highlightTarget: false },
  hard:   { fallMin: 100, fallMax: 205, spawnMs: 430, distractorRatio: 0.5,  goodChance: 0.48, lives: 2, msPerLetter: 1500, base: 30, maxOnScreen: 15, highlightTarget: false },
}

const TILE = 46          // letter tile size (px)
const ARENA_H = 600      // arena height (px) — matches the arena style below
const BASKET_W = 116     // basket sprite width (px)
const BASKET_H = 54      // basket sprite height (px)
const BASKET_GAP = 18    // gap between basket bottom and arena floor (px)
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

// letters of the term, uppercase, ignoring spaces/punctuation for the spelling.
function lettersOf(term: string): string[] {
  return term.toUpperCase().replace(/[^A-Z]/g, '').split('')
}

export default function VocabularyLetterCatchGame({ vocabularyTerms, onGameComplete, difficulty = 'medium', gameLength = 20 }: VocabularyLetterCatchGameProps) {
  const cfg = CONFIG[difficulty]

  const [phase, setPhase] = useState<Phase>('waiting')
  const [terms, setTerms] = useState<VocabularyTerm[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(cfg.lives)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)

  // current round
  const [definition, setDefinition] = useState('')
  const [scramble, setScramble] = useState<string[]>([])   // shuffled letters shown as the hint
  const [target, setTarget] = useState<string[]>([])       // the word's letters, in spelling order
  const [filled, setFilled] = useState(0)                  // how many letters caught so far (the L→R pointer)
  const [letters, setLetters] = useState<FallingLetter[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [roundTime, setRoundTime] = useState(1)

  // feedback / juice
  const [shake, setShake] = useState(false)
  const [floatPts, setFloatPts] = useState<number | null>(null)
  const [flash, setFlash] = useState<{ ok: boolean; answer: string } | null>(null)

  const arenaRef = useRef<HTMLDivElement>(null)
  const lettersRef = useRef<FallingLetter[]>([])
  const filledRef = useRef(0)
  const targetRef = useRef<string[]>([])
  const basketRef = useRef(0)            // basket center x (px)
  const deadlineRef = useRef(0)
  const answeredRef = useRef(false)
  const startRef = useRef(0)
  const spawnAccRef = useRef(0)
  const idRef = useRef(0)
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false })

  const total = Math.min(gameLength, terms.length || gameLength)
  const multiplier = Math.min(1 + Math.floor(streak / 3), 5)

  // shuffle terms once available
  useEffect(() => {
    if (vocabularyTerms.length > 0) setTerms([...vocabularyTerms].sort(() => Math.random() - 0.5))
  }, [vocabularyTerms])

  // fetch personal best for the live pace target
  useEffect(() => {
    fetch('/api/student-progress/game-scores?game_type=letter-catch')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { score?: number }[]) => setBest(Array.isArray(rows) ? rows.reduce((m, x) => Math.max(m, x.score ?? 0), 0) : 0))
      .catch(() => {})
  }, [])

  const endGame = useCallback((finalScore: number, answered: number) => {
    setPhase('complete')
    sfx.gameover()
    onGameComplete?.(finalScore, answered, Math.floor((Date.now() - startRef.current) / 1000))
  }, [onGameComplete])

  const beginRound = useCallback((index: number) => {
    const term = terms[index]
    if (!term) return
    const word = lettersOf(term.term)
    const arenaW = arenaRef.current?.clientWidth ?? 900
    const rt = Math.max(8000, word.length * cfg.msPerLetter)

    targetRef.current = word
    filledRef.current = 0
    lettersRef.current = []
    spawnAccRef.current = 0
    answeredRef.current = false
    basketRef.current = arenaW / 2

    setTarget(word)
    setScramble([...word].sort(() => Math.random() - 0.5))
    setFilled(0)
    setLetters([])
    setDefinition(term.definition || '')
    setRoundTime(rt)
    setTimeLeft(rt)
    deadlineRef.current = Date.now() + rt
    setFlash(null)
    setPhase('playing')
  }, [terms, cfg.msPerLetter])

  const advance = useCallback((answered: number, nextScore: number, nextLives: number) => {
    if (answered >= total || nextLives <= 0) { endGame(nextScore, answered); return }
    setQIndex(answered)
    beginRound(answered)
  }, [total, endGame, beginRound])

  const startGame = useCallback(() => {
    if (terms.length === 0) return
    sfx.start()
    setScore(0); setLives(cfg.lives); setStreak(0); setQIndex(0)
    startRef.current = Date.now()
    beginRound(0)
  }, [terms.length, cfg.lives, beginRound])

  // round failed (ran out of time before spelling the word)
  const failRound = useCallback(() => {
    if (answeredRef.current) return
    answeredRef.current = true
    sfx.wrong()
    setShake(true); setTimeout(() => setShake(false), 450)
    setStreak(0)
    setPhase('feedback')
    setFlash({ ok: false, answer: targetRef.current.join('') })
    const nextLives = lives - 1
    setLives(nextLives)
    setTimeout(() => advance(qIndex + 1, score, nextLives), 1100)
  }, [lives, score, qIndex, advance])

  // round solved (whole word spelled, in order)
  const solveRound = useCallback(() => {
    if (answeredRef.current) return
    answeredRef.current = true
    const frac = Math.max(0, Math.min(1, timeLeft / roundTime))
    const lenBonus = 1 + targetRef.current.length / 10
    const pts = Math.round(cfg.base * multiplier * (1 + frac) * lenBonus)
    sfx.correct()
    if (streak + 1 >= 3) sfx.streak(streak + 1)
    setFloatPts(pts); setTimeout(() => setFloatPts(null), 900)
    setStreak((s) => s + 1)
    setPhase('feedback')
    setFlash({ ok: true, answer: targetRef.current.join('') })
    const ns = score + pts
    setScore(ns)
    setTimeout(() => advance(qIndex + 1, ns, lives), 700)
  }, [timeLeft, roundTime, cfg.base, multiplier, streak, qIndex, lives, score, advance])

  // catching a letter that isn't the next needed one: penalize points + reset combo
  const wrongCatch = useCallback(() => {
    sfx.wrong()
    setStreak(0)
    setShake(true); setTimeout(() => setShake(false), 300)
    setScore((s) => Math.max(0, s - Math.round(cfg.base / 2)))
  }, [cfg.base])

  // catching the correct next letter: fill a slot, maybe finish the word
  const correctCatch = useCallback(() => {
    const next = filledRef.current + 1
    filledRef.current = next
    setFilled(next)
    sfx.tick()
    if (next >= targetRef.current.length) solveRound()
  }, [solveRound])

  // countdown
  useEffect(() => {
    if (phase !== 'playing') return
    const iv = setInterval(() => {
      const left = deadlineRef.current - Date.now()
      setTimeLeft(left > 0 ? left : 0)
      if (left <= 0 && !answeredRef.current) failRound()
    }, 100)
    return () => clearInterval(iv)
  }, [phase, failRound])

  // keyboard control for the basket (accessible alternative to the mouse)
  useEffect(() => {
    if (phase !== 'playing') return
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = true
      if (e.key === 'ArrowRight') keysRef.current.right = true
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = false
      if (e.key === 'ArrowRight') keysRef.current.right = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [phase])

  // main loop: spawn drops, move letters, run basket catches
  useEffect(() => {
    if (phase !== 'playing') return
    let raf = 0
    let last = performance.now()

    const spawn = () => {
      const arenaW = arenaRef.current?.clientWidth ?? 900
      const word = targetRef.current
      const needed = word[filledRef.current]
      const active = lettersRef.current
      if (active.length >= cfg.maxOnScreen) return

      // Always keep the needed letter in play: if none is falling, spawn it now.
      const neededOnScreen = active.some((l) => l.ch === needed)
      let ch: string
      let inWord: boolean
      if (!neededOnScreen || Math.random() < cfg.goodChance) {
        ch = needed; inWord = true
      } else if (Math.random() < cfg.distractorRatio) {
        // a letter NOT in the word at all (pure distractor)
        let c = ALPHABET[Math.floor(Math.random() * 26)]
        let guard = 0
        while (word.includes(c) && guard++ < 10) c = ALPHABET[Math.floor(Math.random() * 26)]
        ch = c; inWord = word.includes(c)
      } else {
        // a letter that IS in the word but (usually) not the one needed next —
        // the discrimination trap that makes "in order" matter.
        ch = word[Math.floor(Math.random() * word.length)]; inWord = true
      }

      const maxX = Math.max(0, arenaW - TILE)
      lettersRef.current = [...active, {
        id: `l${idRef.current++}`,
        ch,
        inWord,
        x: 10 + Math.random() * Math.max(0, maxX - 10),
        y: -TILE,
        vy: cfg.fallMin + Math.random() * (cfg.fallMax - cfg.fallMin),
      }]
    }

    const tick = (ts: number) => {
      const dt = Math.min((ts - last) / 1000, 0.05)
      last = ts
      const arenaW = arenaRef.current?.clientWidth ?? 900

      // move basket with arrow keys (mouse/touch handled by pointer events)
      const speed = 520
      if (keysRef.current.left) basketRef.current -= speed * dt
      if (keysRef.current.right) basketRef.current += speed * dt
      basketRef.current = Math.max(BASKET_W / 2, Math.min(arenaW - BASKET_W / 2, basketRef.current))

      // spawn on cadence
      spawnAccRef.current += dt * 1000
      while (spawnAccRef.current >= cfg.spawnMs) { spawnAccRef.current -= cfg.spawnMs; spawn() }

      const basketCx = basketRef.current
      const catchTop = ARENA_H - BASKET_H - BASKET_GAP
      const needed = targetRef.current[filledRef.current]
      const survivors: FallingLetter[] = []
      let caughtCorrect = false
      let caughtWrong = false

      for (const l of lettersRef.current) {
        const y = l.y + l.vy * dt
        const cx = l.x + TILE / 2
        const overBasket = Math.abs(cx - basketCx) <= BASKET_W / 2 + TILE / 2 * 0.4
        const atBasket = y + TILE >= catchTop && y + TILE <= catchTop + BASKET_H + 14
        if (overBasket && atBasket && !answeredRef.current) {
          if (l.ch === needed && !caughtCorrect) { caughtCorrect = true; continue }
          caughtWrong = true
          continue // wrong letter consumed by the basket
        }
        if (y > ARENA_H + TILE) continue // fell off the floor (no penalty)
        survivors.push({ ...l, y })
      }

      lettersRef.current = survivors
      setLetters(survivors)
      if (caughtCorrect) correctCatch()
      if (caughtWrong) wrongCatch()

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, cfg.maxOnScreen, cfg.spawnMs, cfg.fallMin, cfg.fallMax, cfg.distractorRatio, cfg.goodChance, correctCatch, wrongCatch])

  const moveBasketToClientX = useCallback((clientX: number) => {
    const rect = arenaRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = clientX - rect.left
    basketRef.current = Math.max(BASKET_W / 2, Math.min(rect.width - BASKET_W / 2, x))
  }, [])

  if (terms.length === 0) {
    return <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>No vocabulary terms available.</div>
  }

  if (phase === 'waiting') {
    return (
      <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
        <div className="grid place-items-center mx-auto mb-3" style={{ width: 52, height: 52, borderRadius: 14, background: 'color-mix(in oklch, var(--primary) 16%, transparent)', color: 'var(--primary)' }}><ShoppingBasket size={26} /></div>
        <div className="text-xl font-semibold">Letter Catch</div>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Read the definition, then catch the letters in spelling order. {best > 0 && <>Beat your best of <b style={{ color: 'var(--foreground)' }}>{best.toLocaleString()}</b>.</>}</p>
        <div className="text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>{cfg.lives} lives · move with mouse or ← → · combo up to ×5</div>
        <Button onClick={startGame} size="lg" className="mt-5"><Zap className="h-4 w-4 mr-2" /> Start</Button>
      </div>
    )
  }

  if (phase === 'complete') {
    return <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>Finishing…</div>
  }

  const timePct = Math.round((timeLeft / roundTime) * 100)
  const expectedByNow = best > 0 ? Math.round(best * (qIndex / total)) : 0
  const ahead = best > 0 && score >= expectedByNow
  const basketLeft = basketRef.current - BASKET_W / 2

  return (
    <div className="space-y-3" style={{ color: 'var(--foreground)' }}>
      <style>{`@keyframes lcShake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-6px)}40%,60%{transform:translateX(6px)}}.lc-shake{animation:lcShake .3s}@keyframes lcFloat{0%{opacity:0;transform:translate(-50%,0) scale(.7)}20%{opacity:1}100%{opacity:0;transform:translate(-50%,-80px) scale(1.15)}}@keyframes lcPop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}`}</style>

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

      {/* definition + letter bank hint */}
      <div className="rounded-2xl border p-3 sm:p-4 text-center" style={{ borderColor: 'color-mix(in oklch, var(--primary) 30%, var(--border))', background: 'color-mix(in oklch, var(--primary) 10%, transparent)' }}>
        <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Spell the term that means:</div>
        <p className="text-sm sm:text-lg font-medium break-words">{definition}</p>
        <div className="flex flex-wrap justify-center gap-1.5 mt-2.5">
          {scramble.map((ch, i) => (
            <span key={i} className="grid place-items-center rounded-md text-xs font-bold" style={{ width: 22, height: 22, background: 'color-mix(in oklch, var(--primary) 18%, var(--card))', color: 'var(--primary)' }}>{ch}</span>
          ))}
        </div>
      </div>

      {/* progress slots */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {target.map((ch, i) => {
          const done = i < filled
          const isNext = i === filled
          return (
            <span key={i} className="grid place-items-center rounded-lg font-bold"
              style={{
                width: 34, height: 40, fontSize: 18,
                border: '2px solid',
                borderColor: done ? 'var(--success)' : isNext ? 'var(--primary)' : 'var(--border)',
                background: done ? 'color-mix(in oklch, var(--success) 18%, var(--card))' : 'var(--card)',
                color: done ? 'var(--success)' : 'var(--foreground)',
                boxShadow: isNext ? '0 0 0 3px color-mix(in oklch, var(--primary) 22%, transparent)' : 'none',
              }}>
              {done ? ch : ''}
            </span>
          )
        })}
      </div>

      {/* arena */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div ref={arenaRef}
          onMouseMove={(e) => moveBasketToClientX(e.clientX)}
          onTouchMove={(e) => { if (e.touches[0]) moveBasketToClientX(e.touches[0].clientX) }}
          className={`relative touch-none select-none ${shake ? 'lc-shake' : ''}`}
          style={{ height: ARENA_H, cursor: 'none', background: 'radial-gradient(120% 80% at 50% -10%, color-mix(in oklch, var(--primary) 16%, transparent), transparent 60%), var(--card)' }}>

          {floatPts !== null && (
            <div className="absolute left-1/2 pointer-events-none z-20" style={{ top: '38%', animation: 'lcFloat 0.9s ease-out forwards' }}>
              <span className="text-4xl font-extrabold" style={{ color: 'var(--success)' }}>+{floatPts}</span>
            </div>
          )}

          {/* falling letters — in Easy mode the next-needed letter glows as a scaffold */}
          {letters.map((l) => {
            const glow = cfg.highlightTarget && l.ch === target[filled]
            return (
              <div key={l.id} className="absolute grid place-items-center rounded-lg font-bold pointer-events-none"
                style={{
                  left: l.x, top: l.y, width: TILE, height: TILE, fontSize: 22,
                  border: glow ? '2px solid var(--success)' : '2px solid color-mix(in oklch, var(--primary) 30%, var(--border))',
                  background: glow ? 'color-mix(in oklch, var(--success) 22%, var(--card))' : 'var(--card)',
                  color: glow ? 'var(--success)' : 'var(--foreground)',
                  boxShadow: glow ? '0 0 0 4px color-mix(in oklch, var(--success) 28%, transparent), 0 2px 8px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.08)',
                }}>
                {l.ch}
              </div>
            )
          })}

          {/* basket sprite — open top, sits clear of the arena floor */}
          <div className="absolute pointer-events-none flex flex-col items-center" style={{ left: basketLeft, top: ARENA_H - BASKET_H - BASKET_GAP, width: BASKET_W, height: BASKET_H, zIndex: 10 }}>
            {/* rim line marks the catch opening */}
            <div style={{ width: '100%', height: 5, borderRadius: 999, background: 'var(--primary)' }} />
            <div className="flex-1 w-full grid place-items-center rounded-b-2xl"
              style={{ marginTop: 2, background: 'color-mix(in oklch, var(--primary) 22%, var(--card))', border: '3px solid var(--primary)', borderTopWidth: 0 }}>
              <ShoppingBasket size={26} style={{ color: 'var(--primary)' }} />
            </div>
          </div>

          {/* feedback flash */}
          {flash && (
            <div className="absolute inset-x-0 bottom-2 flex justify-center pointer-events-none z-20">
              <div className="rounded-full px-4 py-2 text-sm font-medium" style={flash.ok
                ? { background: 'color-mix(in oklch, var(--success) 22%, var(--card))', color: 'var(--success)' }
                : { background: 'color-mix(in oklch, #C08B8B 22%, var(--card))', color: '#7a4b4b' }}>
                {flash.ok ? <>Nice! <b>{flash.answer}</b></> : <>Answer: <b>{flash.answer}</b></>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
