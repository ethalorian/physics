"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useViewAs } from '@/lib/use-view-as'
import { ArrowLeft, UserX, Mail, Clock, Plus, Check } from 'lucide-react'
import type { OrphanRow, CourseChoice } from '@/app/api/admin/orphans/route'

// Admin-only page. Lists students who have signed in but aren't in any
// class — so an admin can find them and tell the right teacher to roster
// them, or eventually trigger a manual add.

export default function OrphansPage() {
  const { role } = useViewAs()
  const router = useRouter()
  const [orphans, setOrphans] = useState<OrphanRow[] | null>(null)
  const [courses, setCourses] = useState<CourseChoice[]>([])
  const [totalStudents, setTotalStudents] = useState<number>(0)
  // Per-row pickers + busy state.
  const [pick, setPick] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (role && role !== 'admin') router.replace('/admin/home')
  }, [role, router])

  useEffect(() => {
    if (role !== 'admin') return
    fetch('/api/admin/orphans')
      .then((r) => r.json())
      .then((d: { orphans?: OrphanRow[]; courses?: CourseChoice[]; totalStudents?: number }) => {
        setOrphans(d.orphans ?? [])
        setCourses(d.courses ?? [])
        setTotalStudents(d.totalStudents ?? 0)
      })
      .catch(() => setOrphans([]))
  }, [role])

  const enroll = async (studentId: string, studentLabel: string) => {
    const courseId = pick[studentId]
    if (!courseId) { setErr('Pick a class first'); return }
    setBusy(studentId); setErr(null)
    const res = await fetch('/api/admin/orphans/enroll', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, course_id: courseId }),
    }).catch(() => null)
    setBusy(null)
    if (!res?.ok) {
      const body = await res?.json().catch(() => null) as { error?: string } | null
      setErr(body?.error ?? 'Could not add the student')
      return
    }
    // Remove the just-enrolled student from the local list so the table
    // reflects the new state without a full refetch.
    setOrphans((cur) => (cur ?? []).filter((s) => s.id !== studentId))
    setFlash(`${studentLabel} added to ${courses.find((c) => c.id === courseId)?.name ?? 'the class'}.`)
    setTimeout(() => setFlash(null), 2500)
  }

  if (role && role !== 'admin') {
    return <div className="max-w-3xl mx-auto p-5 text-sm" style={{ color: 'var(--muted-foreground)' }}>Redirecting…</div>
  }

  return (
    <div className="max-w-5xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <Link href="/admin/home" className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> Command center
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <UserX size={16} style={{ color: 'var(--reward-foreground)' }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--reward-foreground)' }}>App oversight</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Students without a class</h1>
      <p className="text-sm mt-1 mb-6" style={{ color: 'var(--muted-foreground)' }}>
        These students have signed into the app but aren&rsquo;t in any teacher&rsquo;s roster yet. They see the &ldquo;ask your teacher&rdquo; gate on every content page until someone adds them to a Google Classroom or to the class roster in this app.
      </p>

      {flash && (
        <div className="rounded-xl mb-4 px-4 py-2.5 text-sm" style={{ background: 'color-mix(in oklch, var(--success) 18%, transparent)', color: 'var(--success)' }}>
          <Check size={14} className="inline mr-1.5" /> {flash}
        </div>
      )}
      {err && (
        <div className="rounded-xl mb-4 px-4 py-2.5 text-sm" style={{ background: 'color-mix(in oklch, var(--destructive) 14%, transparent)', color: 'var(--destructive)' }}>
          {err}
        </div>
      )}

      {orphans === null && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>}

      {orphans && orphans.length === 0 && (
        <div className="rounded-2xl border p-6 text-center" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="text-lg font-semibold">Nobody is orphaned. </div>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            All {totalStudents} signed-in students are in at least one class.
          </p>
        </div>
      )}

      {orphans && orphans.length > 0 && (
        <>
          <div className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
            {orphans.length} of {totalStudents} signed-in students
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'color-mix(in oklch, var(--secondary) 60%, transparent)' }}>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Student</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Email</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>First signed in</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Last sync</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Move into a class</th>
                </tr>
              </thead>
              <tbody>
                {orphans.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid color-mix(in oklch, var(--border) 50%, transparent)' }}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.name || `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || '—'}</div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted-foreground)' }}>
                      {s.email ? (
                        <a href={`mailto:${s.email}`} className="inline-flex items-center gap-1.5 hover:underline" style={{ color: 'var(--primary)' }}>
                          <Mail size={13} /> {s.email}
                        </a>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted-foreground)' }}>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} /> {fmtDate(s.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted-foreground)' }}>
                      {s.last_synced_at ? fmtDate(s.last_synced_at) : <span style={{ fontStyle: 'italic' }}>never synced</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={pick[s.id] ?? ''}
                          onChange={(e) => setPick((p) => ({ ...p, [s.id]: e.target.value }))}
                          className="text-xs rounded-md px-2 py-1.5"
                          style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', maxWidth: 200 }}
                        >
                          <option value="">Pick a class…</option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}{c.section ? ` · ${c.section}` : ''}{c.teacher_email ? ` (${c.teacher_email})` : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => enroll(s.id, s.name || s.email || 'Student')}
                          disabled={busy === s.id || !pick[s.id]}
                          className="inline-flex items-center gap-1 text-xs font-semibold rounded-md px-2.5 py-1.5 disabled:opacity-40"
                          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: pick[s.id] && busy !== s.id ? 'pointer' : 'not-allowed' }}
                        >
                          <Plus size={12} />
                          {busy === s.id ? 'Adding…' : 'Add'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs mt-4" style={{ color: 'var(--muted-foreground)' }}>
            <strong>How to fix:</strong> pick a class from the dropdown and click Add, or ask the teacher to re-import their Google Classroom roster. The gate lifts automatically the next time the student loads the app.
          </p>
        </>
      )}
    </div>
  )
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '—' }
}
