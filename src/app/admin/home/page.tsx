"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useViewAs } from '@/lib/use-view-as'
import {
  LayoutGrid, Gift, TrendingUp, Database, Microscope, Gamepad2,
  Settings, Eye, Users, Activity, BookOpen, Award, Sparkles, GraduationCap, BarChart3, CalendarClock,
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

const TOOLS: { href: string; label: string; desc: string; icon: Icon; accent: string; adminOnly?: boolean }[] = [
  { href: '/admin/control-room', label: 'Control Room', desc: 'Class mastery grid — rate from student work', icon: LayoutGrid, accent: 'var(--primary)' },
  { href: '/admin/roster', label: 'Roster & classes', desc: 'Sync Google Classroom rosters & see performance', icon: GraduationCap, accent: 'var(--primary)' },
  { href: '/admin/analytics', label: 'Mastery analytics', desc: 'Disaggregate app-wide performance & ask Claude', icon: BarChart3, accent: 'var(--success)', adminOnly: true },
  { href: '/admin/pacing', label: 'Pacing tracker', desc: 'Map sections to the calendar & track pace', icon: CalendarClock, accent: 'var(--reward)' },
  { href: '/admin/pacing/overview', label: 'Pacing overview', desc: 'Every section vs the master pace, live', icon: CalendarClock, accent: 'var(--primary)', adminOnly: true },
  { href: '/admin/oversight', label: 'App Oversight', desc: 'Colleague adoption, engagement & feature usage', icon: Activity, accent: 'var(--success)', adminOnly: true },
  { href: '/admin/store', label: 'Rewards', desc: 'Fulfil redemptions & manage the points store', icon: Gift, accent: 'var(--reward)' },
  { href: '/admin/mastery', label: 'Mastery entry', desc: 'Log 1-2-3 ratings per student', icon: TrendingUp, accent: 'var(--success)' },
  { href: '/admin/question-bank', label: 'Question bank', desc: 'Author and organize items', icon: Database, accent: 'var(--primary)' },
  { href: '/admin/simulations', label: 'Simulations', desc: 'Manage the 15 interactive labs', icon: Microscope, accent: 'var(--primary)' },
  { href: '/admin/vocabulary', label: 'Vocabulary', desc: 'Term sets and the 7 review games', icon: Gamepad2, accent: 'var(--reward)' },
  { href: '/admin/dashboard', label: 'Admin tools', desc: 'Roster, sections, media & more', icon: Settings, accent: 'var(--muted-foreground)', adminOnly: true },
  { href: '/home', label: 'View as student', desc: 'See the student home experience', icon: Eye, accent: 'var(--muted-foreground)' },
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
  const isAdmin = role === 'admin'
  const tools = isAdmin ? TOOLS : TOOLS.filter((t) => !t.adminOnly)
  const [ov, setOv] = useState<Overview | null>(null)

  useEffect(() => {
    // App-wide numbers are admin-only; teachers don't fetch them.
    if (!isAdmin) return
    fetch('/api/admin/overview')
      .then((r) => r.json())
      .then((d: { overview?: Overview }) => setOv(d.overview ?? null))
      .catch(() => {})
  }, [isAdmin])

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

      {/* tool cards */}
      <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>Jump to</div>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {tools.map((t) => {
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
    </div>
  )
}
