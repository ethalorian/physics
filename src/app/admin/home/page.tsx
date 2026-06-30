"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useViewAs } from '@/lib/use-view-as'
import {
  Gift, TrendingUp, Users, Activity, BookOpen, Award, Sparkles, FileText,
  CheckCircle2, ArrowRight, type LucideIcon,
} from 'lucide-react'

interface Overview {
  students: number
  colleagues: number
  publishedLessons: number
  unpublishedLessons: number
  masteryRatings: number
  pendingRewards: number
  activeStudents7d: number
}

type Icon = LucideIcon

// A single actionable item in the "Needs you today" strip.
type WorkItem = { key: string; count: number; label: string; href: string; accent: string; icon: Icon }

function StatTile({ icon: Ico, value, label }: { icon: Icon; value: number | string; label: string }) {
  // Demoted: vanity numbers are context, not a call to action — quiet, compact,
  // no accent bar. The day's real work lives in the "Needs you today" strip.
  return (
    <div className="rounded-xl border px-3 py-2.5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="flex items-center gap-2">
        <Ico size={14} style={{ color: 'var(--muted-foreground)' }} />
        <div className="text-lg font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>{value}</div>
      </div>
      <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
    </div>
  )
}

export default function AdminHomePage() {
  const { data: session } = useSession()
  const { role } = useViewAs()
  const router = useRouter()
  const isAdmin = role === 'admin'
  // The command center is the ADMIN home. Teachers have their own home — send
  // them there if they land here directly.
  useEffect(() => {
    if (role === 'teacher') router.replace('/admin/teacher')
  }, [role, router])

  const [ov, setOv] = useState<Overview | null>(null)
  const [reqs, setReqs] = useState<{ email: string; name: string | null; note: string | null }[]>([])
  const [orphanCount, setOrphanCount] = useState<number>(0)

  useEffect(() => {
    // App-wide numbers are admin-only; teachers don't fetch them.
    if (!isAdmin) return
    fetch('/api/admin/overview')
      .then((r) => r.json())
      .then((d: { overview?: Overview }) => setOv(d.overview ?? null))
      .catch(() => {})
    fetch('/api/admin/orphans')
      .then((r) => r.json())
      .then((d: { count?: number }) => setOrphanCount(d.count ?? 0))
      .catch(() => {})
  }, [isAdmin])

  const loadReqs = () => {
    fetch('/api/admin/teacher-requests')
      .then((r) => r.json())
      .then((d: { pending?: { email: string; name: string | null; note: string | null }[] }) => setReqs(d.pending ?? []))
      .catch(() => {})
  }
  useEffect(() => { if (isAdmin) loadReqs() }, [isAdmin])

  const decideRequest = async (email: string, decision: 'approve' | 'deny') => {
    await fetch('/api/admin/teacher-requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, decision }),
    }).catch(() => {})
    loadReqs()
  }

  const firstName = (session?.user?.name ?? 'there').split(' ')[0]

  // The day's actionable work, promoted above the vanity stats. Each item links
  // to where the work gets done; only non-zero items render.
  const work: WorkItem[] = [
    { key: 'requests', count: reqs.length, label: reqs.length === 1 ? 'teacher-access request' : 'teacher-access requests', href: '#teacher-requests', accent: 'var(--destructive)', icon: Award },
    { key: 'rewards', count: ov?.pendingRewards ?? 0, label: 'rewards to fulfil', href: '/admin/store', accent: 'var(--reward)', icon: Gift },
    { key: 'orphans', count: orphanCount, label: orphanCount === 1 ? 'student not in a class' : 'students not in a class', href: '/admin/orphans', accent: 'var(--destructive)', icon: Users },
    { key: 'drafts', count: ov?.unpublishedLessons ?? 0, label: ov?.unpublishedLessons === 1 ? 'unpublished draft' : 'unpublished drafts', href: '/admin/dashboard', accent: 'var(--primary)', icon: FileText },
  ].filter((w) => w.count > 0)

  const loaded = ov !== null
  const allCaughtUp = isAdmin && loaded && work.length === 0

  return (
    <div className="max-w-5xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      {/* header */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          border: '1px solid color-mix(in oklch, var(--primary) 30%, var(--border))',
          background:
            'radial-gradient(90% 140% at 92% -20%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 55%), var(--card)',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} style={{ color: 'var(--primary)' }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Command center</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}.</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          What needs you today is up top. Everything else is one click away in the sidebar.
        </p>
      </div>

      {/* NEEDS YOU TODAY — the actionable worklist, promoted above the vanity stats */}
      {isAdmin && (
        <section className="mb-7">
          <div className="text-overline mb-2" style={{ color: 'var(--muted-foreground)' }}>Needs you today</div>
          {work.length > 0 ? (
            <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {work.map((w) => {
                const Ico = w.icon
                return (
                  <Link
                    key={w.key}
                    href={w.href}
                    className="flex items-center gap-3 rounded-2xl border p-3.5"
                    style={{ borderColor: `color-mix(in oklch, ${w.accent} 38%, var(--border))`, background: `color-mix(in oklch, ${w.accent} 7%, var(--card))` }}
                  >
                    <span className="grid place-items-center shrink-0" style={{ width: 38, height: 38, borderRadius: 11, background: `color-mix(in oklch, ${w.accent} 16%, transparent)`, color: w.accent }}>
                      <Ico size={19} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-bold tracking-tight" style={{ color: w.accent }}>{w.count}</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{w.label}</span>
                      </div>
                    </div>
                    <ArrowRight size={16} style={{ color: w.accent }} />
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border p-3.5" style={{ borderColor: 'color-mix(in oklch, var(--success) 40%, var(--border))', background: 'color-mix(in oklch, var(--success) 7%, var(--card))' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                {allCaughtUp ? 'All caught up — nothing waiting on you right now.' : 'Loading the day’s worklist…'}
              </span>
            </div>
          )}
        </section>
      )}

      {/* teacher-access requests — alert + approve/deny (admin only) */}
      {isAdmin && reqs.length > 0 && (
        <div id="teacher-requests" className="rounded-2xl border p-5 mb-7" style={{ borderColor: 'color-mix(in oklch, var(--reward) 45%, var(--border))', background: 'color-mix(in oklch, var(--reward) 10%, var(--card))', scrollMarginTop: 80 }}>
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} style={{ color: 'var(--reward-foreground)' }} />
            <span className="text-sm font-bold">Teacher access {reqs.length === 1 ? 'request' : 'requests'} ({reqs.length})</span>
          </div>
          <div className="flex flex-col gap-2">
            {reqs.map((r) => (
              <div key={r.email} className="flex items-center justify-between gap-3 flex-wrap rounded-xl border px-3 py-2.5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{r.name || r.email}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{r.email}{r.note ? ` — “${r.note}”` : ''}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => decideRequest(r.email, 'approve')} className="text-xs font-semibold rounded-lg px-3 py-1.5" style={{ background: 'var(--success)', color: 'var(--card)', border: 'none', cursor: 'pointer' }}>Approve</button>
                  <button onClick={() => decideRequest(r.email, 'deny')} className="text-xs font-medium rounded-lg px-3 py-1.5" style={{ background: 'transparent', color: 'var(--muted-foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}>Deny</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* stats — app-wide numbers, admin only, demoted to a quiet context row */}
      {isAdmin && (
        <section>
          <div className="text-overline mb-2" style={{ color: 'var(--muted-foreground)' }}>At a glance</div>
          <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
            <StatTile icon={Users} value={ov ? ov.students : '—'} label="Enrolled students" />
            <StatTile icon={Award} value={ov ? ov.colleagues : '—'} label="Teachers onboarded" />
            <StatTile icon={Activity} value={ov ? ov.activeStudents7d : '—'} label="Active this week" />
            <StatTile icon={BookOpen} value={ov ? ov.publishedLessons : '—'} label="Published lessons" />
            <StatTile icon={TrendingUp} value={ov ? ov.masteryRatings : '—'} label="Mastery ratings logged" />
          </div>
        </section>
      )}
    </div>
  )
}
