"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  LayoutGrid, GraduationCap, CalendarClock, Gift, Eye, Sparkles,
  BookOpen, Compass, Check, ArrowRight, type LucideIcon,
} from 'lucide-react'

type StepKey = 'classroom' | 'curriculum' | 'pacing' | 'tour'
interface Status { steps: Record<StepKey, boolean>; doneCount: number; total: number; complete: boolean; classCount: number }

// The four onboarding steps. `href` is where the teacher does the work; `mark`
// means the dashboard offers a "mark done" button (steps without a data signal).
const STEPS: { key: StepKey; label: string; desc: string; href: string; cta: string; mark: boolean; Icon: LucideIcon }[] = [
  { key: 'classroom', label: 'Connect Google Classroom', desc: 'Sync a class roster so your students flow into the app.', href: '/admin/roster', cta: 'Connect & import', mark: false, Icon: GraduationCap },
  { key: 'curriculum', label: 'Confirm your units', desc: 'Pick the units you’re teaching this term.', href: '/admin/dashboard', cta: 'Review units', mark: true, Icon: BookOpen },
  { key: 'pacing', label: 'Set up pacing & calendar', desc: 'Map your sections to the school calendar.', href: '/admin/pacing', cta: 'Open pacing', mark: true, Icon: CalendarClock },
  { key: 'tour', label: 'Take the quick tour', desc: 'A 2-minute orientation to grading and the Control Room.', href: '/admin/control-room', cta: 'Show me around', mark: true, Icon: Compass },
]

// Teacher tools. `needs` ties a tile to an onboarding step — while that step is
// incomplete the tile wears a "Set up" badge.
const TILES: { href: string; label: string; desc: string; Icon: LucideIcon; accent: string; needs?: StepKey }[] = [
  { href: '/admin/control-room', label: 'Control Room', desc: 'Rate mastery from student work, grade lessons, copy grades to Aspen', Icon: LayoutGrid, accent: 'var(--primary)', needs: 'classroom' },
  { href: '/admin/roster', label: 'Roster & classes', desc: 'Your synced classes and student performance', Icon: GraduationCap, accent: 'var(--primary)', needs: 'classroom' },
  { href: '/admin/pacing', label: 'Pacing', desc: 'Where each of your sections is on the calendar', Icon: CalendarClock, accent: 'var(--reward)', needs: 'pacing' },
  { href: '/admin/store', label: 'Rewards', desc: 'Fulfil redemptions and manage the points store', Icon: Gift, accent: 'var(--reward)' },
  { href: '/home', label: 'View as student', desc: 'See what your students see', Icon: Eye, accent: 'var(--muted-foreground)' },
]

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const [status, setStatus] = useState<Status | null>(null)
  const firstName = (session?.user?.name ?? 'there').split(' ')[0]

  const load = useCallback(() => {
    fetch('/api/teacher/onboarding')
      .then((r) => r.json())
      .then((d: Status & { error?: string }) => { if (!d.error) setStatus(d) })
      .catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  const markDone = async (step: StepKey) => {
    await fetch('/api/teacher/onboarding', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, done: true }),
    }).catch(() => {})
    load()
  }

  const steps = status?.steps
  const setupComplete = status?.complete ?? false

  return (
    <div className="max-w-6xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      {/* header */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          border: '1px solid color-mix(in oklch, var(--primary) 30%, var(--border))',
          background: 'radial-gradient(90% 140% at 92% -20%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 55%), var(--card)',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} style={{ color: 'var(--primary)' }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Teacher dashboard</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome{status ? `, ${firstName}` : ''}.</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          {setupComplete
            ? 'You’re all set up. Everything you need to teach is below.'
            : 'Let’s get your room ready — finish the setup steps and the badges below will clear.'}
        </p>
      </div>

      {/* onboarding checklist (until all four are done) */}
      {status && !setupComplete && (
        <div className="rounded-2xl border p-5 mb-7" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Get set up</div>
            <div className="flex items-center gap-2">
              <div className="rounded-full overflow-hidden" style={{ width: 140, height: 8, background: 'var(--secondary)' }}>
                <span style={{ display: 'block', height: '100%', width: `${(status.doneCount / status.total) * 100}%`, background: 'var(--primary)', borderRadius: 9999 }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{status.doneCount} of {status.total}</span>
            </div>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {STEPS.map((s) => {
              const done = steps?.[s.key] ?? false
              const Ico = s.Icon
              return (
                <div key={s.key} className="rounded-xl border p-4 flex flex-col" style={{ borderColor: done ? 'color-mix(in oklch, var(--success) 45%, var(--border))' : 'var(--border)', background: done ? 'color-mix(in oklch, var(--success) 8%, var(--card))' : 'var(--card)' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="grid place-items-center" style={{ width: 30, height: 30, borderRadius: 8, background: done ? 'var(--success)' : `color-mix(in oklch, var(--primary) 14%, transparent)`, color: done ? 'var(--card)' : 'var(--primary)' }}>
                      {done ? <Check size={17} /> : <Ico size={17} />}
                    </span>
                    <span className="font-semibold text-sm">{s.label}</span>
                  </div>
                  <p className="text-xs mb-3 flex-1" style={{ color: 'var(--muted-foreground)' }}>{s.desc}</p>
                  {done ? (
                    <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>Done</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link href={s.href} className="inline-flex items-center gap-1 text-xs font-semibold rounded-lg px-2.5 py-1.5" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                        {s.cta} <ArrowRight size={13} />
                      </Link>
                      {s.mark && (
                        <button onClick={() => markDone(s.key)} className="text-xs font-medium rounded-lg border px-2.5 py-1.5" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                          Mark done
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* tools */}
      <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>Your tools</div>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {TILES.map((t) => {
          const Ico = t.Icon
          const needsSetup = t.needs ? !(steps?.[t.needs] ?? false) : false
          return (
            <Link key={t.href} href={t.href}>
              <div
                className="rounded-2xl border p-5 h-full transition-transform relative"
                style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = t.accent }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                {needsSetup && (
                  <span className="absolute" style={{ top: 12, right: 12, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--reward-foreground)', background: 'color-mix(in oklch, var(--reward) 30%, transparent)', borderRadius: 9999, padding: '3px 8px' }}>
                    Set up
                  </span>
                )}
                <div className="grid place-items-center mb-3" style={{ width: 44, height: 44, borderRadius: 12, background: `color-mix(in oklch, ${t.accent} 16%, transparent)`, color: t.accent }}>
                  <Ico size={22} />
                </div>
                <div className="font-bold" style={{ fontSize: 16 }}>{t.label}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{t.desc}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
