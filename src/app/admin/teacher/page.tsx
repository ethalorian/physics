"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  LayoutGrid, GraduationCap, CalendarClock, Gift, Eye, Sparkles,
  BookOpen, Compass, Check, ArrowRight, type LucideIcon,
} from 'lucide-react'

type StepKey = 'classroom' | 'curriculum' | 'pacing' | 'tour'
interface Status { steps: Record<StepKey, boolean>; doneCount: number; total: number; complete: boolean; classCount: number; untracked?: number }
interface Course { id: string; name: string; section: string | null; track: string | null }

// The four onboarding steps. `action` says how the CTA behaves:
//  - 'link'   → go to `href` (optionally with a "Mark done" for no-signal steps)
//  - 'tracks' → open the curriculum-track picker (real action)
//  - 'tour'   → open the guided walkthrough (real action)
type StepAction = 'link' | 'tracks' | 'tour'
const STEPS: { key: StepKey; label: string; desc: string; href?: string; cta: string; mark: boolean; action: StepAction; Icon: LucideIcon }[] = [
  { key: 'classroom', label: 'Connect Google Classroom', desc: 'Sync a class roster so your students flow into the app.', href: '/admin/roster', cta: 'Connect & import', mark: false, action: 'link', Icon: GraduationCap },
  { key: 'curriculum', label: 'Choose your class type', desc: 'Pick the course you’re teaching. More types are coming.', cta: 'Choose class type', mark: false, action: 'tracks', Icon: BookOpen },
  { key: 'pacing', label: 'Set up pacing & calendar', desc: 'Map your sections to the school calendar.', href: '/admin/pacing', cta: 'Open pacing', mark: true, action: 'link', Icon: CalendarClock },
  { key: 'tour', label: 'Take the quick tour', desc: 'A 2-minute orientation to grading and the Control Room.', cta: 'Show me around', mark: false, action: 'tour', Icon: Compass },
]

// Curriculum tracks. Only CPA is live; the others are reserved for the Honors,
// AP, and Project-Based classes coming later (shown but disabled).
const TRACKS: { id: string; label: string; desc: string; enabled: boolean }[] = [
  { id: 'cpa', label: 'CPA Physics', desc: 'College-Prep Physics — the current curriculum.', enabled: true },
  { id: 'honors', label: 'Honors Physics', desc: 'Coming soon.', enabled: false },
  { id: 'ap', label: 'AP Physics', desc: 'Coming soon.', enabled: false },
  { id: 'pbl', label: 'Project-Based Physics', desc: 'Coming soon.', enabled: false },
]

// Short guided-tour slides.
const TOUR: { title: string; body: string }[] = [
  { title: 'Welcome to your dashboard', body: 'This is home base. The tiles below are your tools; the setup checklist clears as you finish each step.' },
  { title: 'The Control Room', body: 'Mission control for grading. Tap any cell to open a student’s work and rate it, or grade lesson completion as a percentage.' },
  { title: 'Grades → Aspen', body: 'On the Control Room’s Lessons tab, pick a class/section and “Copy grades” gives you a column to paste straight into your Aspen gradebook.' },
  { title: 'Roster, classes & pacing', body: 'Roster syncs your Google Classroom. Open a class to see its students and set lesson open/close dates. Pacing keeps your sections on the calendar.' },
]

// Teacher tools. `needs` ties a tile to an onboarding step — while that step is
// incomplete the tile wears a "Set up" badge.
const TILES: { href: string; label: string; desc: string; Icon: LucideIcon; accent: string; needs?: StepKey }[] = [
  { href: '/admin/teacher/plans', label: 'Lesson plans', desc: 'Your day-by-day teacher plans for each unit', Icon: BookOpen, accent: 'var(--primary)', needs: 'curriculum' },
  { href: '/admin/control-room', label: 'Control Room', desc: 'Rate mastery from student work, grade lessons, copy grades to Aspen', Icon: LayoutGrid, accent: 'var(--primary)', needs: 'classroom' },
  { href: '/admin/roster', label: 'Roster & classes', desc: 'Your synced classes and student performance', Icon: GraduationCap, accent: 'var(--primary)', needs: 'classroom' },
  { href: '/admin/pacing', label: 'Pacing', desc: 'Where each of your sections is on the calendar', Icon: CalendarClock, accent: 'var(--reward)', needs: 'pacing' },
  { href: '/admin/reviews', label: 'Review library', desc: 'Approve AI-generated skill reviews to share with students', Icon: BookOpen, accent: 'var(--success)' },
  { href: '/admin/store', label: 'Rewards', desc: 'Fulfil redemptions and manage the points store', Icon: Gift, accent: 'var(--reward)' },
  { href: '/home', label: 'View as student', desc: 'See what your students see', Icon: Eye, accent: 'var(--muted-foreground)' },
]

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const [status, setStatus] = useState<Status | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [showTracks, setShowTracks] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [tourIdx, setTourIdx] = useState(0)
  const firstName = (session?.user?.name ?? 'there').split(' ')[0]

  const load = useCallback(() => {
    fetch('/api/teacher/onboarding')
      .then((r) => r.json())
      .then((d: Status & { error?: string }) => { if (!d.error) setStatus(d) })
      .catch(() => {})
  }, [])
  const loadCourses = useCallback(() => {
    fetch('/api/teacher/courses')
      .then((r) => r.json())
      .then((d: { courses?: Course[] }) => setCourses(d.courses ?? []))
      .catch(() => {})
  }, [])
  useEffect(() => { load(); loadCourses() }, [load, loadCourses])

  const markDone = async (step: StepKey) => {
    await fetch('/api/teacher/onboarding', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, done: true }),
    }).catch(() => {})
    load()
  }

  // Assign a class type to ONE course; re-derives the curriculum step.
  const assignTrack = async (courseId: string, track: string) => {
    await fetch('/api/teacher/courses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseId, track }),
    }).catch(() => {})
    loadCourses()
    load()
  }
  const openTracks = () => { loadCourses(); setShowTracks(true) }

  const finishTour = async () => {
    await fetch('/api/teacher/onboarding', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 'tour', done: true }),
    }).catch(() => {})
    setShowTour(false)
    setTourIdx(0)
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
                    <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
                      {s.key === 'curriculum' ? 'Classes typed ✓' : 'Done'}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      {s.action === 'link' && s.href ? (
                        <Link href={s.href} className="inline-flex items-center gap-1 text-xs font-semibold rounded-lg px-2.5 py-1.5" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                          {s.cta} <ArrowRight size={13} />
                        </Link>
                      ) : (
                        <button
                          onClick={() => { if (s.action === 'tracks') openTracks(); else if (s.action === 'tour') { setTourIdx(0); setShowTour(true) } }}
                          className="inline-flex items-center gap-1 text-xs font-semibold rounded-lg px-2.5 py-1.5"
                          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}
                        >
                          {s.cta} <ArrowRight size={13} />
                        </button>
                      )}
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

      {/* per-course class-type picker overlay */}
      {showTracks && (
        <div onClick={() => setShowTracks(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'color-mix(in oklch, var(--foreground) 45%, transparent)', display: 'grid', placeItems: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} className="rounded-2xl border p-6 w-full" style={{ maxWidth: 520, maxHeight: '85vh', overflowY: 'auto', background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="text-lg font-semibold tracking-tight mb-1">Assign a class type to each course</div>
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>Set the course type for each imported class. Only CPA Physics is available now — more types are coming.</p>
            {courses.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No imported courses yet. Connect Google Classroom first, then come back to type each class.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {courses.map((c) => (
                  <div key={c.id} className="rounded-xl border p-3" style={{ borderColor: c.track ? 'color-mix(in oklch, var(--success) 40%, var(--border))' : 'color-mix(in oklch, var(--reward) 40%, var(--border))', background: 'var(--card)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{c.name}{c.section ? ` · ${c.section}` : ''}</span>
                      {!c.track && <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--reward-foreground)' }}>Needs type</span>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {TRACKS.map((tr) => {
                        const selected = c.track === tr.id
                        return (
                          <button
                            key={tr.id}
                            onClick={() => tr.enabled && assignTrack(c.id, tr.id)}
                            disabled={!tr.enabled}
                            className="text-xs font-semibold rounded-lg border px-2.5 py-1.5"
                            style={{
                              borderColor: selected ? 'var(--success)' : 'var(--border)',
                              background: selected ? 'color-mix(in oklch, var(--success) 16%, var(--card))' : tr.enabled ? 'var(--card)' : 'color-mix(in oklch, var(--secondary) 50%, transparent)',
                              color: selected ? 'var(--success)' : tr.enabled ? 'var(--foreground)' : 'var(--muted-foreground)',
                              opacity: tr.enabled ? 1 : 0.5, cursor: tr.enabled ? 'pointer' : 'not-allowed',
                            }}
                          >
                            {tr.label}{selected ? ' ✓' : tr.enabled ? '' : ' · soon'}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowTracks(false)} className="mt-4 text-xs font-medium" style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* guided tour overlay */}
      {showTour && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'color-mix(in oklch, var(--foreground) 45%, transparent)', display: 'grid', placeItems: 'center', padding: 16 }}>
          <div className="rounded-2xl border p-6 w-full" style={{ maxWidth: 460, background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Compass size={16} style={{ color: 'var(--primary)' }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Quick tour · {tourIdx + 1} of {TOUR.length}</span>
            </div>
            <div className="text-lg font-semibold tracking-tight mb-1">{TOUR[tourIdx].title}</div>
            <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>{TOUR[tourIdx].body}</p>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setTourIdx((i) => Math.max(0, i - 1))}
                disabled={tourIdx === 0}
                className="text-sm font-medium rounded-lg px-3 py-1.5 disabled:opacity-40"
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)', cursor: tourIdx === 0 ? 'default' : 'pointer' }}
              >
                Back
              </button>
              <div className="flex items-center gap-2">
                <button onClick={finishTour} className="text-sm font-medium" style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}>Skip</button>
                {tourIdx < TOUR.length - 1 ? (
                  <button onClick={() => setTourIdx((i) => Math.min(TOUR.length - 1, i + 1))} className="inline-flex items-center gap-1 text-sm font-semibold rounded-lg px-3 py-1.5" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button onClick={finishTour} className="inline-flex items-center gap-1 text-sm font-semibold rounded-lg px-3 py-1.5" style={{ background: 'var(--success)', color: 'var(--card)', border: 'none', cursor: 'pointer' }}>
                    Done <Check size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
