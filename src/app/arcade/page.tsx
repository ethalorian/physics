"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Coins, Trophy, Crown, Gamepad2, Joystick, Flame, Target, Zap, Shuffle, Brain, ShoppingBasket, Swords, Feather, Sigma } from 'lucide-react'
import DailySpinWheel from '@/components/arcade/DailySpinWheel'

/**
 * THE ARCADE — one unified hub for the whole economy loop.
 *
 *   TRAINING FLOOR (top): vocabulary games — XP EARNERS (capped daily).
 *   PHYSICS FLOOR: the curriculum cabinets — FREE, ranked, and accuracy
 *     EARNS XP via /api/arcade/payout (clears × question accuracy²).
 *   MATH SPINE GYM: free fluency cabinets — XP EARNERS (same payout route),
 *     one per math_competencies strand.
 *   THE MIDWAY (bottom): pure-fun cabinets — the XP SPENDERS.
 *
 * Learn to earn; spend it on the Midway. One door for everything.
 */

type Cabinet = {
  slug: string
  name: string
  blurb: string | null
  unit: string | null
  accent: string | null
  costXp: number
  myBest: number
  myWeeklyRank: number | null
  weeklyLeader: { name: string; score: number } | null
  hallOfFame: { name: string; score: number } | null
}
type CabinetResponse = {
  balance: { balance: number; lifetimeEarned: number; spent: number }
  freeCreditAvailable: boolean
  games: Cabinet[]
}
type HubData = {
  level: number
  xp: { into: number; forNext: number; total: number }
  streakDays: number
  daily: { gamesPlayed: number; gamesGoal: number; pointsToday: number; pointsGoal: number; complete: boolean }
  games: { id: string; best: number; plays: number }[]
  myRank: number | null
}

const VOCAB_GAMES = [
  // steer: solo games accept ?lesson_id=/?unit_id= and preload the focus vocab
  { id: 'word-shoot', title: 'Word shoot', desc: 'Blast the right term before it escapes', icon: Zap, href: '/vocabulary/word-shoot', steer: true },
  { id: 'quiz-bowl', title: 'Quiz bowl', desc: 'Rapid-fire physics questions', icon: Trophy, href: '/vocabulary/quiz-bowl', steer: true },
  { id: 'matching', title: 'Matching', desc: 'Pair terms with definitions, fast', icon: Shuffle, href: '/vocabulary/matching', steer: true },
  { id: 'concentration', title: 'Concentration', desc: 'Flip and remember the pairs', icon: Brain, href: '/vocabulary/concentration', steer: true },
  { id: 'letter-catch', title: 'Letter Catch', desc: 'Catch falling letters to spell the term', icon: ShoppingBasket, href: '/vocabulary/letter-catch', steer: true },
  { id: 'duel', title: 'Vocab Duel', desc: 'Race a classmate head-to-head', icon: Swords, href: '/vocabulary/duel', steer: false },
  { id: 'balderdash', title: 'Balderdash', desc: 'Fake definitions, real bluffing (3+)', icon: Feather, href: '/vocabulary/balderdash', steer: false },
]
type Focus = { scope: 'lesson' | 'unit' | null; id?: string; label?: string }

export default function ArcadePage() {
  const [data, setData] = useState<CabinetResponse | null>(null)
  const [hub, setHub] = useState<HubData | null>(null)
  const [focus, setFocus] = useState<Focus | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/arcade/cabinet')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Sign in to enter the arcade'))))
      .then(setData)
      .catch((e) => setErr(e.message))
    fetch('/api/arcade/hub')
      .then((r) => r.json())
      .then((d: HubData) => { if (d && typeof d.level === 'number') setHub(d) })
      .catch(() => {})
    fetch('/api/arcade/focus')
      .then((r) => r.json())
      .then((f: Focus) => { if (f && f.scope) setFocus(f) })
      .catch(() => {})
  }, [])

  const steerQS = focus?.scope ? `?${focus.scope === 'lesson' ? 'lesson_id' : 'unit_id'}=${focus.id}` : ''
  const games = focus?.scope
    ? [...VOCAB_GAMES].sort((a, b) => Number(b.steer) - Number(a.steer))
    : VOCAB_GAMES

  const bestById = new Map((hub?.games ?? []).map((g) => [g.id, g]))
  const dailyPct = hub ? Math.min(100, Math.round(((hub.daily.gamesPlayed / hub.daily.gamesGoal) * 50) + ((hub.daily.pointsToday / hub.daily.pointsGoal) * 50))) : 0

  const physicsGames = (data?.games ?? []).filter((g) => g.costXp === 0 && g.unit !== 'Math Spine')
  const mathGames = (data?.games ?? []).filter((g) => g.costXp === 0 && g.unit === 'Math Spine')
  const coinGames = (data?.games ?? []).filter((g) => g.costXp > 0)

  const renderCabinet = (g: Cabinet) => {
    const accent = g.accent || 'var(--primary)'
    const free = g.costXp === 0
    const canAfford = free || (data ? data.balance.balance >= g.costXp || data.freeCreditAvailable : false)
    return (
      <div key={g.slug} className="rounded-2xl border p-5 flex flex-col" style={{ borderColor: 'var(--border)', background: 'var(--card)', boxShadow: `inset 0 3px 0 ${accent}` }}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold tracking-wide" style={{ color: accent }}>{g.name}</h3>
            {g.unit && <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>{g.unit}</span>}
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold rounded-full border px-3 py-1" style={{ borderColor: 'var(--border)' }}>
            <Coins size={14} style={{ color: accent }} /> {free ? 'EARNS XP' : g.costXp}
          </span>
        </div>
        {g.blurb && <p className="text-sm mt-2 flex-1" style={{ color: 'var(--muted-foreground)' }}>{g.blurb}</p>}

        <div className="mt-4 grid grid-cols-1 gap-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}><Trophy size={14} /> Week</span>
            <span className="font-medium">{g.weeklyLeader ? `${g.weeklyLeader.name} — ${g.weeklyLeader.score.toLocaleString()}` : 'unclaimed'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}><Crown size={14} /> All-time</span>
            <span className="font-medium">{g.hallOfFame ? `${g.hallOfFame.name} — ${g.hallOfFame.score.toLocaleString()}` : 'be the first'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--muted-foreground)' }}>Your best</span>
            <span className="font-medium">{g.myBest ? g.myBest.toLocaleString() : '—'}{g.myWeeklyRank ? ` (#${g.myWeeklyRank})` : ''}</span>
          </div>
        </div>

        <Link
          href={`/arcade/${g.slug}`}
          className="mt-4 text-center text-sm font-semibold rounded-lg px-4 py-2.5"
          style={{ background: canAfford ? accent : 'var(--muted)', color: canAfford ? '#04060d' : 'var(--muted-foreground)' }}
        >
          {free ? '▶ PLAY FREE · EARN XP' : data?.freeCreditAvailable ? '▶ FREE CREDIT' : canAfford ? '▶ INSERT COIN' : `Need ${g.costXp} XP`}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      {/* ===== marquee ===== */}
      <div className="flex items-center justify-between flex-wrap gap-3 mt-2 mb-1">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center" style={{ width: 44, height: 44, borderRadius: 12, background: 'color-mix(in oklch, var(--primary) 16%, transparent)', color: 'var(--primary)' }}>
            <Joystick size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">The Arcade</h1>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Physics pays. The Midway costs. One door.
            </p>
          </div>
        </div>
        {data && (
          <div className="flex items-center gap-2 rounded-xl border px-4 py-2" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <Coins size={18} style={{ color: 'var(--primary)' }} />
            <span className="font-semibold">{data.balance.balance.toLocaleString()} XP</span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>spendable</span>
          </div>
        )}
      </div>

      {err && <p className="text-sm mt-3" style={{ color: 'var(--destructive)' }}>{err}</p>}
      {!data && !err && <p className="text-sm mt-3" style={{ color: 'var(--muted-foreground)' }}>Powering on the cabinets…</p>}

      {data?.freeCreditAvailable && (
        <div className="rounded-xl border px-4 py-3 mt-4 text-sm font-medium flex items-center gap-2"
          style={{ borderColor: 'var(--primary)', background: 'color-mix(in oklch, var(--primary) 12%, transparent)' }}>
          <Coins size={16} style={{ color: 'var(--primary)' }} />
          Your first coin is on the house — one free ranked run downstairs. Make it count.
        </div>
      )}

      {/* daily spin — a tiny trickle of XP, one distant jackpot */}
      <div className="mt-4">
        <DailySpinWheel onWon={(xp) => setData((d) => d ? {
          ...d,
          balance: { ...d.balance, balance: d.balance.balance + xp, lifetimeEarned: d.balance.lifetimeEarned + xp },
        } : d)} />
      </div>

      {/* ===== THE MIDWAY — featured up top: the visible reason to earn ===== */}
      {coinGames.length > 0 && (
        <div className="rounded-2xl border p-5 mt-5" style={{
          borderColor: 'color-mix(in oklch, var(--primary) 45%, transparent)',
          background: 'linear-gradient(135deg, color-mix(in oklch, var(--primary) 10%, var(--card)), var(--card))',
          boxShadow: '0 0 32px color-mix(in oklch, var(--primary) 16%, transparent)',
        }}>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Gamepad2 size={18} style={{ color: 'var(--primary)' }} />
              <h2 className="text-sm font-extrabold uppercase tracking-widest">
                The Midway · pure fun · {coinGames[0]?.costXp ?? 25} XP a coin
              </h2>
            </div>
            <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              coins are earned on the floors below — one mastered physics run ≈ one Midway coin
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coinGames.map(renderCabinet)}
          </div>
        </div>
      )}

      {/* ===== TRAINING FLOOR — the earners ===== */}
      <div className="flex items-center justify-between flex-wrap gap-2 mt-7 mb-3">
        <div className="flex items-center gap-2">
          <Gamepad2 size={16} style={{ color: 'var(--success, #22c55e)' }} />
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            Training floor · earn XP
          </h2>
        </div>
        {hub && (
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <span title={`${hub.xp.into}/${hub.xp.forNext} XP into level ${hub.level}`}>
              Lv <b style={{ color: 'var(--primary)' }}>{hub.level}</b>
              <span className="inline-block align-middle ml-1.5 h-1.5 w-14 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <span className="block h-full" style={{ width: `${Math.round((hub.xp.into / hub.xp.forNext) * 100)}%`, background: 'var(--primary)' }} />
              </span>
            </span>
            {hub.myRank && <span>this week <b style={{ color: 'var(--success, #22c55e)' }}>#{hub.myRank}</b></span>}
          </div>
        )}
      </div>

      {/* daily challenge strip */}
      <div className="rounded-2xl border p-4 flex items-center gap-4 flex-wrap mb-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="grid place-items-center" style={{ width: 38, height: 38, borderRadius: '50%', background: 'color-mix(in oklch, var(--reward, #f59e0b) 18%, transparent)', color: 'var(--reward, #f59e0b)' }}>
          <Target size={20} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="font-medium text-sm">
            Daily challenge {hub?.daily.complete && <span className="text-xs ml-1" style={{ color: 'var(--success, #22c55e)' }}>done ✓</span>}
            {hub && <span className="text-xs font-normal ml-2" style={{ color: 'var(--muted-foreground)' }}>
              {hub.daily.gamesPlayed}/{hub.daily.gamesGoal} games · {hub.daily.pointsToday}/{hub.daily.pointsGoal} pts
            </span>}
          </div>
          <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full" style={{ width: `${dailyPct}%`, background: 'var(--reward, #f59e0b)' }} />
          </div>
        </div>
        {hub && (
          <div className="flex items-center gap-1.5 text-sm" title="Daily play streak">
            <Flame size={16} style={{ color: 'var(--reward, #f59e0b)' }} />
            <span className="font-semibold">{hub.streakDays}d</span>
          </div>
        )}
      </div>

      {focus?.scope && (
        <div className="rounded-xl border px-4 py-2.5 mb-3 text-sm flex items-center gap-2 flex-wrap"
          style={{ borderColor: 'color-mix(in oklch, var(--success, #22c55e) 45%, transparent)', background: 'color-mix(in oklch, var(--success, #22c55e) 10%, transparent)' }}>
          <Target size={15} style={{ color: 'var(--success, #22c55e)' }} />
          <span><b>Current focus: {focus.label}</b></span>
          <span style={{ color: 'var(--muted-foreground)' }}>
            — starred games open preloaded with the words you’re learning right now.
          </span>
        </div>
      )}

      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
        {games.map((g) => {
          const Icon = g.icon
          const best = bestById.get(g.id)
          const steered = !!focus?.scope && g.steer
          return (
            <Link key={g.id} href={steered ? g.href + steerQS : g.href}
              className="rounded-xl border p-3 flex items-start gap-3 transition-transform hover:-translate-y-0.5"
              style={{
                borderColor: steered ? 'color-mix(in oklch, var(--success, #22c55e) 55%, transparent)' : 'var(--border)',
                background: 'var(--card)',
                boxShadow: steered ? 'inset 0 2px 0 color-mix(in oklch, var(--success, #22c55e) 60%, transparent)' : 'none',
              }}>
              <span className="mt-0.5" style={{ color: 'var(--success, #22c55e)' }}><Icon size={18} /></span>
              <span>
                <span className="block text-sm font-semibold">
                  {g.title}{steered && <span title={`preloaded: ${focus?.label}`} style={{ color: 'var(--success, #22c55e)' }}> ★</span>}
                </span>
                <span className="block text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{g.desc}</span>
                {steered && <span className="block text-[11px] mt-1" style={{ color: 'var(--success, #22c55e)' }}>{focus?.label}</span>}
                {best && best.best > 0 && (
                  <span className="block text-[11px] mt-1" style={{ color: 'var(--reward, #f59e0b)' }}>best {best.best.toLocaleString()}</span>
                )}
              </span>
            </Link>
          )
        })}
      </div>

      {/* ===== PHYSICS FLOOR — the curriculum cabinets: free, accuracy EARNS ===== */}
      {physicsGames.length > 0 && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2 mt-8 mb-3">
            <div className="flex items-center gap-2">
              <Joystick size={16} style={{ color: 'var(--primary)' }} />
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                Physics floor · free cabinets · play the unit, earn XP
              </h2>
            </div>
            <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              ranked runs · clears + bonus-question accuracy bank the XP
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {physicsGames.map(renderCabinet)}
          </div>
        </>
      )}

      {/* ===== MATH SPINE GYM — free cabinets that EARN ===== */}
      {mathGames.length > 0 && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2 mt-8 mb-3">
            <div className="flex items-center gap-2">
              <Sigma size={16} style={{ color: 'var(--success, #22c55e)' }} />
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                Math gym · free cabinets · accuracy earns XP
              </h2>
            </div>
            <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              sloppy speed pays nothing · the best-paying floor: up to 75 XP/day
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mathGames.map(renderCabinet)}
          </div>
        </>
      )}

      {data && data.games.length === 0 && (
        <p className="text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>No cabinets are powered on yet. Check back soon.</p>
      )}

      {data && data.balance.balance < 25 && !data.freeCreditAvailable && (
        <p className="text-xs mt-6 text-center" style={{ color: 'var(--muted-foreground)' }}>
          Short on coins? The physics floor and math gym pay up to 75 XP a day for accurate runs. Vocabulary games add up to 25 a day, and lessons pay too.
        </p>
      )}
    </div>
  )
}
