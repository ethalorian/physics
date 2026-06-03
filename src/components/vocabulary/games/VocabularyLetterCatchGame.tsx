"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { VocabularyTerm } from '@/types/assignment'
import { ShoppingBasket, Flame, Crown, Zap, Clock, SkipForward, Star, Timer, Wand2, Eraser, Skull } from 'lucide-react'
import { sfx } from '@/lib/arcade-sound'
import SoundToggle from '@/components/vocabulary/arcade/SoundToggle'

interface VocabularyLetterCatchGameProps {
  vocabularyTerms: VocabularyTerm[]
  onGameComplete?: (score: number, totalQuestions: number, timeSpent: number) => void
  difficulty?: 'easy' | 'medium' | 'hard'
  gameLength?: number
}

type Power = 'golden' | 'slow' | 'wild' | 'broom'
// A falling tile. `kind` decides how the SELECTIVE basket treats it:
//   letter (needed) → caught; letter (wrong) → bounces off harmlessly;
//   power → caught, fires an effect; hazard → caught = penalty (dodge it).
interface Tile { id: string; kind: 'letter' | 'power' | 'hazard'; ch: string; power?: Power; inWord: boolean; x: number; y: number; vy: number; vx: number; bounced?: boolean }
interface Particle { id: number; x: number; y: number; vx: number; vy: number; life: number; max: number; color: string }
interface Float { id: number; x: number; y: number; text: string; color: string }
type Phase = 'waiting' | 'playing' | 'feedback' | 'complete'

const CONFIG = {
  easy:   { fallMin: 48, fallMax: 92,  spawnMs: 600, neededMin: 3, base: 10, maxOnScreen: 12, highlightTarget: true,  msPerLetter: 2400, parPerLetter: 3200, hazardChance: 0.06, powerChance: 0.06 },
  medium: { fallMin: 64, fallMax: 118, spawnMs: 500, neededMin: 2, base: 20, maxOnScreen: 14, highlightTarget: false, msPerLetter: 2000, parPerLetter: 2500, hazardChance: 0.10, powerChance: 0.05 },
  hard:   { fallMin: 84, fallMax: 158, spawnMs: 420, neededMin: 2, base: 30, maxOnScreen: 16, highlightTarget: false, msPerLetter: 1650, parPerLetter: 2000, hazardChance: 0.14, powerChance: 0.045 },
}

const TILE = 48
const ARENA_H = 600
const BASKET_W = 152        // wider basket — easier to snag the right letter
const BASKET_H = 58
const BASKET_GAP = 16
const CATCH_BAND = 16       // taller catch zone
const MAGNET_X = 100        // horizontal reach of the magnet (px)
const MAGNET_Y = 230        // how far above the basket the magnet starts pulling (px)
const MAGNET_PULL = 380     // px/sec the helpful tile slides toward the basket center
const SLOW_MS = 4500        // slow-mo duration
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const POWERS: Record<Power, { color: string; label: string }> = {
  golden: { color: 'var(--reward)', label: 'Bonus!' },
  slow:   { color: '#3A6FA5', label: 'Slow-mo' },
  wild:   { color: 'var(--primary)', label: 'Wild — slot filled' },
  broom:  { color: 'var(--success)', label: 'Cleared!' },
}

function lettersOf(term: string): string[] { return term.toUpperCase().replace(/[^A-Z]/g, '').split('') }
function fmtTime(ms: number): string { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

export default function VocabularyLetterCatchGame({ vocabularyTerms, onGameComplete, difficulty = 'medium', gameLength = 10 }: VocabularyLetterCatchGameProps) {
  const cfg = CONFIG[difficulty]

  const [phase, setPhase] = useState<Phase>('waiting')
  const [terms, setTerms] = useState<VocabularyTerm[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)

  const [definition, setDefinition] = useState('')
  const [scramble, setScramble] = useState<string[]>([])
  const [target, setTarget] = useState<string[]>([])
  const [filled, setFilled] = useState(0)
  const [tiles, setTiles] = useState<Tile[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [floats, setFloats] = useState<Float[]>([])
  const [slowOn, setSlowOn] = useState(false)

  const [gameLeft, setGameLeft] = useState(0)
  const [gameTotal, setGameTotal] = useState(1)
  const [shake, setShake] = useState(false)
  const [flash, setFlash] = useState<{ ok: boolean; answer: string } | null>(null)

  const arenaRef = useRef<HTMLDivElement>(null)
  const tilesRef = useRef<Tile[]>([])
  const particlesRef = useRef<Particle[]>([])
  const filledRef = useRef(0)
  const targetRef = useRef<string[]>([])
  const basketRef = useRef(0)
  const answeredRef = useRef(false)
  const startRef = useRef(0)
  const wordStartRef = useRef(0)
  const gameDeadlineRef = useRef(0)
  const slowUntilRef = useRef(0)
  const endedRef = useRef(false)
  const spawnAccRef = useRef(0)
  const idRef = useRef(0)
  const pidRef = useRef(0)
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false })
  const streakRef = useRef(0)

  const total = Math.min(gameLength, terms.length || gameLength)
  const multiplier = Math.min(1 + Math.floor(streak / 3), 5)

  useEffect(() => { if (vocabularyTerms.length > 0) setTerms([...vocabularyTerms].sort(() => Math.random() - 0.5)) }, [vocabularyTerms])
  useEffect(() => {
    fetch('/api/student-progress/game-scores?game_type=letter-catch')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { score?: number }[]) => setBest(Array.isArray(rows) ? rows.reduce((m, x) => Math.max(m, x.score ?? 0), 0) : 0))
      .catch(() => {})
  }, [])

  const pushFloat = useCallback((x: number, y: number, text: string, color: string) => {
    const id = pidRef.current++
    setFloats((f) => [...f, { id, x, y, text, color }])
    setTimeout(() => setFloats((f) => f.filter((p) => p.id !== id)), 850)
  }, [])
  const pushBurst = useCallback((x: number, y: number, color: string) => {
    const added: Particle[] = Array.from({ length: 10 }, () => ({
      id: idRef.current++, x, y,
      vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 240 - 40,
      life: 0.6, max: 0.6, color,
    }))
    particlesRef.current = [...particlesRef.current, ...added].slice(-70)
  }, [])

  const endGame = useCallback((finalScore: number, answered: number) => {
    if (endedRef.current) return
    endedRef.current = true
    setPhase('complete'); sfx.gameover()
    onGameComplete?.(finalScore, answered, Math.floor((Date.now() - startRef.current) / 1000))
  }, [onGameComplete])

  const makeTile = useCallback((kind: Tile['kind'], ch: string, inWord: boolean, power?: Power, yStart = -TILE): Tile => {
    const w = arenaRef.current?.clientWidth ?? 900
    const maxX = Math.max(0, w - TILE)
    return { id: `t${idRef.current++}`, kind, ch, power, inWord, x: 10 + Math.random() * Math.max(0, maxX - 10), y: yStart, vy: cfg.fallMin + Math.random() * (cfg.fallMax - cfg.fallMin), vx: 0 }
  }, [cfg.fallMin, cfg.fallMax])

  const beginRound = useCallback((index: number) => {
    const term = terms[index]
    if (!term) return
    const word = lettersOf(term.term)
    targetRef.current = word; filledRef.current = 0; spawnAccRef.current = 0; answeredRef.current = false
    wordStartRef.current = Date.now()
    basketRef.current = (arenaRef.current?.clientWidth ?? 900) / 2
    const seed: Tile[] = []
    seed.push(makeTile('letter', word[0], true, undefined, -TILE))
    seed.push(makeTile('letter', word[0], true, undefined, ARENA_H * 0.22))
    if (word[1]) seed.push(makeTile('letter', word[1], true, undefined, -TILE))
    for (let i = 0; i < 2; i++) {
      let c = ALPHABET[Math.floor(Math.random() * 26)]; let g = 0
      while (word.includes(c) && g++ < 10) c = ALPHABET[Math.floor(Math.random() * 26)]
      seed.push(makeTile('letter', c, false, undefined, ARENA_H * (0.05 + Math.random() * 0.25)))
    }
    tilesRef.current = seed
    setTarget(word); setScramble([...word].sort(() => Math.random() - 0.5)); setFilled(0); setTiles(seed)
    setDefinition(term.definition || ''); setFlash(null); setPhase('playing')
  }, [terms, makeTile])

  const advance = useCallback((answered: number) => {
    if (answered >= total || Date.now() >= gameDeadlineRef.current) { endGame(score, answered); return }
    setQIndex(answered); beginRound(answered)
  }, [total, endGame, score, beginRound])

  const startGame = useCallback(() => {
    if (terms.length === 0) return
    sfx.start(); endedRef.current = false
    setScore(0); setStreak(0); streakRef.current = 0; setQIndex(0)
    startRef.current = Date.now(); slowUntilRef.current = 0
    const chosen = terms.slice(0, total)
    const budget = chosen.reduce((s, t) => s + lettersOf(t.term).length * cfg.msPerLetter, 0)
    const gameTime = Math.max(45000, budget)
    gameDeadlineRef.current = Date.now() + gameTime
    setGameTotal(gameTime); setGameLeft(gameTime)
    beginRound(0)
  }, [terms, total, cfg.msPerLetter, beginRound])

  const solveRound = useCallback(() => {
    if (answeredRef.current) return
    answeredRef.current = true
    const word = targetRef.current
    const elapsed = Date.now() - wordStartRef.current
    const par = Math.max(1, word.length * cfg.parPerLetter)
    const speedFrac = Math.max(0, Math.min(1, 1 - elapsed / par))
    const pts = Math.round(cfg.base * multiplier * (1 + speedFrac) * (1 + word.length / 10))
    sfx.correct(); if (streakRef.current + 1 >= 3) sfx.streak(streakRef.current + 1)
    setStreak((s) => { streakRef.current = s + 1; return s + 1 })
    setPhase('feedback'); setFlash({ ok: true, answer: word.join('') })
    const ns = score + pts; setScore(ns)
    pushFloat((arenaRef.current?.clientWidth ?? 900) / 2, ARENA_H * 0.4, `+${pts}`, 'var(--success)')
    setTimeout(() => advance(qIndex + 1), 600)
  }, [cfg.parPerLetter, cfg.base, multiplier, qIndex, score, advance, pushFloat])

  // catching the correct next letter (or a wild power): fill a slot, maybe finish
  const fillSlot = useCallback(() => {
    const next = filledRef.current + 1
    filledRef.current = next; setFilled(next)
    sfx.tick()
    if (next >= targetRef.current.length) solveRound()
  }, [solveRound])

  const hazardHit = useCallback(() => {
    sfx.wrong(); setStreak(0); streakRef.current = 0
    setShake(true); setTimeout(() => setShake(false), 320)
    setScore((s) => Math.max(0, s - cfg.base))
    pushFloat(basketRef.current, ARENA_H - BASKET_H - BASKET_GAP - 10, '✕', '#C0392B')
  }, [cfg.base, pushFloat])

  const applyPower = useCallback((power: Power) => {
    const bx = basketRef.current, by = ARENA_H - BASKET_H - BASKET_GAP - 10
    const meta = POWERS[power]
    if (power === 'golden') {
      const bonus = cfg.base * 3 * multiplier
      setScore((s) => s + bonus); pushFloat(bx, by, `+${bonus}`, meta.color)
    } else if (power === 'slow') {
      slowUntilRef.current = Date.now() + SLOW_MS; pushFloat(bx, by, meta.label, meta.color)
    } else if (power === 'wild') {
      pushFloat(bx, by, meta.label, meta.color); fillSlot()
    } else if (power === 'broom') {
      pushFloat(bx, by, meta.label, meta.color)
    }
    sfx.streak(6)
  }, [cfg.base, multiplier, fillSlot, pushFloat])

  const skipWord = useCallback(() => {
    if (answeredRef.current) return
    answeredRef.current = true; setStreak(0); streakRef.current = 0
    setPhase('feedback'); setFlash({ ok: false, answer: targetRef.current.join('') })
    setTimeout(() => advance(qIndex + 1), 850)
  }, [qIndex, advance])

  // global clock
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'feedback') return
    const iv = setInterval(() => {
      const left = gameDeadlineRef.current - Date.now()
      setGameLeft(left > 0 ? left : 0)
      if (left <= 0) endGame(score, qIndex)
    }, 100)
    return () => clearInterval(iv)
  }, [phase, endGame, score, qIndex])

  // keyboard basket control
  useEffect(() => {
    if (phase !== 'playing') return
    const down = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') keysRef.current.left = true; if (e.key === 'ArrowRight') keysRef.current.right = true }
    const up = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') keysRef.current.left = false; if (e.key === 'ArrowRight') keysRef.current.right = false }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [phase])

  // main loop
  useEffect(() => {
    if (phase !== 'playing') return
    let raf = 0; let last = performance.now()

    const spawn = () => {
      const word = targetRef.current, fi = filledRef.current
      const active = tilesRef.current
      const wants = Array.from(new Set([word[fi], word[fi + 1]].filter(Boolean))) as string[]
      const countOf = (c: string) => active.filter((t) => t.kind === 'letter' && t.ch === c).length
      const deficient = wants.filter((c) => countOf(c) < cfg.neededMin).sort((a, b) => countOf(a) - countOf(b))
      if (deficient.length > 0) {
        if (active.length >= cfg.maxOnScreen) {
          // evict the lowest non-wanted, non-power tile to make room for a needed letter
          let evict = -1, lowY = -Infinity
          for (let i = 0; i < active.length; i++) { const t = active[i]; if (t.kind !== 'power' && !(t.kind === 'letter' && wants.includes(t.ch)) && t.y > lowY) { lowY = t.y; evict = i } }
          if (evict >= 0) active.splice(evict, 1); else return
        }
        active.push(makeTile('letter', deficient[0], true)); return
      }
      if (active.length >= cfg.maxOnScreen) return
      const r = Math.random()
      const powerCount = active.filter((t) => t.kind === 'power').length
      const hazardCount = active.filter((t) => t.kind === 'hazard').length
      if (powerCount < 1 && r < cfg.powerChance) {
        const pool: Power[] = ['golden', 'slow', 'wild', 'broom']
        active.push(makeTile('power', '', false, pool[Math.floor(Math.random() * pool.length)]))
      } else if (hazardCount < 2 && r < cfg.powerChance + cfg.hazardChance) {
        active.push(makeTile('hazard', '', false))
      } else {
        // harmless filler letter — usually a real wrong letter to search past
        let c: string
        if (Math.random() < 0.5) { const pool = word.filter((x) => !wants.includes(x)); c = (pool.length ? pool : word)[Math.floor(Math.random() * (pool.length ? pool.length : word.length))] }
        else { c = ALPHABET[Math.floor(Math.random() * 26)]; let g = 0; while (word.includes(c) && g++ < 10) c = ALPHABET[Math.floor(Math.random() * 26)] }
        active.push(makeTile('letter', c, word.includes(c)))
      }
    }

    const tick = (ts: number) => {
      const dt = Math.min((ts - last) / 1000, 0.05); last = ts
      const w = arenaRef.current?.clientWidth ?? 900
      const now = ts + performance.timeOrigin
      const slow = now < slowUntilRef.current
      setSlowOn(slow)
      const speed = (slow ? 0.42 : 1) * (1 + Math.min(filledRef.current, 10) * 0.04) // per-word escalation

      // basket via keys (pointer handled by events)
      if (keysRef.current.left) basketRef.current -= 560 * dt
      if (keysRef.current.right) basketRef.current += 560 * dt
      basketRef.current = Math.max(BASKET_W / 2, Math.min(w - BASKET_W / 2, basketRef.current))

      spawnAccRef.current += dt * 1000
      while (spawnAccRef.current >= cfg.spawnMs) { spawnAccRef.current -= cfg.spawnMs; spawn() }

      const bcx = basketRef.current
      const catchTop = ARENA_H - BASKET_H - BASKET_GAP
      const needed = targetRef.current[filledRef.current]
      const survivors: Tile[] = []
      let caughtNeeded: { x: number; y: number } | null = null
      const powersCaught: Power[] = []
      let hazard = false, broom = false

      for (const t of tilesRef.current) {
        const y = t.y + t.vy * speed * dt
        let x = t.x + t.vx * dt
        const helpful = t.kind === 'power' || (t.kind === 'letter' && t.ch === needed)
        if (helpful && !answeredRef.current && !t.bounced) {
          const cx = x + TILE / 2, d = bcx - cx
          if (Math.abs(d) <= MAGNET_X && y + TILE >= catchTop - MAGNET_Y) x += Math.sign(d) * Math.min(Math.abs(d), MAGNET_PULL * dt)
        }
        const cx = x + TILE / 2
        const atBasket = y + TILE >= catchTop && y + TILE <= catchTop + BASKET_H + CATCH_BAND
        const over = Math.abs(cx - bcx) <= BASKET_W / 2 + TILE * 0.1
        if (atBasket && over && !answeredRef.current) {
          if (t.kind === 'letter' && t.ch === needed) { caughtNeeded = { x: cx, y: catchTop }; continue }
          if (t.kind === 'power') { if (t.power === 'broom') broom = true; powersCaught.push(t.power!); pushBurst(cx, catchTop, POWERS[t.power!].color); continue }
          if (t.kind === 'hazard') { hazard = true; pushBurst(cx, catchTop, '#C0392B'); continue }
          if (t.kind === 'letter' && !t.bounced) { survivors.push({ ...t, x, y, vy: -Math.abs(t.vy) * 0.5, vx: (cx < bcx ? -1 : 1) * 80, bounced: true }); continue }
        }
        if (y > ARENA_H + TILE) continue
        survivors.push({ ...t, x, y })
      }

      let next = survivors
      if (broom) next = survivors.filter((t) => t.kind === 'power' || (t.kind === 'letter' && [needed, targetRef.current[filledRef.current + 1]].includes(t.ch)))
      tilesRef.current = next; setTiles(next)

      // particles step
      if (particlesRef.current.length) {
        const ps = particlesRef.current.map((p) => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, vy: p.vy + 520 * dt, life: p.life - dt })).filter((p) => p.life > 0)
        particlesRef.current = ps; setParticles(ps)
      } else if (particles.length) { setParticles([]) }

      // apply catch effects
      if (caughtNeeded) { sfx.tick(); pushBurst(caughtNeeded.x, caughtNeeded.y, 'var(--success)'); fillSlot() }
      for (const p of powersCaught) applyPower(p)
      if (hazard) hazardHit()

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, cfg.maxOnScreen, cfg.spawnMs, cfg.neededMin, cfg.powerChance, cfg.hazardChance, makeTile, fillSlot, applyPower, hazardHit, pushBurst, particles.length])

  const moveBasket = useCallback((clientX: number) => {
    const rect = arenaRef.current?.getBoundingClientRect(); if (!rect) return
    basketRef.current = Math.max(BASKET_W / 2, Math.min(rect.width - BASKET_W / 2, clientX - rect.left))
  }, [])

  if (terms.length === 0) return <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>No vocabulary terms available.</div>

  if (phase === 'waiting') {
    return (
      <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
        <div className="grid place-items-center mx-auto mb-3" style={{ width: 52, height: 52, borderRadius: 14, background: 'color-mix(in oklch, var(--primary) 16%, transparent)', color: 'var(--primary)' }}><ShoppingBasket size={26} /></div>
        <div className="text-xl font-semibold">Letter Catch</div>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Catch the letters in order to spell the term. Your basket only grabs the letter you need — wrong letters bounce off. Snag <Star className="inline h-3.5 w-3.5" style={{ color: 'var(--reward)' }} /> power-ups, dodge <Skull className="inline h-3.5 w-3.5" style={{ color: '#C0392B' }} /> hazards. {best > 0 && <>Beat your best of <b style={{ color: 'var(--foreground)' }}>{best.toLocaleString()}</b>.</>}</p>
        <Button onClick={startGame} size="lg" className="mt-5"><Zap className="h-4 w-4 mr-2" /> Start</Button>
      </div>
    )
  }
  if (phase === 'complete') return <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>Finishing…</div>

  const timePct = Math.round((gameLeft / gameTotal) * 100)
  const lowTime = gameLeft <= 15000
  const basketLeft = basketRef.current - BASKET_W / 2

  const powerIcon = (p: Power) => p === 'golden' ? <Star size={22} /> : p === 'slow' ? <Timer size={22} /> : p === 'wild' ? <Wand2 size={22} /> : <Eraser size={22} />

  return (
    <div className="space-y-3" style={{ color: 'var(--foreground)' }}>
      <style>{`@keyframes lcShake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-6px)}40%,60%{transform:translateX(6px)}}.lc-shake{animation:lcShake .32s}@keyframes lcFloat{0%{opacity:0;transform:translate(-50%,0) scale(.7)}20%{opacity:1}100%{opacity:0;transform:translate(-50%,-70px) scale(1.15)}}@keyframes lcPop{0%{transform:scale(.5);opacity:0}55%{transform:scale(1.18)}100%{transform:scale(1);opacity:1}}`}</style>

      {/* header */}
      <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 text-sm">
            <span style={{ color: 'var(--muted-foreground)' }}>{Math.min(qIndex + 1, total)} / {total}</span>
            <span className="font-bold" style={{ fontSize: 18 }}>{score.toLocaleString()}</span>
            {streak > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: 'color-mix(in oklch, var(--reward) 20%, transparent)', color: 'var(--reward)', transform: `scale(${Math.min(1 + streak * 0.05, 1.35)})` }}>
                <Flame className="h-3.5 w-3.5" /> ×{multiplier}
              </span>
            )}
            {slowOn && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: 'color-mix(in oklch, #3A6FA5 20%, transparent)', color: '#3A6FA5' }}><Timer className="h-3.5 w-3.5" /> slow-mo</span>}
          </div>
          <div className="flex items-center gap-3">
            {best > 0 && <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}><Crown className="h-3.5 w-3.5" /> best {best.toLocaleString()}</span>}
            <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums" style={{ color: lowTime ? '#C08B8B' : 'var(--foreground)' }}><Clock className="h-4 w-4" /> {fmtTime(gameLeft)}</span>
            <SoundToggle />
          </div>
        </div>
        <div className="h-2 rounded-full mt-2 overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full transition-[width] duration-100 ease-linear" style={{ width: `${timePct}%`, background: lowTime ? '#C08B8B' : 'var(--primary)' }} />
        </div>
      </div>

      {/* definition + letter bank */}
      <div className="rounded-2xl border p-3 sm:p-4 text-center" style={{ borderColor: 'color-mix(in oklch, var(--primary) 30%, var(--border))', background: 'color-mix(in oklch, var(--primary) 10%, transparent)' }}>
        <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Spell the term that means:</div>
        <p className="text-sm sm:text-lg font-medium break-words">{definition}</p>
        <div className="flex flex-wrap justify-center gap-1.5 mt-2.5">
          {scramble.map((ch, i) => <span key={i} className="grid place-items-center rounded-md text-xs font-bold" style={{ width: 22, height: 22, background: 'color-mix(in oklch, var(--primary) 18%, var(--card))', color: 'var(--primary)' }}>{ch}</span>)}
        </div>
      </div>

      {/* slots + skip */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <div className="flex flex-wrap justify-center gap-1.5">
          {target.map((ch, i) => {
            const done = i < filled, isNext = i === filled
            return (
              <span key={i} className="grid place-items-center rounded-lg font-bold" style={{ width: 34, height: 40, fontSize: 18, border: '2px solid', borderColor: done ? 'var(--success)' : isNext ? 'var(--primary)' : 'var(--border)', background: done ? 'color-mix(in oklch, var(--success) 18%, var(--card))' : 'var(--card)', color: done ? 'var(--success)' : 'var(--foreground)', boxShadow: isNext ? '0 0 0 3px color-mix(in oklch, var(--primary) 22%, transparent)' : 'none', animation: done ? 'lcPop .25s' : undefined }}>{done ? ch : ''}</span>
            )
          })}
        </div>
        <button onClick={skipWord} disabled={phase !== 'playing'} className="inline-flex items-center gap-1 text-xs rounded-lg border px-2.5 py-1.5" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}><SkipForward className="h-3.5 w-3.5" /> Skip</button>
      </div>

      {/* arena */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div ref={arenaRef}
          onMouseMove={(e) => moveBasket(e.clientX)}
          onTouchMove={(e) => { if (e.touches[0]) moveBasket(e.touches[0].clientX) }}
          className={`relative touch-none select-none ${shake ? 'lc-shake' : ''}`}
          style={{ height: ARENA_H, cursor: 'none', background: slowOn ? 'radial-gradient(120% 80% at 50% -10%, color-mix(in oklch, #3A6FA5 16%, transparent), transparent 60%), var(--card)' : 'radial-gradient(120% 80% at 50% -10%, color-mix(in oklch, var(--primary) 16%, transparent), transparent 60%), var(--card)' }}>

          {/* particles */}
          {particles.map((p) => <div key={p.id} className="absolute pointer-events-none" style={{ left: p.x, top: p.y, width: 6, height: 6, borderRadius: 2, background: p.color, opacity: Math.max(0, p.life / p.max) }} />)}

          {/* floating texts */}
          {floats.map((f) => <div key={f.id} className="absolute pointer-events-none z-20 font-extrabold" style={{ left: f.x, top: f.y, fontSize: 26, color: f.color, animation: 'lcFloat 0.85s ease-out forwards' }}>{f.text}</div>)}

          {/* tiles */}
          {tiles.map((t) => {
            if (t.kind === 'power') {
              const m = POWERS[t.power!]
              return <div key={t.id} className="absolute grid place-items-center rounded-full pointer-events-none" style={{ left: t.x, top: t.y, width: TILE, height: TILE, color: m.color, border: `2.5px solid ${m.color}`, background: `color-mix(in oklch, ${m.color} 18%, var(--card))`, boxShadow: `0 0 0 4px color-mix(in oklch, ${m.color} 22%, transparent)`, animation: 'lcPop .3s' }}>{powerIcon(t.power!)}</div>
            }
            if (t.kind === 'hazard') {
              return <div key={t.id} className="absolute grid place-items-center rounded-lg pointer-events-none" style={{ left: t.x, top: t.y, width: TILE, height: TILE, color: '#fff', border: '2.5px solid #8E2A1F', background: '#C0392B', boxShadow: '0 2px 8px rgba(192,57,43,0.4)' }}><Skull size={24} /></div>
            }
            const glow = cfg.highlightTarget && t.ch === target[filled]
            return (
              <div key={t.id} className="absolute grid place-items-center rounded-lg font-bold pointer-events-none" style={{ left: t.x, top: t.y, width: TILE, height: TILE, fontSize: 22, border: glow ? '2px solid var(--success)' : '2px solid color-mix(in oklch, var(--primary) 30%, var(--border))', background: glow ? 'color-mix(in oklch, var(--success) 22%, var(--card))' : 'var(--card)', color: glow ? 'var(--success)' : 'var(--foreground)', boxShadow: glow ? '0 0 0 4px color-mix(in oklch, var(--success) 28%, transparent), 0 2px 8px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.08)' }}>{t.ch}</div>
            )
          })}

          {/* basket */}
          <div className="absolute pointer-events-none flex flex-col items-center" style={{ left: basketLeft, top: ARENA_H - BASKET_H - BASKET_GAP, width: BASKET_W, height: BASKET_H, zIndex: 10 }}>
            <div style={{ width: '100%', height: 5, borderRadius: 999, background: 'var(--primary)' }} />
            <div className="flex-1 w-full grid place-items-center rounded-b-2xl" style={{ marginTop: 2, background: 'color-mix(in oklch, var(--primary) 22%, var(--card))', border: '3px solid var(--primary)', borderTopWidth: 0 }}>
              <ShoppingBasket size={28} style={{ color: 'var(--primary)' }} />
            </div>
          </div>

          {/* feedback */}
          {flash && (
            <div className="absolute inset-x-0 bottom-2 flex justify-center pointer-events-none z-20">
              <div className="rounded-full px-4 py-2 text-sm font-medium" style={flash.ok ? { background: 'color-mix(in oklch, var(--success) 22%, var(--card))', color: 'var(--success)' } : { background: 'color-mix(in oklch, #C08B8B 22%, var(--card))', color: '#7a4b4b' }}>
                {flash.ok ? <>Nice! <b>{flash.answer}</b></> : <>Answer: <b>{flash.answer}</b></>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
