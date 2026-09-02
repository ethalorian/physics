"use client"

// Class Cockpit — ALL CLASSES landing (Teacher Experience Rework, screen 2a).
// One card per class, cross-class worklist chips on top. Everything a class
// owns lives under its cockpit tabs; this page is the teacher's front door.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GraduationCap, ArrowRight } from 'lucide-react'

interface ClassCard {
  id: string; label: string; track: string | null; program: string | null
  students: number; toRate: number; redemptions: number
  unitName: string | null; dayN: number | null; dayM: number | null; onPace: boolean | null
}
interface Cockpit {
  today: string
  stats: { students: number; activeThisWeek: number; masteryRatings: number }
  worklist: { toRate: number; rewardsToFulfil: number; challengesEndingToday: number; challengesLive: number; unenrolledStudents: number | null }
  classes: ClassCard[]
}

const trackBadge = (c: ClassCard) => {
  const t = (c.program === 'trades' ? 'trades' : c.track) ?? ''
  if (t === 'honors') return { label: 'Honors', color: 'var(--primary)', bg: 'color-mix(in oklch, var(--primary) 12%, transparent)' }
  if (t === 'trades') return { label: 'Trades', color: 'var(--success)', bg: 'color-mix(in oklch, var(--success) 13%, transparent)' }
  if (t === 'cpa') return { label: 'CPA', color: 'var(--muted-foreground)', bg: 'var(--secondary)' }
  return { label: 'Untyped', color: 'var(--muted-foreground)', bg: 'var(--secondary)' }
}

export default function ClassesLanding() {
  const [d, setD] = useState<Cockpit | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/teacher/cockpit')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load your classes'))))
      .then(setD)
      .catch((e) => setError(e.message))
  }, [])

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  const firstName = 'there'

  const chip = (n: number | null, label: string, tint: string, href?: string) => {
    if (n === null || n === 0) return null
    const inner = (
      <span className="inline-flex items-center gap-2 text-sm font-semibold rounded-full px-4 py-2"
        style={{ color: 'var(--foreground)', border: `1px solid color-mix(in oklch, ${tint} 38%, var(--border))`, background: `color-mix(in oklch, ${tint} 7%, transparent)` }}>
        <b className="tabular-nums" style={{ color: tint, fontSize: 15 }}>{n}</b> {label}
      </span>
    )
    return href ? <Link key={label} href={href}>{inner}</Link> : <span key={label}>{inner}</span>
  }

  return (
    <div className="max-w-5xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>{dateLabel}</div>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Morning{firstName === 'there' ? '' : `, ${firstName}`}.</h1>
        </div>
        {d && (
          <div className="flex gap-5">
            {[[d.stats.students, 'students'], [d.stats.activeThisWeek, 'active this week'], [d.stats.masteryRatings, 'mastery ratings']].map(([v, l]) => (
              <div key={l} className="text-right">
                <div className="text-xl font-bold tabular-nums">{v}</div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm mt-4" style={{ color: 'var(--destructive)' }}>{error}</p>}
      {!d && !error && <p className="text-sm mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading your classes…</p>}

      {d && (
        <>
          {/* cross-class worklist */}
          <div className="flex gap-2.5 flex-wrap mt-5">
            {chip(d.worklist.toRate, 'to rate across classes', 'var(--primary)', '/admin/control-room')}
            {chip(d.worklist.rewardsToFulfil, 'rewards to fulfil', 'var(--reward)', '/admin/store')}
            {chip(d.worklist.challengesEndingToday, 'challenge ends today', 'var(--reward)', '/admin/challenges')}
            {chip(d.worklist.unenrolledStudents, 'students not in a class', 'var(--destructive)', '/admin/roster')}
            {d.worklist.toRate === 0 && d.worklist.rewardsToFulfil === 0 && (
              <span className="text-sm py-2" style={{ color: 'var(--muted-foreground)' }}>Nothing waiting — all caught up.</span>
            )}
          </div>

          {/* class cards */}
          <div className="grid gap-3.5 mt-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
            {d.classes.map((c) => {
              const badge = trackBadge(c)
              const busy = c.toRate > 0 || c.redemptions > 0
              return (
                <Link key={c.id} href={`/admin/classes/${c.id}`}
                  className="rounded-2xl border p-5 flex flex-col gap-3 transition-shadow hover:shadow-lg"
                  style={{
                    borderColor: busy ? 'color-mix(in oklch, var(--primary) 45%, var(--border))' : 'var(--border)',
                    background: busy ? 'radial-gradient(120% 160% at 90% -30%, color-mix(in oklch, var(--primary) 9%, transparent), transparent 60%), var(--card)' : 'var(--card)',
                  }}>
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[17px] font-bold truncate">{c.label}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 shrink-0" style={{ color: badge.color, background: badge.bg }}>{badge.label}</span>
                    </div>
                    {c.onPace !== null && (
                      <span className="text-xs font-bold shrink-0" style={{ color: c.onPace ? 'var(--success)' : 'var(--reward-foreground)' }}>
                        {c.onPace ? '✓ on pace' : 'past window'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {c.unitName ?? 'No unit set'}{c.dayN && c.dayM ? ` · Day ${Math.min(c.dayN, c.dayM)} of ${c.dayM}` : ''} · {c.students} students
                  </div>
                  {/* pacing dots */}
                  {c.dayM !== null && c.dayM <= 40 && (
                    <div className="flex gap-1.5 items-center flex-wrap">
                      {Array.from({ length: c.dayM }, (_, i) => {
                        const done = c.dayN !== null && i < Math.min(c.dayN, c.dayM ?? 0) - 1
                        const current = c.dayN !== null && i === Math.min(c.dayN, c.dayM ?? 0) - 1
                        return (
                          <span key={i} style={{
                            width: 20, height: current ? 11 : 8, borderRadius: 4,
                            background: done ? 'var(--primary)' : current ? 'var(--reward)' : 'transparent',
                            border: done || current ? 'none' : '1.5px dashed var(--border)',
                            boxShadow: current ? '0 0 0 2px color-mix(in oklch, var(--reward) 30%, transparent)' : undefined,
                          }} />
                        )
                      })}
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 mt-auto" style={{ borderTop: '1px solid color-mix(in oklch, var(--border) 55%, transparent)' }}>
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                      {c.toRate > 0 ? <><b style={{ color: 'var(--primary)' }}>{c.toRate}</b> to rate</> : 'Nothing waiting'}
                      {c.redemptions > 0 && <> · <b style={{ color: 'var(--reward-foreground)' }}>{c.redemptions}</b> redemption{c.redemptions === 1 ? '' : 's'}</>}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                      Open cockpit <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              )
            })}
            {d.classes.length === 0 && (
              <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                <GraduationCap className="mx-auto mb-2" size={28} style={{ color: 'var(--muted-foreground)' }} />
                <p className="font-semibold">No classes yet</p>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Import from Google Classroom or create a class to see it here.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
