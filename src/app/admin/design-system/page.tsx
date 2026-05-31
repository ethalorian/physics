"use client"

/**
 * Living design-system showcase.
 *
 * Renders every token, component, and pattern from the REAL system, so it stays
 * truthful as the system evolves (change a token in globals.css and this page
 * updates). This is the canonical visual reference — pair it with
 * docs/DESIGN_SYSTEM.md. Route: /admin/design-system (inherits the refined Mac
 * surface, since staff view it).
 */
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SectionLabel, StatPill, ProgressTrack } from '@/components/ds'
import { BookOpen, Eye, Star, Flame, ArrowRight } from 'lucide-react'

const TOKENS: { name: string; v: string; role: string }[] = [
  { name: 'background', v: 'var(--background)', role: 'page surface' },
  { name: 'foreground', v: 'var(--foreground)', role: 'primary text' },
  { name: 'card', v: 'var(--card)', role: 'raised surface' },
  { name: 'primary', v: 'var(--primary)', role: 'brand · actions' },
  { name: 'secondary', v: 'var(--secondary)', role: 'neutral fill' },
  { name: 'muted', v: 'var(--muted)', role: 'neutral tint' },
  { name: 'muted-foreground', v: 'var(--muted-foreground)', role: 'secondary text' },
  { name: 'accent', v: 'var(--accent)', role: 'accent fill' },
  { name: 'reward', v: 'var(--reward)', role: 'gold · reward only' },
  { name: 'success', v: 'var(--success)', role: 'complete/positive' },
  { name: 'destructive', v: 'var(--destructive)', role: 'error/danger' },
  { name: 'border', v: 'var(--border)', role: 'hairlines' },
  { name: 'viz-up', v: 'var(--viz-up)', role: 'chart · positive' },
  { name: 'viz-down', v: 'var(--viz-down)', role: 'chart · negative' },
]

const TYPE: { cls: string; label: string }[] = [
  { cls: 'text-display', label: 'Display — page hero' },
  { cls: 'text-title-1', label: 'Title 1 — section title' },
  { cls: 'text-title-2', label: 'Title 2 — card / lane title' },
  { cls: 'text-title-3', label: 'Title 3 — sub-title' },
  { cls: 'text-body', label: 'Body — the quick brown fox jumps over the lazy dog' },
  { cls: 'text-callout', label: 'Callout — emphasis body text' },
  { cls: 'text-caption', label: 'Caption — metadata and timestamps' },
  { cls: 'text-overline', label: 'Overline — section labels' },
]

const SEQUENCE = [
  { n: '✓', label: 'Velocity', status: 'done' },
  { n: '✓', label: 'Avg vs inst.', status: 'done' },
  { n: '4', label: 'Acceleration', status: 'current' },
  { n: '5', label: 'Free fall', status: 'todo' },
  { n: '6', label: 'Graphs', status: 'todo' },
]

const SOLVE = [
  { k: 'G', label: 'Given', v: 'v₀ = 2 m/s · a = 3 m/s² · t = 4 s', bg: 'var(--viz-up)', fg: '#fff' },
  { k: 'E', label: 'Equation', v: 'v = v₀ + at', bg: 'var(--primary)', fg: 'var(--primary-foreground)' },
  { k: 'W', label: 'Work', v: 'v = 2 + (3)(4) = 2 + 12', bg: 'var(--muted-foreground)', fg: '#fff' },
  { k: 'A', label: 'Answer', v: 'v = 14 m/s', bg: 'var(--reward)', fg: 'var(--reward-foreground)' },
]

export default function DesignSystemPage() {
  return (
    <div className="max-w-4xl mx-auto pb-24">
      <header className="pt-2 pb-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Design system</h1>
        <p className="text-muted-foreground mt-1">
          The live reference for Antocci Physics. Everything below renders from the real tokens and components —
          change a token in <code className="text-sm">globals.css</code> and this page follows. Spec: <code className="text-sm">docs/DESIGN_SYSTEM.md</code>.
        </p>
      </header>

      {/* COLOR TOKENS */}
      <SectionLabel accent="var(--primary)">Color tokens</SectionLabel>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
        {TOKENS.map((t) => (
          <div key={t.name} className="rounded-lg border border-border overflow-hidden bg-card">
            <div style={{ background: t.v, height: 52, borderBottom: '1px solid var(--border)' }} />
            <div className="px-3 py-2">
              <div className="text-sm font-medium text-foreground">{t.name}</div>
              <div className="text-caption">{t.role}</div>
            </div>
          </div>
        ))}
      </div>

      {/* TYPE SCALE */}
      <SectionLabel accent="var(--primary)">Type scale</SectionLabel>
      <Card>
        <CardContent className="space-y-3 pt-6">
          {TYPE.map((t) => (
            <div key={t.cls} className="flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
              <span className={t.cls}>{t.label}</span>
              <code className="text-caption shrink-0">.{t.cls}</code>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ELEVATION + RADIUS */}
      <SectionLabel accent="var(--primary)">Elevation &amp; radius</SectionLabel>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        {['apple-shadow-sm', 'apple-shadow', 'apple-shadow-lg', 'card-elevation'].map((s) => (
          <div key={s} className={`rounded-xl bg-card border border-border p-5 ${s}`}>
            <div className="text-sm font-medium">Elevation</div>
            <code className="text-caption">.{s}</code>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 mt-4">
        {[['radius-sm', 'var(--radius-sm)'], ['radius-md', 'var(--radius-md)'], ['radius-lg', 'var(--radius-lg)'], ['radius-xl', 'var(--radius-xl)']].map(([n, v]) => (
          <div key={n} className="text-center">
            <div className="bg-secondary border border-border" style={{ width: 72, height: 72, borderRadius: v }} />
            <code className="text-caption">{n}</code>
          </div>
        ))}
      </div>

      {/* BUTTONS */}
      <SectionLabel accent="var(--primary)">Buttons</SectionLabel>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button><BookOpen /> With icon</Button>
            <Button variant="outline">Continue <ArrowRight /></Button>
          </div>
        </CardContent>
      </Card>

      {/* INPUTS */}
      <SectionLabel accent="var(--primary)">Inputs</SectionLabel>
      <Card>
        <CardContent className="pt-6 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Input placeholder="Search lessons…" />
          <Input type="email" placeholder="name@example.com" />
          <Input disabled placeholder="Disabled" />
        </CardContent>
      </Card>

      {/* CARD anatomy */}
      <SectionLabel accent="var(--primary)">Card</SectionLabel>
      <Card>
        <CardHeader>
          <CardTitle>Acceleration &amp; the kinematic equations</CardTitle>
          <CardDescription>Unit 3 · Kinematics · Lesson 4</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-body text-muted-foreground">
            Card is the default container — glass surface, one tinted elevation, a solid hairline border.
            Header / content / footer compose it.
          </p>
        </CardContent>
        <CardFooter className="border-t pt-5">
          <Button size="sm"><Eye /> View lesson</Button>
        </CardFooter>
      </Card>

      {/* PILLS / BADGES */}
      <SectionLabel accent="var(--reward)">Stat pills &amp; badges</SectionLabel>
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3 items-center">
          <StatPill tone="reward"><Star className="h-3.5 w-3.5" /> 1,240 XP</StatPill>
          <StatPill tone="success">7 of 11 fluent</StatPill>
          <StatPill tone="primary">In progress</StatPill>
          <StatPill tone="muted"><Flame className="h-3.5 w-3.5" /> 6-day streak</StatPill>
          <Badge>Badge</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
        </CardContent>
      </Card>

      {/* SECTION LABELS */}
      <SectionLabel accent="var(--primary)">Section labels</SectionLabel>
      <Card>
        <CardContent className="pt-2">
          <SectionLabel accent="var(--primary)">Continue your journey</SectionLabel>
          <SectionLabel accent="var(--reward)">Your mastery climb</SectionLabel>
          <SectionLabel accent="var(--success)">Side quest — still earns XP</SectionLabel>
          <SectionLabel accent="var(--destructive)">Skills to strengthen</SectionLabel>
        </CardContent>
      </Card>

      {/* PROGRESS */}
      <SectionLabel accent="var(--primary)">Progress</SectionLabel>
      <Card>
        <CardContent className="pt-6 space-y-4">
          {[24, 62, 100].map((v) => (
            <div key={v} className="flex items-center gap-3">
              <ProgressTrack value={v} />
              <span className="text-caption shrink-0 tabular-nums">{v}%</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* PATTERN: sequence chips */}
      <SectionLabel accent="var(--primary)">Pattern · sequence chips</SectionLabel>
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-2">
          {SEQUENCE.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-2 rounded-full text-sm font-medium pl-2 pr-3 py-1.5 border"
              style={{
                borderColor: s.status === 'current' ? 'var(--primary)' : 'var(--border)',
                background: s.status === 'current' ? 'color-mix(in oklch, var(--primary) 8%, transparent)' : 'transparent',
                color: s.status === 'todo' ? 'var(--muted-foreground)' : 'var(--foreground)',
              }}
            >
              <span
                className="grid place-items-center rounded-full text-[11px] font-bold"
                style={{
                  width: 18, height: 18,
                  background: s.status === 'done' ? 'var(--success)' : s.status === 'current' ? 'var(--primary)' : 'var(--secondary)',
                  color: s.status === 'done' ? '#fff' : s.status === 'current' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}
              >
                {s.n}
              </span>
              {s.label}
            </span>
          ))}
        </CardContent>
      </Card>

      {/* PATTERN: solve box */}
      <SectionLabel accent="var(--reward)">Pattern · solve box (GIVEN · EQUATION · WORK · ANSWER)</SectionLabel>
      <div className="rounded-xl border border-border overflow-hidden">
        {SOLVE.map((r, i) => (
          <div key={r.k} className="grid items-start" style={{ gridTemplateColumns: '132px 1fr', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
            <div className="flex items-center gap-2.5 px-4 py-3.5 bg-muted">
              <span className="grid place-items-center rounded-lg text-[13px] font-bold" style={{ width: 24, height: 24, background: r.bg, color: r.fg }}>{r.k}</span>
              <span className="text-overline">{r.label}</span>
            </div>
            <div className="px-4 py-3.5 text-body" style={{ fontWeight: r.k === 'A' ? 600 : 400 }}>{r.v}</div>
          </div>
        ))}
      </div>

      <p className="text-caption mt-10">
        Reference implementation: <code>docs/ux-rebuild-prototype.html</code>. Spec: <code>docs/DESIGN_SYSTEM.md</code>.
      </p>
    </div>
  )
}
