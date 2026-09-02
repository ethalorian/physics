"use client"

// Class Cockpit — per-class screens 2b/2c/2d of the Teacher Experience Rework.
// Class-tab strip on top (jump between your blocks), then Overview /
// Roster & analytics / Engagement / Pacing / Plans. Everything the class owns
// lives here; Control Room stays the deep grading surface this links into.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface ClassCard {
  id: string; label: string; track: string | null; program: string | null
  students: number; toRate: number; redemptions: number
  unitName: string | null; dayN: number | null; dayM: number | null; onPace: boolean | null
}
interface Cockpit { classes: ClassCard[]; worklist: { challengesLive: number } }
interface RosterRow {
  id: string; name: string; lastActive: string | null; idleDays: number | null
  lessonsDone: number; xpWeek: number; pending: number
  cells: Record<string, number | null>; unitAvg: number | null
}
interface RosterData {
  targets: { id: string; slug: string; statement: string }[]
  students: RosterRow[]
  summary: { classAvg: number | null; fluent: number; total: number; activeThisWeek: number; weakestTarget: { slug: string; almost: number } | null }
}
interface Challenge { id: string; title: string; target: number; bonus_xp: number; metric: string; ends_on: string; active: boolean; completedToday: number; assignments: { course_id: string | null; label: string }[]; is_global?: boolean }
interface Redemption { id: string; user_email?: string; reward_name: string; cost_points: number; status: string }

const TABS = ['Overview', 'Roster & analytics', 'Engagement', 'Pacing', 'Plans'] as const
type Tab = typeof TABS[number]

const band = (v: number | null) => {
  if (v === null) return { color: 'var(--muted-foreground)', bg: 'var(--secondary)' }
  if (v >= 2.45) return { color: 'var(--success)', bg: 'color-mix(in oklch, var(--success) 14%, transparent)' }
  if (v >= 1.7) return { color: 'var(--reward-foreground)', bg: 'color-mix(in oklch, var(--reward) 18%, transparent)' }
  return { color: 'var(--destructive)', bg: 'color-mix(in oklch, var(--destructive) 10%, transparent)' }
}
const initials = (name: string) => name.split(/\s+/).map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase()
const ago = (iso: string | null) => {
  if (!iso) return 'never'
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  return d <= 0 ? 'Today' : d === 1 ? 'Yesterday' : new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function ClassCockpit() {
  const params = useParams<{ courseId: string }>()
  const search = useSearchParams()
  const router = useRouter()
  const courseId = params.courseId
  const tab = (search.get('tab') as Tab) || 'Overview'

  const [cockpit, setCockpit] = useState<Cockpit | null>(null)
  const [roster, setRoster] = useState<RosterData | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch('/api/teacher/cockpit').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) setCockpit(d) }).catch(() => {})
  }, [])
  const loadRoster = useCallback(() => {
    fetch(`/api/teacher/cockpit/roster?class=${courseId}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) setRoster(d) }).catch(() => {})
  }, [courseId])
  useEffect(() => { loadRoster() }, [loadRoster])
  useEffect(() => {
    fetch('/api/teacher/challenges').then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.challenges) setChallenges(d.challenges) }).catch(() => {})
    fetch('/api/rewards/manage').then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.redemptions) setRedemptions(d.redemptions.filter((x: Redemption) => x.status === 'pending' || x.status === 'approved')) }).catch(() => {})
  }, [])

  const me = cockpit?.classes.find((c) => c.id === courseId) ?? null
  const classChallenges = useMemo(
    () => challenges.filter((c) => c.is_global || c.assignments.some((a) => a.course_id === courseId)),
    [challenges, courseId]
  )
  const setTab = (t: Tab) => router.replace(`/admin/classes/${courseId}?tab=${encodeURIComponent(t)}`)

  const setRedemption = async (id: string, status: string) => {
    await fetch('/api/rewards/manage', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ redemption_id: id, status }) }).catch(() => {})
    setRedemptions((prev) => prev.filter((r) => r.id !== id))
  }

  const attention = (roster?.students ?? []).filter((s) => (s.idleDays ?? 0) >= 3 || (s.unitAvg !== null && s.unitAvg < 2.0)).slice(0, 4)
  const steady = roster ? roster.summary.total - attention.length : 0
  const shownRows = roster ? (showAll ? roster.students : roster.students.slice(0, 8)) : []

  return (
    <div className="max-w-6xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      {/* class-tab strip */}
      <div className="flex gap-1.5 items-end flex-wrap">
        {(cockpit?.classes ?? []).map((c) => {
          const active = c.id === courseId
          return (
            <Link key={c.id} href={`/admin/classes/${c.id}?tab=${encodeURIComponent(tab)}`}
              className="text-sm font-semibold px-4 py-2 rounded-t-xl"
              style={{
                color: active ? 'var(--primary)' : 'var(--muted-foreground)',
                background: 'var(--card)',
                border: `1px solid ${active ? 'color-mix(in oklch, var(--primary) 45%, var(--border))' : 'var(--border)'}`,
                borderBottom: active ? '2px solid var(--card)' : 'none',
                position: 'relative', top: 1, fontWeight: active ? 700 : 600,
              }}>
              {c.label}{c.toRate > 0 && !active && <span style={{ color: 'var(--reward-foreground)' }}> ·</span>}
            </Link>
          )
        })}
        <Link href="/admin/classes" className="text-sm font-semibold px-3 py-2 ml-auto" style={{ color: 'var(--muted-foreground)' }}>All classes ↗</Link>
      </div>

      <div className="rounded-b-2xl rounded-tr-2xl border p-5" style={{ borderColor: 'color-mix(in oklch, var(--primary) 30%, var(--border))', background: 'var(--card)' }}>
        {/* header + inner tabs */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div>
            <div className="text-xl font-bold tracking-tight">{me?.label ?? '…'}</div>
            <div className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {me ? `${me.students} students${me.unitName ? ` · ${me.unitName}` : ''}${me.dayN && me.dayM ? ` · Day ${Math.min(me.dayN, me.dayM)} of ${me.dayM}` : ''}` : ''}
            </div>
          </div>
          <div className="flex gap-0.5 rounded-xl p-1" style={{ border: '1px solid var(--border)', background: 'var(--secondary)' }}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className="text-sm px-3.5 py-1.5 rounded-lg"
                style={{
                  fontWeight: t === tab ? 700 : 500,
                  color: t === tab ? 'var(--primary)' : 'var(--muted-foreground)',
                  background: t === tab ? 'var(--card)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  boxShadow: t === tab ? '0 1px 3px color-mix(in oklch, var(--primary) 12%, transparent)' : 'none',
                }}>{t}</button>
            ))}
          </div>
        </div>

        {/* ============ OVERVIEW (2b) ============ */}
        {tab === 'Overview' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border p-5 grid gap-4 items-center" style={{ gridTemplateColumns: '1fr auto', borderColor: 'color-mix(in oklch, var(--primary) 30%, var(--border))', background: 'radial-gradient(90% 140% at 92% -20%, color-mix(in oklch, var(--primary) 12%, transparent), transparent 55%), var(--card)' }}>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
                  Today{me?.unitName ? ` · ${me.unitName}` : ''}{me?.dayN && me?.dayM ? ` · Day ${Math.min(me.dayN, me.dayM)} of ${me.dayM}` : ''}{me?.onPace ? ' · on pace' : ''}
                </div>
                <div className="text-lg font-bold mt-1">Today&apos;s plan</div>
                <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Open the lesson plan for the day&apos;s do-now, mini-lecture, packet work and exit ticket.</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link href="/admin/teacher/plans" className="text-sm font-semibold rounded-xl px-4 py-2.5" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Present plan →</Link>
                <Link href={`/admin/control-room?class=${courseId}&label=${encodeURIComponent(me?.label ?? '')}`} className="text-sm font-semibold rounded-xl px-4 py-2.5" style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>Open Control Room</Link>
              </div>
            </div>

            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {/* needs attention */}
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Needs attention</span>
                  <button onClick={() => setTab('Roster & analytics')} className="text-xs font-semibold" style={{ color: 'var(--primary)', border: 'none', background: 'transparent', cursor: 'pointer' }}>Roster →</button>
                </div>
                {attention.length === 0 && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Everyone is steady.</p>}
                {attention.map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5 py-2" style={{ borderBottom: '1px solid color-mix(in oklch, var(--border) 50%, transparent)' }}>
                    <span className="grid place-items-center text-[10px] font-bold rounded-full shrink-0" style={{ width: 26, height: 26, background: (s.idleDays ?? 0) >= 3 ? 'color-mix(in oklch, var(--destructive) 12%, transparent)' : 'color-mix(in oklch, var(--reward) 20%, transparent)', color: (s.idleDays ?? 0) >= 3 ? 'var(--destructive)' : 'var(--reward-foreground)' }}>{initials(s.name)}</span>
                    <span className="flex-1 text-sm truncate">{s.name} <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>· {(s.idleDays ?? 0) >= 3 ? `no work in ${s.idleDays} days` : `avg ${s.unitAvg?.toFixed(1)}, low`}</span></span>
                  </div>
                ))}
                {roster && attention.length > 0 && (
                  <p className="text-xs mt-2 pt-2" style={{ color: 'var(--muted-foreground)', borderTop: '1px solid color-mix(in oklch, var(--border) 50%, transparent)' }}>
                    Everyone else is steady — {steady} of {roster.summary.total} on track.
                  </p>
                )}
              </div>
              {/* grading queue */}
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Grading queue</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>{me?.toRate ?? 0} waiting</span>
                </div>
                <p className="text-sm" style={{ lineHeight: 1.5 }}>
                  {me && me.toRate > 0
                    ? `Warm-ups waiting for review. Rating them updates the mastery grid and tomorrow's groups.`
                    : 'Nothing waiting — the queue is clear.'}
                </p>
                {me && me.toRate > 0 && (
                  <Link href={`/admin/control-room?class=${courseId}&label=${encodeURIComponent(me.label)}`} className="inline-flex mt-3 text-sm font-semibold rounded-lg px-3.5 py-2" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                    Rate {me.toRate} in Control Room
                  </Link>
                )}
              </div>
              {/* engagement summary */}
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Engagement</span>
                  <button onClick={() => setTab('Engagement')} className="text-xs font-semibold" style={{ color: 'var(--primary)', border: 'none', background: 'transparent', cursor: 'pointer' }}>Tab →</button>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between"><span>Store redemptions</span><b style={{ color: redemptions.length ? 'var(--reward-foreground)' : 'var(--muted-foreground)' }}>{redemptions.length} pending</b></div>
                  <div className="flex justify-between"><span>Live challenges</span><b style={{ color: classChallenges.length ? 'var(--reward-foreground)' : 'var(--muted-foreground)' }}>{classChallenges.filter((c) => c.active).length}</b></div>
                </div>
                <p className="text-xs mt-3 pt-2" style={{ color: 'var(--muted-foreground)', borderTop: '1px solid color-mix(in oklch, var(--border) 50%, transparent)' }}>Gold marks real reward only — nothing here pulses.</p>
              </div>
            </div>
          </div>
        )}

        {/* ============ ROSTER & ANALYTICS (2c) ============ */}
        {tab === 'Roster & analytics' && (
          <div className="flex flex-col gap-3.5">
            {!roster && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading the table…</p>}
            {roster && (
              <>
                <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
                  <div className="rounded-xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                    <div className="text-xl font-bold" style={{ color: band(roster.summary.classAvg).color }}>{roster.summary.classAvg ?? '—'}</div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>class avg</div>
                  </div>
                  <div className="rounded-xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                    <div className="text-xl font-bold">{roster.summary.fluent} <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>of {roster.summary.total}</span></div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>fluent on current targets</div>
                  </div>
                  <div className="rounded-xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                    <div className="text-xl font-bold">{roster.summary.activeThisWeek} <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>of {roster.summary.total}</span></div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>active this week</div>
                  </div>
                  {roster.summary.weakestTarget && (
                    <div className="rounded-xl border px-4 py-3" style={{ borderColor: 'color-mix(in oklch, var(--reward) 42%, var(--border))', background: 'color-mix(in oklch, var(--reward) 6%, var(--card))' }}>
                      <div className="text-xl font-bold" style={{ color: 'var(--reward-foreground)' }}>{roster.summary.weakestTarget.slug}</div>
                      <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>weakest target · {roster.summary.weakestTarget.almost} at &quot;almost&quot;</div>
                    </div>
                  )}
                </div>
                <div className="rounded-xl border overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                    <thead>
                      <tr style={{ background: 'var(--secondary)' }}>
                        {['Student ↓ needs attention', 'Last active', 'Lessons', 'XP · wk', ...roster.targets.map((t) => t.slug.replace(/^u\d+\./, '').slice(0, 12)), 'Unit avg'].map((h, i) => (
                          <th key={i} className="text-left text-[10.5px] font-bold uppercase tracking-wide px-3 py-2.5 whitespace-nowrap" style={{ color: 'var(--muted-foreground)', textAlign: i >= 4 ? 'center' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shownRows.map((s) => (
                        <tr key={s.id} style={{ borderTop: '1px solid color-mix(in oklch, var(--border) 55%, transparent)', background: (s.idleDays ?? 0) >= 3 ? 'color-mix(in oklch, var(--destructive) 3%, transparent)' : undefined }}>
                          <td className="px-3 py-2.5 text-sm whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <span className="grid place-items-center text-[10px] font-bold rounded-full" style={{ width: 24, height: 24, background: band(s.unitAvg).bg, color: band(s.unitAvg).color }}>{initials(s.name)}</span>
                              {s.name}
                              {(s.idleDays ?? 0) >= 3 && <span className="text-[10.5px] font-bold rounded-full px-2 py-0.5" style={{ color: 'var(--destructive)', background: 'color-mix(in oklch, var(--destructive) 10%, transparent)' }}>{s.idleDays}d idle</span>}
                              {s.pending > 0 && <span className="text-[10.5px] font-bold rounded-full px-2 py-0.5" style={{ color: 'var(--primary)', background: 'color-mix(in oklch, var(--primary) 10%, transparent)' }}>{s.pending} to rate</span>}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs" style={{ color: (s.idleDays ?? 0) >= 3 ? 'var(--destructive)' : 'var(--muted-foreground)', fontWeight: (s.idleDays ?? 0) >= 3 ? 600 : 400 }}>{ago(s.lastActive)}</td>
                          <td className="px-3 py-2.5 text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>{s.lessonsDone}</td>
                          <td className="px-3 py-2.5 text-xs tabular-nums" style={{ color: s.xpWeek >= 100 ? 'var(--reward-foreground)' : 'var(--muted-foreground)', fontWeight: s.xpWeek >= 100 ? 600 : 400 }}>{s.xpWeek >= 100 ? `★ ${s.xpWeek}` : s.xpWeek}</td>
                          {roster.targets.map((t) => {
                            const v = s.cells[t.id]
                            const b = band(v)
                            return <td key={t.id} className="px-2 py-2.5 text-center"><span className="inline-block text-[11.5px] font-bold rounded-md px-1.5 py-0.5 tabular-nums" style={{ minWidth: 30, color: b.color, background: b.bg }}>{v === null ? '—' : v.toFixed(1)}</span></td>
                          })}
                          <td className="px-3 py-2.5 text-right text-sm font-bold tabular-nums" style={{ color: band(s.unitAvg).color }}>{s.unitAvg?.toFixed(1) ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {roster.students.length > 8 && (
                    <div className="flex justify-between items-center px-4 py-2.5" style={{ background: 'var(--secondary)' }}>
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{showAll ? 'Showing everyone' : `${roster.students.length - 8} more students · sorted by who needs you first`}</span>
                      <button onClick={() => setShowAll((v) => !v)} className="text-xs font-semibold" style={{ color: 'var(--primary)', border: 'none', background: 'transparent', cursor: 'pointer' }}>{showAll ? 'Show fewer ↑' : `Show all ${roster.students.length} ↓`}</button>
                    </div>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Bands match the Control Room: <b style={{ color: 'var(--success)' }}>≥2.45 got it</b> · <b style={{ color: 'var(--reward-foreground)' }}>1.7–2.4 almost</b> · <b style={{ color: 'var(--destructive)' }}>&lt;1.7 not yet</b>. The app records mastery evidence — term grades stay your judgment.
                </p>
              </>
            )}
          </div>
        )}

        {/* ============ ENGAGEMENT (2d) ============ */}
        {tab === 'Engagement' && (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {/* store */}
            <div className="rounded-xl border p-4 flex flex-col gap-2.5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <div className="flex justify-between items-baseline"><span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Store</span><span className="text-xs font-bold" style={{ color: redemptions.length ? 'var(--reward-foreground)' : 'var(--muted-foreground)' }}>{redemptions.length} to fulfil</span></div>
              {redemptions.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'color-mix(in oklch, var(--reward) 7%, transparent)', border: '1px solid color-mix(in oklch, var(--reward) 40%, var(--border))' }}>
                  <span className="flex-1 text-sm min-w-0 truncate"><b>{(r.user_email ?? '').split('@')[0]}</b> · {r.reward_name} · <span style={{ color: 'var(--reward-foreground)', fontWeight: 600 }}>{r.cost_points} pts</span></span>
                  <button onClick={() => setRedemption(r.id, 'fulfilled')} className="text-[11px] font-bold rounded-md px-2.5 py-1" style={{ background: 'var(--success)', color: '#fff', border: 'none', cursor: 'pointer' }}>Fulfil</button>
                  <button onClick={() => setRedemption(r.id, 'denied')} className="text-[11px] font-semibold rounded-md px-2 py-1" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted-foreground)', cursor: 'pointer' }}>Deny</button>
                </div>
              ))}
              {redemptions.length === 0 && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Nothing to fulfil.</p>}
              <Link href="/admin/store" className="text-sm font-semibold mt-1" style={{ color: 'var(--primary)' }}>+ Add a reward · edit shelf →</Link>
            </div>
            {/* challenges */}
            <div className="rounded-xl border p-4 flex flex-col gap-2.5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <div className="flex justify-between items-baseline"><span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>XP challenges</span><span className="text-xs font-bold" style={{ color: classChallenges.some((c) => c.active) ? 'var(--reward-foreground)' : 'var(--muted-foreground)' }}>{classChallenges.filter((c) => c.active).length} live</span></div>
              {classChallenges.filter((c) => c.active).slice(0, 3).map((c) => (
                <div key={c.id} className="rounded-lg px-3 py-2.5" style={{ background: 'color-mix(in oklch, var(--reward) 7%, transparent)', border: '1px solid color-mix(in oklch, var(--reward) 40%, var(--border))' }}>
                  <div className="flex justify-between text-sm"><span className="font-semibold">{c.title}</span><span className="font-bold" style={{ color: 'var(--reward-foreground)' }}>+{c.bonus_xp}</span></div>
                  <div className="rounded-full overflow-hidden mt-2" style={{ height: 7, background: 'var(--secondary)' }}>
                    <span style={{ display: 'block', height: '100%', width: `${Math.min(100, (c.completedToday / Math.max(1, me?.students ?? 1)) * 100)}%`, background: 'var(--reward)', borderRadius: 9999 }} />
                  </div>
                  <div className="flex justify-between text-[11.5px] mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                    <span>{c.completedToday} hit today&apos;s target</span><span>ends {c.ends_on}{c.is_global ? ' · 🌐 global' : ''}</span>
                  </div>
                </div>
              ))}
              {classChallenges.filter((c) => c.active).length === 0 && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No live challenge for this class.</p>}
              <Link href="/admin/challenges" className="text-sm font-semibold mt-1" style={{ color: 'var(--primary)' }}>New challenge · manage →</Link>
            </div>
            {/* arcade */}
            <div className="rounded-xl border p-4 flex flex-col gap-2.5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <div className="flex justify-between items-baseline"><span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Arcade</span></div>
              <p className="text-sm" style={{ lineHeight: 1.5 }}>Cabinets, payouts, and the coin economy are app-wide. Cabinet changes are live for students immediately.</p>
              <Link href="/admin/arcade" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>Manage cabinets →</Link>
              <Link href="/leaderboard" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>Leaderboard →</Link>
            </div>
          </div>
        )}

        {/* ============ PACING / PLANS ============ */}
        {tab === 'Pacing' && (
          <div className="rounded-xl border p-6 text-center" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>Pacing lives on the full pacing board — rotation calendar, unit windows, and this class&apos;s meeting pattern.</p>
            <Link href="/admin/pacing" className="inline-flex text-sm font-semibold rounded-lg px-4 py-2.5" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Open pacing board →</Link>
          </div>
        )}
        {tab === 'Plans' && (
          <div className="rounded-xl border p-6 text-center" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>Day-by-day lesson plans with coded targets, per class type.</p>
            <Link href="/admin/teacher/plans" className="inline-flex text-sm font-semibold rounded-lg px-4 py-2.5" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Open lesson plans →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
