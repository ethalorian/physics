"use client"

import { useEffect, useMemo, useState, type ReactNode, type CSSProperties } from 'react'
import Link from 'next/link'
import { decayingAverage } from '@/data/curriculum-types'

// ---------------------------------------------------------------------------
// Types (mirror the /api/home response)
// ---------------------------------------------------------------------------
type Domain = 'knowledge' | 'reasoning' | 'skill' | 'product'

interface SequenceItem { lessonNumber: number; title: string; slug: string; status: 'done' | 'current' | 'todo' }
interface ContinueData {
  unitId: string | null
  unitName: string | null
  lesson: { slug: string; title: string; lessonNumber: number; progress: number }
  sequence: SequenceItem[]
  completed: number
  total: number
}
interface RetryItem { targetId: string; statement: string; domain: Domain; level: 1 | 2; lastObservedAt: string }
interface ClimbPoint { observedAt: string; level: number; domain: Domain }
interface HomeData {
  student: { name: string }
  points: { xp: number; balance: number }
  streak: { current: number }
  continue: ContinueData | null
  retry: RetryItem[]
  climb: ClimbPoint[]
  sideQuest: { sim: { slug: string; title: string } | null }
}

const DOMAINS: { key: Domain; label: string }[] = [
  { key: 'knowledge', label: 'Knowledge' },
  { key: 'reasoning', label: 'Reasoning' },
  { key: 'skill', label: 'Skill' },
  { key: 'product', label: 'Product' },
]

const STYLES = `
  .hub-sky { position: fixed; inset: 0; z-index: -2;
    background:
      radial-gradient(60% 50% at 82% -6%, color-mix(in oklch, var(--secondary) 75%, transparent), transparent 70%),
      radial-gradient(52% 42% at 8% 2%, color-mix(in oklch, var(--primary) 20%, transparent), transparent 62%),
      var(--background); }
  .hub-stars { position: fixed; inset: 0; z-index: -1; opacity: .55; animation: hubTw 7s ease-in-out infinite alternate;
    background-image:
      radial-gradient(1.4px 1.4px at 14% 16%, var(--foreground), transparent),
      radial-gradient(1.2px 1.2px at 32% 44%, var(--foreground), transparent),
      radial-gradient(1.5px 1.5px at 52% 10%, var(--foreground), transparent),
      radial-gradient(1.1px 1.1px at 68% 30%, var(--foreground), transparent),
      radial-gradient(1.4px 1.4px at 82% 22%, var(--foreground), transparent),
      radial-gradient(1.2px 1.2px at 90% 52%, var(--foreground), transparent),
      radial-gradient(1.3px 1.3px at 38% 70%, var(--foreground), transparent),
      radial-gradient(1.1px 1.1px at 73% 78%, var(--foreground), transparent),
      radial-gradient(1.5px 1.5px at 20% 86%, var(--foreground), transparent); }
  @keyframes hubTw { from { opacity: .3 } to { opacity: .65 } }
  @keyframes hubSpin { to { transform: rotate(360deg) } }
  @keyframes hubPulse { 0%,100% { box-shadow: 0 0 0 5px color-mix(in oklch, var(--reward) 28%, transparent), 0 0 16px var(--reward) }
    50% { box-shadow: 0 0 0 9px color-mix(in oklch, var(--reward) 16%, transparent), 0 0 28px var(--reward) } }
`

function Glass({ children, style, className }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className ?? ''}`}
      style={{
        background: 'color-mix(in oklch, var(--card) 80%, transparent)',
        backdropFilter: 'blur(16px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
        border: '1px solid color-mix(in oklch, var(--border) 75%, transparent)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function LaneLabel({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mt-8 mb-3" style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
      <span style={{ width: 22, height: 3, borderRadius: 2, background: color }} />
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mastery climb chart
// ---------------------------------------------------------------------------
function ClimbChart({ points }: { points: ClimbPoint[] }) {
  const W = 720, L = 60, R = 700, T = 18, B = 210
  const sorted = [...points].sort((a, b) => a.observedAt.localeCompare(b.observedAt))
  const n = sorted.length
  if (n === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Your climb will appear here once your teacher logs your first mastery ratings.
      </p>
    )
  }
  const sx = (i: number) => (n === 1 ? (L + R) / 2 : L + (i / (n - 1)) * (R - L))
  const sy = (v: number) => B - ((v - 1) / 2) * (B - T) // level 1..3 -> bottom..top
  const running = decayingAverage // shared util
  // weighted trajectory: running decaying average up to each index
  const line: { x: number; y: number }[] = sorted.map((_, i) => {
    const v = running(sorted.slice(0, i + 1).map((p) => p.level)) ?? sorted[i].level
    return { x: sx(i), y: sy(v) }
  })
  const linePts = line.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const fmt = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
  return (
    <svg viewBox={`0 0 ${W} 240`} role="img" aria-label="Mastery over time" style={{ width: '100%', height: 'auto' }}>
      <rect x={L} y={15} width={R - L} height={70} style={{ fill: 'var(--success)', opacity: 0.1 }} />
      <rect x={L} y={85} width={R - L} height={70} style={{ fill: 'var(--reward)', opacity: 0.12 }} />
      <rect x={L} y={155} width={R - L} height={70} style={{ fill: 'var(--destructive)', opacity: 0.09 }} />
      <text x={8} y={54} style={{ fill: 'var(--success)', fontWeight: 700 }} fontSize="11">Got it</text>
      <text x={8} y={124} style={{ fill: 'var(--muted-foreground)' }} fontSize="11">Almost</text>
      <text x={8} y={194} style={{ fill: 'var(--muted-foreground)' }} fontSize="11">Not yet</text>
      {n > 1 && <polyline points={linePts} fill="none" style={{ stroke: 'var(--primary)' }} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />}
      {sorted.map((p, i) => (
        <circle key={i} cx={sx(i)} cy={sy(p.level)} r={6} style={{ fill: 'var(--reward)' }}>
          <title>{`${fmt(p.observedAt)} — level ${p.level}`}</title>
        </circle>
      ))}
      <text x={sx(0)} y={236} textAnchor="middle" style={{ fill: 'var(--muted-foreground)' }} fontSize="10">{fmt(sorted[0].observedAt)}</text>
      {n > 1 && <text x={sx(n - 1)} y={236} textAnchor="middle" style={{ fill: 'var(--foreground)', fontWeight: 700 }} fontSize="10">{fmt(sorted[n - 1].observedAt)}</text>}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [domain, setDomain] = useState<Domain>('reasoning')

  useEffect(() => {
    fetch('/api/home')
      .then((r) => r.json())
      .then((d: HomeData) => {
        setData(d)
        setLoading(false)
        const firstWithData = DOMAINS.find((dm) => d.climb?.some((c) => c.domain === dm.key))
        if (firstWithData) setDomain(firstWithData.key)
      })
      .catch(() => setLoading(false))
  }, [])

  const climbForDomain = useMemo(
    () => (data?.climb ?? []).filter((c) => c.domain === domain),
    [data, domain],
  )

  return (
    <>
      <style>{STYLES}</style>
      <div className="hub-sky" />
      <div className="hub-stars" />

      <div className="max-w-3xl mx-auto px-5 pb-24" style={{ color: 'var(--foreground)' }}>
        {/* greeting + points */}
        <div className="flex items-end justify-between flex-wrap gap-3 pt-7 pb-1">
          <div>
            <h1 className="font-semibold tracking-tight" style={{ fontSize: 26 }}>
              {loading ? 'Welcome back.' : `Welcome back, ${data?.student?.name ?? 'there'}.`}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Your mission for today is ready. Where do you want to go?
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold" style={{ background: 'var(--reward)', color: 'var(--reward-foreground)', boxShadow: '0 0 16px color-mix(in oklch, var(--reward) 45%, transparent)' }}>
              ★ {loading ? '—' : data?.points?.xp ?? 0} XP
            </span>
            {!loading && (data?.streak?.current ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold" style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} /> {data!.streak.current}-day streak
              </span>
            )}
          </div>
        </div>

        {loading && <p className="text-sm mt-8" style={{ color: 'var(--muted-foreground)' }}>Loading your launch pad…</p>}

        {!loading && data && (
          <>
            {/* CONTINUE */}
            <LaneLabel color="var(--primary)">Continue your journey</LaneLabel>
            {data.continue && data.continue.lesson ? (
              <Glass
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  padding: 26,
                  border: '1px solid color-mix(in oklch, var(--primary) 35%, var(--border))',
                  background:
                    'radial-gradient(90% 130% at 90% -10%, color-mix(in oklch, var(--primary) 26%, transparent), transparent 55%), color-mix(in oklch, var(--card) 80%, transparent)',
                  boxShadow: '0 18px 50px -20px color-mix(in oklch, var(--primary) 50%, transparent)',
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--muted-foreground)', fontWeight: 600 }}>
                  {data.continue.unitName ?? 'Your unit'}
                </div>
                <div className="font-bold tracking-tight" style={{ fontSize: 22, margin: '5px 0 6px' }}>
                  Lesson {data.continue.lesson.lessonNumber} — {data.continue.lesson.title}
                </div>
                <div className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                  {data.continue.lesson.progress > 0 ? 'Pick up where you left off.' : 'Ready when you are — this is your next waypoint.'}
                </div>
                <Link
                  href={`/lessons/${data.continue.lesson.slug}`}
                  className="inline-flex items-center gap-2 rounded-xl font-bold"
                  style={{ fontSize: 15, padding: '13px 26px', background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: '0 10px 28px -8px color-mix(in oklch, var(--primary) 70%, transparent)' }}
                >
                  {data.continue.lesson.progress > 0 ? 'Resume lesson' : 'Start lesson'} →
                </Link>

                {/* journey map */}
                {data.continue.sequence.length > 0 && (
                  <div className="mt-6 pt-5" style={{ borderTop: '1px solid color-mix(in oklch, var(--border) 70%, transparent)' }}>
                    {/* py-4 gives the current-day hubPulse glow (up to ~12px outside the
                        bubble) room to breathe inside the overflow-x scroll box, which
                        otherwise clips it on top/bottom. */}
                    <div className="flex items-center overflow-x-auto py-4">
                      {data.continue.sequence.map((s, i) => {
                        // The bubble already shows the day number (or ✓), so
                        // strip the "Day N — " prefix from the label to stop
                        // wasting characters on duplication. Allow up to two
                        // lines of natural wrapping at a slightly wider cell.
                        const cleanTitle = s.title.replace(/^\s*Day\s+\d+\s*[—–-]\s*/, '')
                        return (
                        <div key={s.slug} className="flex items-center">
                          <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 96 }}>
                            <div
                              className="grid place-items-center font-bold"
                              style={{
                                width: s.status === 'current' ? 36 : 30,
                                height: s.status === 'current' ? 36 : 30,
                                borderRadius: '50%',
                                fontSize: 13,
                                background: s.status === 'done' ? 'var(--primary)' : s.status === 'current' ? 'var(--reward)' : 'transparent',
                                color: s.status === 'done' ? 'var(--primary-foreground)' : s.status === 'current' ? 'var(--reward-foreground)' : 'var(--muted-foreground)',
                                border: s.status === 'todo' ? '1.5px dashed var(--border)' : 'none',
                                animation: s.status === 'current' ? 'hubPulse 2s ease-in-out infinite' : undefined,
                              }}
                            >
                              {s.status === 'done' ? '✓' : s.lessonNumber}
                            </div>
                            <div
                              title={s.title}
                              style={{
                                fontSize: 10,
                                color: s.status === 'current' ? 'var(--foreground)' : 'var(--muted-foreground)',
                                textAlign: 'center',
                                maxWidth: 100,
                                lineHeight: 1.2,
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                                overflow: 'hidden',
                                wordBreak: 'break-word',
                              }}
                            >
                              {cleanTitle}
                            </div>
                          </div>
                          {i < data.continue!.sequence.length - 1 && (
                            <div style={{ height: 2.5, width: 24, borderRadius: 2, background: s.status === 'done' ? 'var(--primary)' : 'var(--border)' }} />
                          )}
                        </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Glass>
            ) : (
              <Glass style={{ padding: 22 }}>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No lessons are published yet — check back soon.</p>
              </Glass>
            )}

            {/* RETRY */}
            <LaneLabel color="var(--destructive)">Skills to strengthen</LaneLabel>
            {data.retry.length > 0 ? (
              <div className="flex flex-col gap-3">
                {data.retry.map((r) => (
                  <Glass key={r.targetId} style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: r.level === 1 ? 'var(--destructive)' : 'var(--reward)' }} />
                    <div className="flex items-center gap-4 pl-2">
                      <div className="grid place-items-center font-extrabold flex-shrink-0" style={{ width: 46, height: 46, borderRadius: '50%', fontSize: 15, background: r.level === 1 ? 'color-mix(in oklch, var(--destructive) 18%, transparent)' : 'color-mix(in oklch, var(--reward) 32%, transparent)', color: r.level === 1 ? 'var(--destructive)' : 'var(--reward-foreground)' }}>
                        {r.level}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{r.statement}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
                          <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{r.level === 1 ? 'Not yet' : 'Almost'}</span> · {r.domain}
                        </div>
                      </div>
                      <Link href={`/review/${r.targetId}`} className="rounded-lg text-sm" style={{ padding: '9px 16px', border: '1px solid var(--border)', background: 'color-mix(in oklch, var(--card) 60%, transparent)', color: 'var(--foreground)' }}>
                        Practice
                      </Link>
                    </div>
                  </Glass>
                ))}
              </div>
            ) : (
              <Glass style={{ padding: 30, textAlign: 'center', border: '1px solid color-mix(in oklch, var(--success) 40%, var(--border))', background: 'radial-gradient(80% 120% at 50% -20%, color-mix(in oklch, var(--success) 20%, transparent), transparent 60%), color-mix(in oklch, var(--card) 80%, transparent)' }}>
                <div className="grid place-items-center mx-auto mb-3" style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--success)', color: '#fff', fontSize: 28, boxShadow: '0 0 26px color-mix(in oklch, var(--success) 55%, transparent)' }}>✓</div>
                <h3 className="font-bold" style={{ fontSize: 19 }}>All current skills at &ldquo;Got it&rdquo;</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Nothing to retry right now — you&apos;re on top of every target your teacher has checked. Keep climbing.</p>
              </Glass>
            )}

            {/* MASTERY CLIMB */}
            <LaneLabel color="var(--reward)">Your mastery climb</LaneLabel>
            <Glass style={{ padding: 22 }}>
              <div className="flex justify-between items-start gap-4 flex-wrap mb-2">
                <p className="text-sm" style={{ color: 'var(--muted-foreground)', maxWidth: 440 }}>
                  Each dot is a rating from your teacher. The line is your weighted mastery — recent work counts more, but earlier work still counts.
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {DOMAINS.map((dm) => (
                    <button
                      key={dm.key}
                      onClick={() => setDomain(dm.key)}
                      className="rounded-full"
                      style={{
                        fontSize: 12, fontWeight: 600, padding: '5px 12px',
                        border: domain === dm.key ? '1px solid transparent' : '1px solid var(--border)',
                        background: domain === dm.key ? 'var(--reward)' : 'transparent',
                        color: domain === dm.key ? 'var(--reward-foreground)' : 'var(--muted-foreground)',
                      }}
                    >
                      {dm.label}
                    </button>
                  ))}
                </div>
              </div>
              <ClimbChart points={climbForDomain} />
            </Glass>

            {/* SIDE QUEST */}
            <LaneLabel color="var(--success)">Side quest — optional, still earns XP</LaneLabel>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {data.sideQuest.sim && (
                <Link href={`/simulations/${data.sideQuest.sim.slug}`}>
                  <Glass className="h-full" style={{ padding: 18, cursor: 'pointer' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--primary)' }}>Picked for you · Simulation</div>
                    <div className="font-bold mt-1" style={{ fontSize: 16 }}>{data.sideQuest.sim.title}</div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="rounded-full text-xs font-bold" style={{ padding: '4px 11px', background: 'var(--reward)', color: 'var(--reward-foreground)' }}>★ +15 XP</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>Launch →</span>
                    </div>
                  </Glass>
                </Link>
              )}
              <Link href="/vocabulary">
                <Glass className="h-full" style={{ padding: 18, cursor: 'pointer' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--primary)' }}>Picked for you · Game</div>
                  <div className="font-bold mt-1" style={{ fontSize: 16 }}>Vocabulary games</div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="rounded-full text-xs font-bold" style={{ padding: '4px 11px', background: 'var(--reward)', color: 'var(--reward-foreground)' }}>★ +10 XP</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>Play →</span>
                  </div>
                </Glass>
              </Link>
            </div>

            <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <Link href="/simulations">
                <Glass style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: 'linear-gradient(110deg, color-mix(in oklch, var(--primary) 14%, var(--card)), color-mix(in oklch, var(--card) 80%, transparent))' }}>
                  <span className="flex-1"><b style={{ fontSize: 15 }}>Explore all simulations</b><br /><small style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Labs, grouped by unit</small></span>
                  <span style={{ fontSize: 18, color: 'var(--primary)', fontWeight: 700 }}>→</span>
                </Glass>
              </Link>
              <Link href="/vocabulary">
                <Glass style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: 'linear-gradient(110deg, color-mix(in oklch, var(--reward) 14%, var(--card)), color-mix(in oklch, var(--card) 80%, transparent))' }}>
                  <span className="flex-1"><b style={{ fontSize: 15 }}>All games</b><br /><small style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Ways to drill vocab &amp; concepts</small></span>
                  <span style={{ fontSize: 18, color: 'var(--primary)', fontWeight: 700 }}>→</span>
                </Glass>
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}
