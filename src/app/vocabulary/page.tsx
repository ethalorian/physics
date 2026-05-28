"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useVocabulary } from '@/contexts/VocabularyContext'
import { getUserRole } from '@/lib/permissions'
import { Gamepad2, Flame, Star, Trophy, Zap, Shuffle, Brain, ArrowRight, Target, Crown } from 'lucide-react'
import EnrollmentGate from '@/components/EnrollmentGate'

interface HubData {
  level: number
  xp: { into: number; forNext: number; total: number }
  streakDays: number
  daily: { gamesPlayed: number; gamesGoal: number; pointsToday: number; pointsGoal: number; complete: boolean }
  games: { id: string; best: number; plays: number }[]
  leaderboard: { rank: number; name: string; points: number; isMe: boolean }[]
  myRank: number | null
}

const GAMES = [
  { id: 'word-shoot', title: 'Word shoot', desc: 'Blast the right term before it escapes', icon: Zap, difficulty: 'Medium', href: '/vocabulary/word-shoot' },
  { id: 'quiz-bowl', title: 'Quiz bowl', desc: 'Rapid-fire physics questions', icon: Trophy, difficulty: 'Hard', href: '/vocabulary/quiz-bowl' },
  { id: 'matching', title: 'Matching', desc: 'Pair terms with definitions, fast', icon: Shuffle, difficulty: 'Medium', href: '/vocabulary/matching' },
  { id: 'concentration', title: 'Concentration', desc: 'Flip and remember the pairs', icon: Brain, difficulty: 'Easy', href: '/vocabulary/concentration' },
]
const DIFF_COLOR: Record<string, string> = { Easy: 'var(--success)', Medium: 'var(--reward)', Hard: '#C08B8B' }

function StatTile({ icon, label, value, accent, children }: { icon: React.ReactNode; label: string; value: string; accent: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        <span style={{ color: accent }}>{icon}</span> {label}
      </div>
      <div className="text-2xl font-bold mt-1" style={{ color: accent }}>{value}</div>
      {children}
    </div>
  )
}

export default function VocabularyArcade() {
  const { data: session, status } = useSession()
  const { vocabularySets, publishedVocabularySets, loading } = useVocabulary()
  const isStaff = getUserRole(session?.user?.email) !== 'student'
  const [hub, setHub] = useState<HubData | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/arcade/hub').then((r) => r.json()).then((d: HubData) => { if (d && typeof d.level === 'number') setHub(d) }).catch(() => {})
  }, [status])

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary)' }} /></div>
  }
  if (!session) {
    return <div className="max-w-md mx-auto rounded-2xl border p-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>Please sign in to play.</div>
  }

  const visibleSets = isStaff ? vocabularySets : publishedVocabularySets
  const availableSets = visibleSets.filter((s) => s.terms.length > 0)
  const noSets = availableSets.length === 0
  const bestById = new Map((hub?.games ?? []).map((g) => [g.id, g]))
  const dailyPct = hub ? Math.min(100, Math.round(((hub.daily.gamesPlayed / hub.daily.gamesGoal) * 50) + ((hub.daily.pointsToday / hub.daily.pointsGoal) * 50))) : 0

  return (
    <EnrollmentGate>
    <div className="max-w-5xl mx-auto p-5 space-y-6" style={{ color: 'var(--foreground)' }}>
      {/* header */}
      <div className="flex items-center gap-3">
        <div className="grid place-items-center" style={{ width: 44, height: 44, borderRadius: 12, background: 'color-mix(in oklch, var(--primary) 16%, transparent)', color: 'var(--primary)' }}>
          <Gamepad2 size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Physics arcade</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Play to climb the board and keep your streak alive.</p>
        </div>
      </div>

      {/* motivation strip */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <StatTile icon={<Star size={15} />} label="Level" value={hub ? String(hub.level) : '—'} accent="var(--primary)">
          {hub && (
            <>
              <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full" style={{ width: `${Math.round((hub.xp.into / hub.xp.forNext) * 100)}%`, background: 'var(--primary)' }} />
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{hub.xp.into} / {hub.xp.forNext} XP</div>
            </>
          )}
        </StatTile>
        <StatTile icon={<Flame size={15} />} label="Streak" value={hub ? `${hub.streakDays}d` : '—'} accent="var(--reward)" />
        <StatTile icon={<Crown size={15} />} label="This week" value={hub?.myRank ? `#${hub.myRank}` : '—'} accent="var(--success)" />
        <StatTile icon={<Trophy size={15} />} label="Total XP" value={hub ? hub.xp.total.toLocaleString() : '—'} accent="var(--primary)" />
      </div>

      {/* daily challenge */}
      <div className="rounded-2xl border p-4 flex items-center gap-4 flex-wrap" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="grid place-items-center" style={{ width: 38, height: 38, borderRadius: '50%', background: 'color-mix(in oklch, var(--reward) 18%, transparent)', color: 'var(--reward)' }}>
          <Target size={20} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="font-medium">Daily challenge {hub?.daily.complete && <span className="text-xs ml-1" style={{ color: 'var(--success)' }}>done ✓</span>}</div>
          <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Play {hub?.daily.gamesGoal ?? 3} games and earn {hub?.daily.pointsGoal ?? 150} points today
            {hub && <span> · {hub.daily.gamesPlayed}/{hub.daily.gamesGoal} games · {hub.daily.pointsToday}/{hub.daily.pointsGoal} pts</span>}
          </div>
          <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full" style={{ width: `${dailyPct}%`, background: 'var(--reward)' }} />
          </div>
        </div>
      </div>

      {/* games */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>Games</div>
        {noSets && (
          <div className="rounded-xl border p-3 mb-3 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
            {isStaff ? 'Publish a vocabulary set to enable the games.' : 'No vocabulary sets published yet — check back soon.'}
          </div>
        )}
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {GAMES.map((g) => {
            const Icon = g.icon
            const best = bestById.get(g.id)?.best ?? 0
            const dc = DIFF_COLOR[g.difficulty]
            const tile = (
              <div className="rounded-2xl border p-5 h-full transition-transform" style={{ borderColor: 'var(--border)', background: 'var(--card)', opacity: noSets ? 0.6 : 1 }}
                onMouseEnter={(e) => { if (!noSets) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--primary)' } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                <div className="flex items-center justify-between">
                  <div className="grid place-items-center" style={{ width: 42, height: 42, borderRadius: 12, background: 'color-mix(in oklch, var(--primary) 14%, transparent)', color: 'var(--primary)' }}><Icon size={22} /></div>
                  <span className="text-xs rounded-md px-2 py-0.5" style={{ background: `color-mix(in oklch, ${dc} 16%, transparent)`, color: dc }}>{g.difficulty}</span>
                </div>
                <div className="font-bold mt-3" style={{ fontSize: 16 }}>{g.title}</div>
                <div className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{g.desc}</div>
                <div className="flex items-center gap-1.5 text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>
                  <Trophy size={13} /> {best > 0 ? `Best ${best.toLocaleString()}` : 'No score yet'}
                  <span className="ml-auto inline-flex items-center gap-1 font-medium" style={{ color: 'var(--primary)' }}>Play <ArrowRight size={13} /></span>
                </div>
              </div>
            )
            return noSets ? <div key={g.id}>{tile}</div> : <Link key={g.id} href={g.href}>{tile}</Link>
          })}
        </div>
      </div>

      {/* leaderboard */}
      <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold" style={{ fontSize: 15 }}>This week&apos;s leaders</div>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>by points earned</span>
        </div>
        {hub && hub.leaderboard.length > 0 ? (
          <div className="space-y-1.5 text-sm">
            {hub.leaderboard.map((e) => (
              <div key={e.rank} className="flex items-center gap-3 rounded-lg px-2 py-1.5" style={{ background: e.isMe ? 'color-mix(in oklch, var(--primary) 12%, transparent)' : 'transparent' }}>
                <span className="w-5 font-medium" style={{ color: e.rank === 1 ? 'var(--reward)' : 'var(--muted-foreground)' }}>{e.rank}</span>
                <span className="flex-1 font-medium" style={{ color: e.isMe ? 'var(--primary)' : 'var(--foreground)' }}>{e.name}</span>
                <span style={{ color: 'var(--muted-foreground)' }}>{e.points.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No games played this week yet — be the first on the board.</div>
        )}
      </div>
    </div>
    </EnrollmentGate>
  )
}
