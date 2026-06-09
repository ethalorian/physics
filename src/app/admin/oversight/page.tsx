"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ClassRow { id: string; name: string; section: string | null; teacher_email: string | null; student_count: number }
interface Pulse { students: number; colleagues: number; activeStudents7d: number; masteryRatings: number; publishedLessons: number; pendingRewards: number; loginsTrend: number[] }
interface TeacherEng { email: string; role: string; classes: number; students: number; lessonsGraded: number; masteryRatings: number; rewardsFulfilled: number; assignments: number; mathReviews: number; storeItems: number; actions: number; lastActiveAt: string | null; lastLoginAt: string | null; activeNow: boolean; status: 'active' | 'ramping' | 'dormant' }
interface Engagement { active7d: number; idle: number; atRisk: number; total: number }
interface Feature { key: string; label: string; count: number }
interface Oversight { pulse: Pulse; teacherEngagement: TeacherEng[]; teacherTools: Feature[]; engagement: Engagement; features: Feature[]; you: string }
interface AccessReq { email: string; name: string | null; note: string | null; status: string; created_at: string }
interface Grant { email: string; role: string; source: string | null; granted_by: string | null; granted_at: string | null }

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—')
const fmtDateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never')
const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'var(--success)', bg: 'color-mix(in oklch, var(--success) 18%, transparent)' },
  ramping: { label: 'Ramping up', color: 'var(--reward-foreground)', bg: 'color-mix(in oklch, var(--reward) 28%, transparent)' },
  dormant: { label: 'Not started', color: 'var(--destructive)', bg: 'color-mix(in oklch, var(--destructive) 16%, transparent)' },
}

function Tile({ value, label, accent }: { value: number | string; label: string; accent: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="text-2xl font-bold tracking-tight" style={{ color: accent }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
    </div>
  )
}

function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length === 0) return null
  const max = Math.max(1, ...data)
  const W = 150, H = 38
  const pts = data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * W},${H - (v / max) * (H - 6) - 3}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 38 }}>
      <polyline points={pts} fill="none" style={{ stroke: 'var(--success)' }} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function OversightPage() {
  const [d, setD] = useState<Oversight | null>(null)
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [requests, setRequests] = useState<AccessReq[]>([])
  const [grants, setGrants] = useState<Grant[]>([])
  const [builtinAdmins, setBuiltinAdmins] = useState<string[]>([])

  const loadRequests = () => fetch('/api/admin/teacher-requests')
    .then((r) => r.json()).then((data: { pending?: AccessReq[] }) => setRequests(data.pending ?? [])).catch(() => {})
  const loadGrants = () => fetch('/api/admin/teacher-access')
    .then((r) => r.json()).then((data: { grants?: Grant[]; builtinAdmins?: string[] }) => { setGrants(data.grants ?? []); setBuiltinAdmins(data.builtinAdmins ?? []) }).catch(() => {})

  const loadOversight = () => fetch('/api/admin/oversight')
    .then((r) => r.json())
    .then((data: Oversight) => { setD(data); setLoading(false) })
    .catch(() => setLoading(false))

  useEffect(() => {
    loadOversight()
    fetch('/api/courses')
      .then((r) => r.json())
      .then((data: { courses?: ClassRow[] }) => setClasses(data.courses ?? []))
      .catch(() => {})
    loadRequests()
    loadGrants()
    // Refresh so the live "active now" dots stay current while you watch.
    const t = setInterval(loadOversight, 30000)
    return () => clearInterval(t)
  }, [])

  const decide = async (email: string, decision: 'approve' | 'deny') => {
    await fetch('/api/admin/teacher-requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, decision }),
    }).catch(() => {})
    loadRequests()
    loadGrants()
  }

  const revoke = async (email: string) => {
    if (!confirm(`Remove teacher access for ${email}?`)) return
    await fetch('/api/admin/teacher-access', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, action: 'revoke' }),
    }).catch(() => {})
    loadGrants()
  }

  // Group classes by the teacher who owns them, for the click-into-any-class directory.
  const classesByTeacher = classes.reduce<Record<string, ClassRow[]>>((acc, c) => {
    const key = c.teacher_email ?? 'Unassigned'
    ;(acc[key] ??= []).push(c)
    return acc
  }, {})

  const featMax = d ? Math.max(1, ...d.features.map((f) => f.count)) : 1
  const eng = d?.engagement
  const engTotal = eng ? Math.max(1, eng.total) : 1

  return (
    <div className="max-w-5xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <h1 className="text-2xl font-semibold tracking-tight">Application overview</h1>
      <p className="text-sm mt-1 mb-6" style={{ color: 'var(--muted-foreground)' }}>All teachers, all students — adoption taking hold.</p>

      {loading && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading the overview…</p>}

      {/* TEACHER ACCESS REQUESTS — colleagues waiting for you to approve sign-in */}
      {requests.length > 0 && (
        <div className="rounded-2xl border mb-6 p-4" style={{ borderColor: 'color-mix(in oklch, var(--primary) 38%, var(--border))', background: 'color-mix(in oklch, var(--primary) 8%, var(--card))' }}>
          <h2 className="text-sm font-bold mb-1">Teacher access requests · {requests.length}</h2>
          <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>Staff who tried to sign in and are waiting for approval. Approving gives them teacher access.</p>
          <div className="flex flex-col gap-2">
            {requests.map((r) => (
              <div key={r.email} className="flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                <span className="flex-1 min-w-[12rem] text-sm font-medium">
                  {r.name || r.email}{r.name && <span className="text-xs ml-2" style={{ color: 'var(--muted-foreground)' }}>{r.email}</span>}
                </span>
                <button onClick={() => decide(r.email, 'approve')} className="text-xs font-semibold rounded-md px-3 py-1.5" style={{ background: 'var(--success)', color: '#fff', border: 'none', cursor: 'pointer' }}>Approve</button>
                <button onClick={() => decide(r.email, 'deny')} className="text-xs rounded-md px-3 py-1.5 border" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--muted-foreground)', cursor: 'pointer' }}>Deny</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEACHERS & ACCESS — who currently has staff access, with revoke */}
      <div className="rounded-2xl border mb-6 p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="text-sm font-bold mb-1">Teachers &amp; access</h2>
        <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>Everyone who can sign in as staff. Revoking returns a teacher to student access.</p>
        {grants.length === 0 && builtinAdmins.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No granted teachers yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {builtinAdmins.map((email) => (
              <div key={email} className="flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
                <span className="flex-1 min-w-[12rem] text-sm font-medium">{email}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: 'var(--primary)', background: 'color-mix(in oklch, var(--primary) 14%, transparent)' }}>Admin · built-in</span>
              </div>
            ))}
            {grants.map((g) => (
              <div key={g.email} className="flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
                <span className="flex-1 min-w-[12rem] text-sm font-medium">
                  {g.email}
                  {(g.granted_at || g.granted_by) && (
                    <span className="text-xs ml-2" style={{ color: 'var(--muted-foreground)' }}>
                      onboarded{g.granted_at ? ` ${fmtDate(g.granted_at)}` : ''}{g.granted_by ? ` by ${g.granted_by}` : ''}
                    </span>
                  )}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: 'var(--success)', background: 'color-mix(in oklch, var(--success) 16%, transparent)' }}>{g.role === 'admin' ? 'Admin' : 'Teacher'}</span>
                <button onClick={() => revoke(g.email)} className="text-xs rounded-md px-3 py-1.5 border" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--destructive)', cursor: 'pointer' }}>Revoke</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && d && (
        <>
          {/* PULSE */}
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <Tile value={d.pulse.students} label="Enrolled students" accent="var(--primary)" />
            <Tile value={d.pulse.colleagues} label="Teachers onboarded" accent="var(--reward-foreground)" />
            <Tile value={d.pulse.activeStudents7d} label="Active this week" accent="var(--success)" />
            <Tile value={d.pulse.masteryRatings} label="Mastery ratings" accent="var(--primary)" />
            <Tile value={d.pulse.pendingRewards} label="Rewards to fulfil" accent="var(--reward-foreground)" />
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Daily active (10 days)</div>
              <Sparkline data={d.pulse.loginsTrend} />
            </div>
          </div>

          {/* TEACHER ENGAGEMENT — what each teacher is doing in the app */}
          <h2 className="text-xs font-bold uppercase tracking-widest mt-8 mb-3" style={{ color: 'var(--muted-foreground)' }}>Teacher engagement</h2>
          <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
              <thead>
                <tr style={{ background: 'color-mix(in oklch, var(--secondary) 50%, transparent)' }}>
                  {['Teacher', 'Classes', 'Students', 'Lessons graded', 'Mastery', 'Rewards filled', 'Assignments', 'Math', 'Store', 'Last login', 'Status'].map((h) => (
                    <th key={h} className="text-left text-xs font-bold uppercase tracking-wide px-3 py-2.5 whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.teacherEngagement.length === 0 && (
                  <tr><td colSpan={11} className="px-4 py-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>No teachers yet.</td></tr>
                )}
                {d.teacherEngagement.map((t) => {
                  const st = STATUS[t.status] ?? STATUS.dormant
                  const num = (n: number) => <td className="px-3 py-3 text-sm" style={{ color: n ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{n}</td>
                  return (
                    <tr key={t.email} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-3 py-3 text-sm font-medium whitespace-nowrap">
                        <span
                          title={t.activeNow ? 'Active now' : 'Offline'}
                          style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', marginRight: 8, verticalAlign: 'middle',
                            background: t.activeNow ? 'var(--success)' : 'var(--destructive)',
                            boxShadow: t.activeNow ? '0 0 0 3px color-mix(in oklch, var(--success) 22%, transparent)' : 'none' }}
                        />
                        {t.email}
                        {t.email === d.you && <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded" style={{ color: 'var(--primary)', border: '1px solid color-mix(in oklch, var(--primary) 50%, var(--border))' }}>YOU</span>}
                        {t.role === 'admin' && t.email !== d.you && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: 'var(--primary)' }}>ADMIN</span>}
                      </td>
                      {num(t.classes)}{num(t.students)}{num(t.lessonsGraded)}{num(t.masteryRatings)}{num(t.rewardsFulfilled)}{num(t.assignments)}{num(t.mathReviews)}{num(t.storeItems)}
                      <td className="px-3 py-3 text-sm whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{fmtDateTime(t.lastLoginAt)}</td>
                      <td className="px-3 py-3"><span className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ color: st.color, background: st.bg }}>{st.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* WHAT TEACHERS USE MOST — the aggregate that answers "what's valuable" */}
          {d.teacherTools.some((f) => f.count > 0) && (
            <div className="rounded-2xl border p-5 mt-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <h3 className="font-bold mb-1" style={{ fontSize: 15 }}>What teachers use most</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>Total teacher actions by tool — the longest bars are what your staff lean on</p>
              <div className="flex flex-col gap-3">
                {(() => { const max = Math.max(1, ...d.teacherTools.map((f) => f.count)); return d.teacherTools.map((f) => (
                  <div key={f.key}>
                    <div className="flex justify-between text-sm mb-1"><span>{f.label}</span><span style={{ color: 'var(--muted-foreground)', fontWeight: 700 }}>{f.count}</span></div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                      <span style={{ display: 'block', height: '100%', width: `${(f.count / max) * 100}%`, background: 'var(--reward)' }} />
                    </div>
                  </div>
                )) })()}
              </div>
            </div>
          )}

          {/* CLASS DIRECTORY — click into any class in the system */}
          <h2 className="text-xs font-bold uppercase tracking-widest mt-8 mb-3" style={{ color: 'var(--muted-foreground)' }}>Classes — open any one</h2>
          {classes.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No classes imported yet.</p>
          ) : (
            Object.entries(classesByTeacher).map(([teacher, list]) => (
              <div key={teacher} className="mb-4">
                <div className="text-sm font-semibold mb-2">{teacher}</div>
                <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {list.map((c) => (
                    <Link key={c.id} href={`/admin/classes/${encodeURIComponent(c.id)}`}>
                      <div className="rounded-xl border p-3 transition-transform"
                        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--primary)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                        <div className="font-medium truncate" style={{ fontSize: 14 }}>{c.name}</div>
                        <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>
                          {c.section ? `${c.section} · ` : ''}{c.student_count} student{c.student_count === 1 ? '' : 's'}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}

          <div className="grid gap-4 mt-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {/* ENGAGEMENT */}
            <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <h3 className="font-bold mb-1" style={{ fontSize: 15 }}>Student engagement</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>By last activity, across all classes</p>
              {eng && (
                <>
                  <div className="flex h-4 rounded-full overflow-hidden">
                    <span style={{ width: `${(eng.active7d / engTotal) * 100}%`, background: 'var(--success)' }} />
                    <span style={{ width: `${(eng.idle / engTotal) * 100}%`, background: 'var(--reward)' }} />
                    <span style={{ width: `${(eng.atRisk / engTotal) * 100}%`, background: 'var(--destructive)' }} />
                  </div>
                  <div className="flex gap-4 flex-wrap mt-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    <span className="inline-flex items-center gap-1.5"><span style={{ width: 11, height: 11, borderRadius: 3, background: 'var(--success)' }} /> Active <b style={{ color: 'var(--foreground)' }}>{eng.active7d}</b></span>
                    <span className="inline-flex items-center gap-1.5"><span style={{ width: 11, height: 11, borderRadius: 3, background: 'var(--reward)' }} /> Idle <b style={{ color: 'var(--foreground)' }}>{eng.idle}</b></span>
                    <span className="inline-flex items-center gap-1.5"><span style={{ width: 11, height: 11, borderRadius: 3, background: 'var(--destructive)' }} /> At risk <b style={{ color: 'var(--foreground)' }}>{eng.atRisk}</b></span>
                  </div>
                </>
              )}
            </div>

            {/* FEATURE ADOPTION */}
            <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <h3 className="font-bold mb-1" style={{ fontSize: 15 }}>Feature adoption</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>What&apos;s actually getting used</p>
              <div className="flex flex-col gap-3">
                {d.features.map((f) => (
                  <div key={f.key}>
                    <div className="flex justify-between text-sm mb-1"><span>{f.label}</span><span style={{ color: 'var(--muted-foreground)', fontWeight: 700 }}>{f.count}</span></div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                      <span style={{ display: 'block', height: '100%', width: `${(f.count / featMax) * 100}%`, background: 'var(--primary)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
