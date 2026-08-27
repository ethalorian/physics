"use client"

import { useEffect, useMemo, useState, type ReactNode, type CSSProperties } from 'react'
import EnrollmentGate from '@/components/EnrollmentGate'
import DailyMathTask from '@/components/math-spine/DailyMathTask'
import Link from 'next/link'
import { Coins, Zap, ChevronDown } from 'lucide-react'
import { decayingAverage } from '@/data/curriculum-types'
import { SectionLabel, StatPill } from '@/components/ds'

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
  program?: 'physics' | 'trades'
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
  /* Static by default (Surface 16: no idle motion) — the twinkle loop is gone. */
  .hub-stars { position: fixed; inset: 0; z-index: -1; opacity: .55;
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
  @keyframes hubPulse { 0%,100% { box-shadow: 0 0 0 5px color-mix(in oklch, var(--reward) 28%, transparent), 0 0 16px var(--reward) }
    50% { box-shadow: 0 0 0 9px color-mix(in oklch, var(--reward) 16%, transparent), 0 0 28px var(--reward) } }
  /* Current-waypoint pulse is guarded: a static ring under reduced motion. */
  @media (prefers-reduced-motion: reduce) {
    .hub-current-waypoint { animation: none !important; box-shadow: 0 0 0 5px color-mix(in oklch, var(--reward) 28%, transparent); }
  }
  @keyframes onbGlow {
    0%, 100% { box-shadow: 0 0 0 0 color-mix(in oklch, var(--primary) 0%, transparent); transform: scale(1); }
    50% { box-shadow: 0 0 18px 2px color-mix(in oklch, var(--primary) 50%, transparent); transform: scale(1.015); }
  }
  .onb-glow { animation: onbGlow 2.4s ease-in-out infinite; will-change: box-shadow, transform; }
  .onb-glow:hover { animation-play-state: paused; }
  @media (prefers-reduced-motion: reduce) { .onb-glow { animation: none; } }
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

// LaneLabel now lives in the design-system kit as <SectionLabel> (prop: accent).

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
  // Onboarding nudge: prompt the student to set up their face + leaderboard
  // name the first time they sign in. Null = haven't checked yet, so we don't
  // flash the banner on initial render.
  const [needsProfileSetup, setNeedsProfileSetup] = useState<boolean | null>(null)

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

  useEffect(() => {
    fetch('/api/avatar/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { setup_completed?: boolean; alias?: string | null } | null) => {
        if (!d) { setNeedsProfileSetup(false); return }
        // Disappears once the avatar is built (the alias is a soft nudge in the
        // builder itself, not a blocker for hiding this onboarding glow).
        setNeedsProfileSetup(!d.setup_completed)
      })
      .catch(() => setNeedsProfileSetup(false))
  }, [])

  const climbForDomain = useMemo(
    () => (data?.climb ?? []).filter((c) => c.domain === domain),
    [data, domain],
  )

  // Compact climb summary for the header row (Surface 16): current weighted
  // band for the selected domain + direction of the latest rating.
  const climbSummary = useMemo(() => {
    const pts = [...climbForDomain].sort((a, b) => a.observedAt.localeCompare(b.observedAt))
    if (pts.length === 0) return null
    const levels = pts.map((p) => p.level)
    const now = decayingAverage(levels)
    if (now === null) return null
    const band = now >= 2.5 ? 'Got it' : now >= 1.5 ? 'Almost' : 'Not yet'
    const before = levels.length > 1 ? decayingAverage(levels.slice(0, -1)) : null
    const arrow = before === null ? '' : now > before ? ' ↑' : now < before ? ' ↓' : ''
    const label = DOMAINS.find((d) => d.key === domain)?.label ?? domain
    return `${label} · ${band}${arrow}`
  }, [climbForDomain, domain])

  return (
    <EnrollmentGate>
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
            {needsProfileSetup && (
              <Link
                href="/avatar"
                className="onb-glow inline-flex items-center gap-2 mt-3 rounded-full px-4 py-2 text-sm font-semibold"
                style={{
                  background: 'color-mix(in oklch, var(--primary) 16%, var(--card))',
                  color: 'var(--primary)',
                  border: '1px solid color-mix(in oklch, var(--primary) 45%, var(--border))',
                }}
              >
                Build your Mii &mdash; make it yours
                <span aria-hidden style={{ opacity: 0.65 }}>&rarr;</span>
              </Link>
            )}
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Here&rsquo;s your path for today — a quick warm-up, then your next lesson.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatPill tone="reward"><Coins size={13} /> {loading ? '—' : data?.points?.xp ?? 0} XP</StatPill>
            {!loading && (data?.streak?.current ?? 0) > 0 && (
              <StatPill tone="muted">
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} /> {data!.streak.current}-day streak
              </StatPill>
            )}
            {/* compact climb summary — the point of the page, lifted up top */}
            {!loading && climbSummary && (
              <StatPill tone="muted">⛰ {climbSummary}</StatPill>
            )}
          </div>
        </div>

        {loading && <p className="text-sm mt-8" style={{ color: 'var(--muted-foreground)' }}>Loading your home…</p>}

        {!loading && data && (
          <>
            {/* CONTINUE — the single primary path. The daily math warm-up is
                folded in as a compact "2-min first" step rather than opening
                the page as an obligation (Surface 16: lead with the path). */}
            <SectionLabel accent="var(--primary)">Continue your journey</SectionLabel>

            <details
              className="mb-3 rounded-2xl overflow-hidden"
              style={{
                border: '1px solid color-mix(in oklch, var(--reward) 40%, var(--border))',
                background: 'color-mix(in oklch, var(--reward) 8%, var(--card))',
              }}
            >
              <summary
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold"
                style={{ cursor: 'pointer', listStyle: 'none', color: 'var(--foreground)' }}
              >
                <span className="grid place-items-center shrink-0" style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--reward)', color: 'var(--reward-foreground)' }}>
                  <Zap size={14} />
                </span>
                Step 1 · 2-minute math warm-up
                <ChevronDown size={15} className="ml-auto" style={{ color: 'var(--muted-foreground)' }} />
              </summary>
              <div className="px-4 pb-4">
                <DailyMathTask />
              </div>
            </details>
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
                <div className="font-semibold tracking-tight" style={{ fontSize: 22, margin: '5px 0 6px' }}>
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
                              className={`grid place-items-center font-bold ${s.status === 'current' ? 'hub-current-waypoint' : ''}`}
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
                                fontSize: 11,
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
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {data.program === 'trades'
                    ? 'Your Trades Physics lessons aren\u2019t published yet — your targets and mastery tasks are live, and lessons will show up here as your teacher releases them.'
                    : 'No lessons are published yet — check back soon.'}
                </p>
              </Glass>
            )}

            {/* RETRY */}
            <SectionLabel accent="var(--destructive)">Skills to strengthen</SectionLabel>
            {data.retry.length > 0 ? (
              <div className="flex flex-col gap-3">
                {data.retry.map((r) => (
                  <Glass key={r.targetId} style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: r.level === 1 ? 'var(--destructive)' : 'var(--reward)' }} />
                    <div className="flex items-center gap-4 pl-2">
                      <div className="grid place-items-center font-bold flex-shrink-0" style={{ width: 46, height: 46, borderRadius: '50%', fontSize: 15, background: r.level === 1 ? 'color-mix(in oklch, var(--destructive) 18%, transparent)' : 'color-mix(in oklch, var(--reward) 32%, transparent)', color: r.level === 1 ? 'var(--destructive)' : 'var(--reward-foreground)' }}>
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
                <h3 className="font-semibold" style={{ fontSize: 18 }}>All current skills at &ldquo;Got it&rdquo;</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Nothing to retry right now — you&apos;re on top of every target your teacher has checked. Keep climbing.</p>
              </Glass>
            )}

            {/* MASTERY CLIMB */}
            <SectionLabel accent="var(--reward)">Your mastery climb</SectionLabel>
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

          </>
        )}
      </div>
    </>
    </EnrollmentGate>
  )
}
