"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useViewAs } from '@/lib/use-view-as'
import {
  LayoutGrid, Gift, TrendingUp, Microscope, Gamepad2,
  Eye, Users, Activity, BookOpen, Award, Sparkles, GraduationCap, BarChart3, CalendarClock,
  type LucideIcon,
} from 'lucide-react'

interface Overview {
  students: number
  colleagues: number
  publishedLessons: number
  masteryRatings: number
  pendingRewards: number
  activeStudents7d: number
}

type Icon = LucideIcon

type Tool = { href: string; label: string; desc: string; icon: Icon; accent: string; adminOnly?: boolean }

// Grouped so the command center reads as a hierarchy, not a wall of cards.
// Daily teaching tools first; admin-only insight/build surfaces gated by role.
const GROUPS: { title: string; tools: Tool[] }[] = [
  {
    title: 'Teach & grade',
    tools: [
      { href: '/admin/control-room', label: 'Control Room', desc: 'Rate mastery from student work, grade lessons, copy grades to Aspen', icon: LayoutGrid, accent: 'var(--primary)' },
      { href: '/admin/roster', label: 'Roster & classes', desc: 'Sync Google Classroom rosters and see performance', icon: GraduationCap, accent: 'var(--primary)' },
      { href: '/admin/store', label: 'Rewards', desc: 'Fulfil redemptions and manage the points store', icon: Gift, accent: 'var(--reward)' },
    ],
  },
  {
    title: 'Plan & build',
    tools: [
      { href: '/admin/dashboard', label: 'Lessons & builder', desc: 'Author lesson blocks, unit by unit', icon: BookOpen, accent: 'var(--primary)', adminOnly: true },
      { href: '/admin/pacing', label: 'Pacing', desc: 'Map your sections to the calendar — all-section overview inside', icon: CalendarClock, accent: 'var(--reward)' },
    ],
  },
  {
    title: 'Insights',
    tools: [
      { href: '/admin/analytics', label: 'Mastery analytics', desc: 'Disaggregate app-wide performance and ask Claude', icon: BarChart3, accent: 'var(--success)', adminOnly: true },
      { href: '/admin/oversight', label: 'App Oversight', desc: 'Colleague adoption, engagement and feature usage', icon: Activity, accent: 'var(--success)', adminOnly: true },
    ],
  },
  {
    title: 'Content library',
    tools: [
      { href: '/admin/simulations', label: 'Simulations', desc: 'Manage the interactive labs', icon: Microscope, accent: 'var(--primary)' },
      { href: '/admin/vocabulary', label: 'Vocabulary', desc: 'Term sets and the review games', icon: Gamepad2, accent: 'var(--reward)' },
    ],
  },
  {
    title: 'Preview',
    tools: [
      { href: '/home', label: 'View as student', desc: 'See the student home experience', icon: Eye, accent: 'var(--muted-foreground)' },
    ],
  },
]

function StatTile({ icon: Ico, value, label, accent }: { icon: Icon; value: number | string; label: string; accent: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <Ico size={18} className="opacity-70" />
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
      <div style={{ height: 3, borderRadius: 2, marginTop: 8, background: accent, opacity: 0.85 }} />
    </div>
  )
}

export default function AdminHomePage() {
  const { data: session } = useSession()
  const { role } = useViewAs()
  const router = useRouter()
  const isAdmin = role === 'admin'
  // The command center is the ADMIN home. Teacher-role users have their own
  // dashboard — send them there (also covers the staff nav "Home" link).
  useEffect(() => {
    if (role === 'teacher') router.replace('/admin/teacher')
  }, [role, router])
  // Drop admin-only tools for teachers, then drop any group left empty.
  const groups = GROUPS
    .map((g) => ({ ...g, tools: isAdmin ? g.tools : g.tools.filter((t) => !t.adminOnly) }))
    .filter((g) => g.tools.length > 0)
  const [ov, setOv] = useState<Overview | null>(null)
  const [reqs, setReqs] = useState<{ email: string; name: string | null; note: string | null }[]>([])

  useEffect(() => {
    // App-wide numbers are admin-only; teachers don't fetch them.
    if (!isAdmin) return
    fetch('/api/admin/overview')
      .then((r) => r.json())
      .then((d: { overview?: Overview }) => setOv(d.overview ?? null))
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

  return (
    <div className="max-w-6xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
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
          Everything across the application, in one place — your classes, your colleagues, and the whole student body.
        </p>
      </div>

      {/* teacher-access requests — alert + approve/deny (admin only) */}
      {isAdmin && reqs.length > 0 && (
        <div className="rounded-2xl border p-5 mb-7" style={{ borderColor: 'color-mix(in oklch, var(--reward) 45%, var(--border))', background: 'color-mix(in oklch, var(--reward) 10%, var(--card))' }}>
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

      {/* stats — app-wide numbers, admin only */}
      {isAdmin && (
        <div className="grid gap-3 mb-7" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <StatTile icon={Users} value={ov ? ov.students : '—'} label="Enrolled students" accent="var(--primary)" />
          <StatTile icon={Award} value={ov ? ov.colleagues : '—'} label="Teachers onboarded" accent="var(--reward)" />
          <StatTile icon={Activity} value={ov ? ov.activeStudents7d : '—'} label="Active this week" accent="var(--success)" />
          <StatTile icon={BookOpen} value={ov ? ov.publishedLessons : '—'} label="Published lessons" accent="var(--primary)" />
          <StatTile icon={TrendingUp} value={ov ? ov.masteryRatings : '—'} label="Mastery ratings logged" accent="var(--success)" />
          <StatTile icon={Gift} value={ov ? ov.pendingRewards : '—'} label="Rewards to fulfil" accent="var(--reward)" />
        </div>
      )}

      {/* tool cards, grouped */}
      {groups.map((g) => (
        <section key={g.title} className="mb-7">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>{g.title}</div>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {g.tools.map((t) => {
              const Ico = t.icon
              return (
                <Link key={t.href} href={t.href}>
                  <div
                    className="rounded-2xl border p-5 h-full transition-transform"
                    style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = t.accent }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
                  >
                    <div
                      className="grid place-items-center mb-3"
                      style={{ width: 44, height: 44, borderRadius: 12, background: `color-mix(in oklch, ${t.accent} 16%, transparent)`, color: t.accent }}
                    >
                      <Ico size={22} />
                    </div>
                    <div className="font-bold" style={{ fontSize: 16 }}>{t.label}</div>
                    <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{t.desc}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
