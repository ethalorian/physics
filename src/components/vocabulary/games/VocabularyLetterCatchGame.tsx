"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { VocabularyTerm } from '@/types/assignment'
import { ShoppingBasket, Flame, Crown, Zap, Clock, SkipForward } from 'lucide-react'
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
// distractorRatio = of the WRONG drops, the share that are letters not in the word.
// neededMin = how many copies of each "wanted" letter (current + next) we keep
// in flight, so you never wait for the letter you need. highlightTarget glows the
// current needed letter (Easy only). msPerLetter sizes the relaxed game clock;
// parPerLetter sets the speed-bonus pace.
const CONFIG = {
  easy:   { fallMin: 42, fallMax: 82,  spawnMs: 620, distractorRatio: 0.4,  neededMin: 3, base: 10, maxOnScreen: 12, highlightTarget: true,  msPerLetter: 2200, parPerLetter: 3200 },
  medium: { fallMin: 58, fallMax: 112, spawnMs: 520, distractorRatio: 0.5,  neededMin: 2, base: 20, maxOnScreen: 13, highlightTarget: false, msPerLetter: 1800, parPerLetter: 2500 },
  hard:   { fallMin: 78, fallMax: 152, spawnMs: 440, distractorRatio: 0.58, neededMin: 2, base: 30, maxOnScreen: 15, highlightTarget: false, msPerLetter: 1500, parPerLetter: 2000 },
}

const TILE = 46          // letter tile size (px)
const ARENA_H = 600      // arena height (px) — matches the arena style below
const BASKET_W = 124     // basket sprite width (px)
const BASKET_H = 54      // basket sprite height (px)
const BASKET_GAP = 18    // gap between basket bottom and arena floor (px)
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

// letters of the term, uppercase, ignoring spaces/punctuation for the spelling.
function lettersOf(term: string): string[] {
  return term.toUpperCase().replace(/[^A-Z]/g, '').split('')
}

function fmtTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function VocabularyLetterCatchGame({ vocabularyTerms, onGameComplete, difficulty = 'medium', gameLength = 10 }: VocabularyLetterCatchGameProps) {
  const cfg = CONFIG[difficulty]

  const [phase, setPhase] = useState<Phase>('waiting')
  const [terms, setTerms] = useState<VocabularyTerm[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)

  // current round
  const [definition, setDefinition] = useState('')
  const [scramble, setScramble] = useState<string[]>([])   // shuffled letters shown as the hint
  const [target, setTarget] = useState<string[]>([])       // the word's letters, in spelling order
  const [filled, setFilled] = useState(0)                  // how many letters caught so far (the L→R pointer)
  const [letters, setLetters] = useState<FallingLetter[]>([])

  // one relaxed clock for the whole game
  const [gameLeft, setGameLeft] = useState(0)
  const [gameTotal, setGameTotal] = useState(1)

  // feedback / juice
  const [shake, setShake] = useState(false)
  const [floatPts, setFloatPts] = useState<number | null>(null)
  const [flash, setFlash] = useState<{ ok: boolean; answer: string } | null>(null)

  const arenaRef = useRef<HTMLDivElement>(null)
  const lettersRef = useRef<FallingLetter[]>([])
  const filledRef = useRef(0)
  const targetRef = useRef<string[]>([])
  const basketRef = useRef(0)            // basket center x (px)
  const answeredRef = useRef(false)
  const startRef = useRef(0)             // game start (for timeSpent)
  const wordStartRef = useRef(0)         // current word start (for speed bonus)
  const gameDeadlineRef = useRef(0)      // when the whole game ends
  const endedRef = useRef(false)
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
    if (endedRef.current) return
    endedRef.current = true
    setPhase('complete')
    sfx.gameover()
    onGameComplete?.(finalScore, answered, Math.floor((Date.now() - startRef.current) / 1000))
  }, [onGameComplete])

  // make a fresh falling letter at the top of the arena
  const makeLetter = useCallback((ch: string, inWord: boolean, yStart = -TILE): FallingLetter => {
    const arenaW = arenaRef.current?.clientWidth ?? 900
    const maxX = Math.max(0, arenaW - TILE)
    return {
      id: `l${idRef.current++}`,
      ch, inWord,
      x: 10 + Math.random() * Math.max(0, maxX - 10),
      y: yStart,
      vy: cfg.fallMin + Math.random() * (cfg.fallMax - cfg.fallMin),
    }
  }, [cfg.fallMin, cfg.fallMax])

  const beginRound = useCallback((index: number) => {
    const term = terms[index]
    if (!term) return
    const word = lettersOf(term.term)

    targetRef.current = word
    filledRef.current = 0
    spawnAccRef.current = 0
    answeredRef.current = false
    wordStartRef.current = Date.now()
    basketRef.current = (arenaRef.current?.clientWidth ?? 900) / 2

    // pre-seed so the round is lively immediately: a couple copies of the first
    // letter (one already partway down) + the second letter + a couple wrong ones.
    const seed: FallingLetter[] = []
    const cur = word[0]
    const nxt = word[1]
    seed.push(makeLetter(cur, true, -TILE))
    seed.push(makeLetter(cur, true, ARENA_H * 0.22))
    if (nxt) seed.push(makeLetter(nxt, true, -TILE))
    for (let i = 0; i < 2; i++) {
      let c = ALPHABET[Math.floor(Math.random() * 26)]
      let guard = 0
      while (word.includes(c) && guard++ < 10) c = ALPHABET[Math.floor(Math.random() * 26)]
      seed.push(makeLetter(c, false, ARENA_H * (0.05 + Math.random() * 0.25)))
    }
    lettersRef.current = seed

    setTarget(word)
    setScramble([...word].sort(() => Math.random() - 0.5))
    setFilled(0)
    setLetters(seed)
    setDefinition(term.definition || '')
    setFlash(null)
    setPhase('playing')
  }, [terms, makeLetter])

  const advance = useCallback((answered: number) => {
    if (answered >= total) { endGame(score, answered); return }
    if (Date.now() >= gameDeadlineRef.current) { endGame(score, answered); return }
    setQIndex(answered)
    beginRound(answered)
  }, [total, endGame, score, beginRound])

  const startGame = useCallback(() => {
    if (terms.length === 0) return
    sfx.start()
    endedRef.current = false
    setScore(0); setStreak(0); setQIndex(0)
    startRef.current = Date.now()
    // relaxed clock sized to the actual words chosen (shared pool — easy words
    // bank time for harder ones), with a generous floor.
    const chosen = terms.slice(0, total)
    const budget = chosen.reduce((s, t) => s + lettersOf(t.term).length * cfg.msPerLetter, 0)
    const gameTime = Math.max(45000, budget)
    gameDeadlineRef.current = Date.now() + gameTime
    setGameTotal(gameTime)
    setGameLeft(gameTime)
    beginRound(0)
  }, [terms, total, cfg.msPerLetter, beginRound])

  // round solved (whole word spelled, in order)
  const solveRound = useCallback(() => {
    if (answeredRef.current) return
    answeredRef.current = true
    const word = targetRef.current
    const elapsed = Date.now() - wordStartRef.current
    const par = Math.max(1, word.length * cfg.parPerLetter)
    const speedFrac = Math.max(0, Math.min(1, 1 - elapsed / par))
    const lenBonus = 1 + word.length / 10
    const pts = Math.round(cfg.base * multiplier * (1 + speedFrac) * lenBonus)
    sfx.correct()
    if (streak + 1 >= 3) sfx.streak(streak + 1)
    setFloatPts(pts); setTimeout(() => setFloatPts(null), 900)
    setStreak((s) => s + 1)
    setPhase('feedback')
    setFlash({ ok: true, answer: word.join('') })
    const ns = score + pts
    setScore(ns)
    setTimeout(() => advance(qIndex + 1), 550)
  }, [cfg.parPerLetter, cfg.base, multiplier, streak, qIndex, score, advance])

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

  // skip the current word (e.g., you don't know the spelling) — resets combo, no other penalty
  const skipWord = useCallback(() => {
    if (answeredRef.current) return
    answeredRef.current = true
    setStreak(0)
    setPhase('feedback')
    setFlash({ ok: false, answer: targetRef.current.join('') })
    setTimeout(() => advance(qIndex + 1), 900)
  }, [qIndex, advance])

  // one relaxed countdown for the whole game
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'feedback') return
    const iv = setInterval(() => {
      const left = gameDeadlineRef.current - Date.now()
      setGameLeft(left > 0 ? left : 0)
      if (left <= 0) endGame(score, qIndex)
    }, 100)
    return () => clearInterval(iv)
  }, [phase, endGame, score, qIndex])

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

  // main loop: keep the wanted letters supplied, move letters, run basket catches
  useEffect(() => {
    if (phase !== 'playing') return
    let raf = 0
    let last = performance.now()

    // Always keep copies of the CURRENT and NEXT needed letters in flight, so the
    // moment you catch one the next is already falling — no dead waiting. Spawns
    // top up whichever wanted letter is short; otherwise it drops a wrong letter.
    const spawn = () => {
      const word = targetRef.current
      const fi = filledRef.current
      const active = lettersRef.current
      const wants = Array.from(new Set([word[fi], word[fi + 1]].filter(Boolean))) as string[]
      const countOf = (c: string) => active.filter((l) => l.ch === c).length
      const deficient = wants.filter((c) => countOf(c) < cfg.neededMin).sort((a, b) => countOf(a) - countOf(b))

      if (deficient.length > 0) {
        // make room if at the cap by evicting the lowest wrong letter
        if (active.length >= cfg.maxOnScreen) {
          let evict = -1, lowY = -Infinity
          for (let i = 0; i < active.length; i++) {
            if (!wants.includes(active[i].ch) && active[i].y > lowY) { lowY = active[i].y; evict = i }
          }
          if (evict >= 0) active.splice(evict, 1)
          else return // everything on screen is wanted; that's fine
        }
        active.push(makeLetter(deficient[0], true))
        return
      }

      if (active.length >= cfg.maxOnScreen) return
      // spawn a wrong letter: pure distractor, or an in-word letter that isn't wanted
      if (Math.random() < cfg.distractorRatio) {
        let c = ALPHABET[Math.floor(Math.random() * 26)]
        let guard = 0
        while (word.includes(c) && guard++ < 10) c = ALPHABET[Math.floor(Math.random() * 26)]
        active.push(makeLetter(c, word.includes(c)))
      } else {
        const pool = word.filter((c) => !wants.includes(c))
        const c = (pool.length > 0 ? pool : word)[Math.floor(Math.random() * (pool.length > 0 ? pool.length : word.length))]
        active.push(makeLetter(c, true))
      }
    }

    const tick = (ts: number) => {
      const dt = Math.min((ts - last) / 1000, 0.05)
      last = ts
      const arenaW = arenaRef.current?.clientWidth ?? 900

      // move basket with arrow keys (mouse/touch handled by pointer events)
      const speed = 540
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
        const overBasket = Math.abs(cx - basketCx) <= BASKET_W / 2 + TILE * 0.2
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
  }, [phase, cfg.maxOnScreen, cfg.spawnMs, cfg.neededMin, cfg.distractorRatio, makeLetter, correctCatch, wrongCatch])

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
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Read the definition, then catch the letters in spelling order. Spell as many as you can before the clock runs out. {best > 0 && <>Beat your best of <b style={{ color: 'var(--foreground)' }}>{best.toLocaleString()}</b>.</>}</p>
        <div className="text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>Move with mouse or ← → · faster spelling &amp; combos score more</div>
        <Button onClick={startGame} size="lg" className="mt-5"><Zap className="h-4 w-4 mr-2" /> Start</Button>
      </div>
    )
  }

  if (phase === 'complete') {
    return <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>Finishing…</div>
  }

  const timePct = Math.round((gameLeft / gameTotal) * 100)
  const lowTime = gameLeft <= 15000
  const expectedByNow = best > 0 ? Math.round(best * (qIndex / total)) : 0
  const ahead = best > 0 && score >= expectedByNow
  const basketLeft = basketRef.current - BASKET_W / 2

  return (
    <div className="space-y-3" style={{ color: 'var(--foreground)' }}>
      <style>{`@keyframes lcShake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-6px)}40%,60%{transform:translateX(6px)}}.lc-shake{animation:lcShake .3s}@keyframes lcFloat{0%{opacity:0;transform:translate(-50%,0) scale(.7)}20%{opacity:1}100%{opacity:0;transform:translate(-50%,-80px) scale(1.15)}}`}</style>

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
            <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums" style={{ color: lowTime ? '#C08B8B' : 'var(--foreground)' }}>
              <Clock className="h-4 w-4" /> {fmtTime(gameLeft)}
            </span>
            <SoundToggle />
          </div>
        </div>
        {/* game clock */}
        <div className="h-2 rounded-full mt-2 overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full transition-[width] duration-100 ease-linear" style={{ width: `${timePct}%`, background: lowTime ? '#C08B8B' : 'var(--primary)' }} />
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

      {/* progress slots + skip */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
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
        <button onClick={skipWord} disabled={phase !== 'playing'}
          className="inline-flex items-center gap-1 text-xs rounded-lg border px-2.5 py-1.5"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
          <SkipForward className="h-3.5 w-3.5" /> Skip
        </button>
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
