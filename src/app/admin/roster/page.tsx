"use client"

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
import { RefreshCw, Users, Link2, CheckCircle2, AlertCircle, ArrowLeft, GraduationCap } from 'lucide-react'
import { getInitialScopes, getClassroomScopes } from '@/lib/oauth-scopes'

// Rosters-only scopes: courses.readonly + rosters.readonly + profile.emails.
// Deliberately NOT requesting coursework/assignment scopes — connecting Google
// Classroom should sync rosters and nothing else.
const ROSTER_SCOPE = [...getInitialScopes(), ...getClassroomScopes()].join(' ')

interface GClassCourse {
  id: string
  name: string
  section?: string
  courseState?: string
}
interface ImportedCourse {
  id: string
  google_course_id: string | null
  name: string
  section: string | null
  student_count: number
}
interface GridStudent { id: string; name: string; email: string }
interface RosterStudent { id: string; name: string; first_name: string | null; last_name: string | null }
interface GridTarget { id: string; statement: string; domain: string }
interface Cell { value: number | null; count: number }
interface GridData {
  units: { id: string; name: string }[]
  targets: GridTarget[]
  students: GridStudent[]
  cells: Record<string, Record<string, Cell>>
}

function band(v: number | null): { label: string; color: string } {
  if (v == null) return { label: '—', color: 'var(--muted-foreground)' }
  if (v >= 2.45) return { label: v.toFixed(1), color: 'var(--success)' }
  if (v >= 1.7) return { label: v.toFixed(1), color: 'var(--reward)' }
  return { label: v.toFixed(1), color: 'var(--viz-down)' }
}

function avgOf(row: Record<string, Cell> | undefined): number | null {
  if (!row) return null
  const vals = Object.values(row).map((c) => c.value).filter((v): v is number => v != null)
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export default function RosterPage() {
  const { data: session } = useSession()
  const hasClassroom = Boolean(session?.accessToken)

  const [courses, setCourses] = useState<GClassCourse[] | null>(null)
  const [coursesError, setCoursesError] = useState<string | null>(null)
  const [imported, setImported] = useState<ImportedCourse[]>([])
  const [grid, setGrid] = useState<GridData | null>(null)
  const [unitId, setUnitId] = useState('unit-1')
  const [importing, setImporting] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  // Name editor (fixes how a student's name splits for the Aspen sort)
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [edits, setEdits] = useState<Record<string, { first: string; last: string }>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  const loadImported = useCallback(() => {
    fetch('/api/courses')
      .then((r) => r.json())
      .then((d: { courses?: ImportedCourse[] }) => setImported((d.courses ?? []).filter((c) => c.google_course_id)))
      .catch(() => {})
  }, [])

  const loadGrid = useCallback((uid: string) => {
    fetch(`/api/mastery/grid?unit_id=${uid}`)
      .then((r) => r.json())
      .then((d: GridData) => setGrid(d))
      .catch(() => {})
  }, [])

  const loadCourses = useCallback(() => {
    if (!session?.accessToken) return
    setCoursesError(null)
    fetch('/api/google-classroom?action=courses', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d?.error || 'Could not reach Google Classroom')
        return d as { courses?: GClassCourse[] }
      })
      .then((d) => setCourses(d.courses ?? []))
      .catch((e: Error) => setCoursesError(e.message))
  }, [session?.accessToken])

  const loadRoster = useCallback(() => {
    fetch('/api/roster/students')
      .then((r) => r.json())
      .then((d: { students?: RosterStudent[] }) => {
        const list = d.students ?? []
        setRoster(list)
        const seed: Record<string, { first: string; last: string }> = {}
        for (const s of list) seed[s.id] = { first: s.first_name ?? '', last: s.last_name ?? '' }
        setEdits(seed)
      })
      .catch(() => {})
  }, [])

  useEffect(() => { loadImported() }, [loadImported])
  useEffect(() => { loadGrid(unitId) }, [unitId, loadGrid])
  useEffect(() => { if (hasClassroom) loadCourses() }, [hasClassroom, loadCourses])
  useEffect(() => { loadRoster() }, [loadRoster])

  const saveName = async (id: string) => {
    const edit = edits[id]
    if (!edit) return
    setSavingId(id)
    setSavedId(null)
    try {
      const res = await fetch('/api/roster/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, first_name: edit.first, last_name: edit.last }),
      })
      if (res.ok) {
        setRoster((prev) => prev.map((s) => (s.id === id ? { ...s, first_name: edit.first, last_name: edit.last } : s)))
        setSavedId(id)
        setTimeout(() => setSavedId((cur) => (cur === id ? null : cur)), 1800)
      }
    } catch {
      /* leave the inputs as-is so the teacher can retry */
    } finally {
      setSavingId(null)
    }
  }

  const connect = () => {
    // Re-run the Google flow asking for rosters scopes on top of what's already
    // granted. Routes through the standard NextAuth callback, so the session
    // token picks up the broader scope. include_granted_scopes keeps the rest.
    signIn(
      'google',
      { callbackUrl: '/admin/roster' },
      { scope: ROSTER_SCOPE, include_granted_scopes: 'true', access_type: 'offline', prompt: 'consent' },
    )
  }

  const importCourse = async (course: GClassCourse) => {
    if (!session?.accessToken) return
    setImporting(course.id)
    setStatus(null)
    try {
      const res = await fetch('/api/roster/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, accessToken: session.accessToken }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.details || d?.error || 'Import failed')
      setStatus(`Imported ${d.studentsSynced ?? 0} of ${d.studentsTotal ?? 0} students from ${course.name}.`)
      loadImported()
      loadGrid(unitId)
    } catch (e) {
      setStatus(`Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setImporting(null)
    }
  }

  const targets = grid?.targets ?? []
  const students = grid?.students ?? []

  return (
    <div className="max-w-6xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <Link href="/admin/home" className="inline-flex items-center gap-1 text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> Command center
      </Link>

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
          <GraduationCap size={16} style={{ color: 'var(--primary)' }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Roster &amp; classes</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Your classes, in one place</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Sync rosters from Google Classroom, then see how every student is performing across the unit.
        </p>
      </div>

      {/* connect / sync */}
      <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 10, background: 'color-mix(in oklch, var(--primary) 16%, transparent)', color: 'var(--primary)' }}>
              <Link2 size={20} />
            </div>
            <div>
              <div className="font-bold" style={{ fontSize: 15 }}>Google Classroom</div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {hasClassroom
                  ? 'Connected. This only reads your course list and student rosters — no coursework or grades.'
                  : 'Connect to sync your class rosters. Rosters only — no coursework or grades are touched.'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasClassroom && (
              <button
                onClick={loadCourses}
                className="inline-flex items-center gap-1.5 text-sm rounded-lg border px-3 py-2"
                style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            )}
            <button
              onClick={connect}
              className="inline-flex items-center gap-1.5 text-sm rounded-lg px-3 py-2 font-medium"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground, white)' }}
            >
              <Link2 size={14} /> {hasClassroom ? 'Reconnect' : 'Connect Google Classroom'}
            </button>
          </div>
        </div>

        {coursesError && (
          <div className="mt-4 flex items-start gap-2 text-sm rounded-lg p-3" style={{ background: 'color-mix(in oklch, var(--viz-down) 14%, transparent)', color: 'var(--foreground)' }}>
            <AlertCircle size={16} style={{ color: 'var(--viz-down)', marginTop: 1 }} />
            <span>{coursesError} If you just connected, try Refresh. If it persists, the Classroom scopes may not be enabled on the Google sign-in screen.</span>
          </div>
        )}

        {/* Google Classroom courses available to import */}
        {hasClassroom && courses && courses.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>From Google Classroom</div>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {courses.map((c) => {
                const already = imported.some((i) => i.google_course_id === c.id)
                return (
                  <div key={c.id} className="rounded-xl border p-3 flex items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
                    <div className="min-w-0">
                      <div className="font-medium truncate" style={{ fontSize: 14 }}>{c.name}</div>
                      {c.section && <div className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{c.section}</div>}
                    </div>
                    <button
                      onClick={() => importCourse(c)}
                      disabled={importing === c.id}
                      className="text-xs rounded-md border px-2.5 py-1.5 whitespace-nowrap"
                      style={{ borderColor: 'var(--border)', background: already ? 'var(--card)' : 'color-mix(in oklch, var(--success) 14%, transparent)', color: already ? 'var(--muted-foreground)' : 'var(--foreground)' }}
                    >
                      {importing === c.id ? 'Importing…' : already ? 'Re-sync' : 'Import roster'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {hasClassroom && courses && courses.length === 0 && !coursesError && (
          <div className="mt-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>No active courses found in your Google Classroom.</div>
        )}

        {status && (
          <div className="mt-4 flex items-center gap-2 text-sm rounded-lg p-3" style={{ background: 'color-mix(in oklch, var(--success) 14%, transparent)' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
            <span>{status}</span>
          </div>
        )}
      </div>

      {/* imported classes */}
      {imported.length > 0 && (
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>Synced classes</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {imported.map((c) => (
              <Link key={c.id} href={`/admin/classes/${encodeURIComponent(c.id)}`}>
                <div className="rounded-2xl border p-4 h-full transition-transform"
                  style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--primary)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                  <div className="font-bold" style={{ fontSize: 15 }}>{c.name}</div>
                  {c.section && <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{c.section}</div>}
                  <div className="flex items-center gap-1.5 mt-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    <Users size={15} /> {c.student_count} student{c.student_count === 1 ? '' : 's'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* performance */}
      <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div>
            <div className="font-bold" style={{ fontSize: 15 }}>How they&apos;re performing</div>
            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Rolled-up mastery per learning target. Tap a row to grade in the Control Room.</div>
          </div>
          <div className="flex items-center gap-2">
            {grid?.units && grid.units.length > 0 && (
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="text-sm rounded-lg border px-2.5 py-1.5"
                style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
              >
                {grid.units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {students.length === 0 ? (
          <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            No rostered students yet. Connect Google Classroom above and import a course, or have students join with a class code.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left font-medium py-2 pr-3 sticky left-0" style={{ color: 'var(--muted-foreground)', background: 'var(--card)' }}>Student</th>
                  {targets.map((t) => (
                    <th key={t.id} className="font-medium px-2 py-2 text-center" style={{ color: 'var(--muted-foreground)', minWidth: 56 }} title={t.statement}>
                      {t.domain}
                    </th>
                  ))}
                  <th className="font-medium px-2 py-2 text-center" style={{ color: 'var(--muted-foreground)' }}>Overall</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const row = grid?.cells[s.id]
                  const overall = band(avgOf(row))
                  return (
                    <tr key={s.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-2 pr-3 sticky left-0" style={{ background: 'var(--card)' }}>
                        <Link href={`/admin/control-room?student=${encodeURIComponent(s.id)}`} className="font-medium hover:underline">{s.name}</Link>
                      </td>
                      {targets.map((t) => {
                        const cell = row?.[t.id]
                        const b = band(cell?.value ?? null)
                        return (
                          <td key={t.id} className="px-2 py-2 text-center">
                            <span
                              className="inline-grid place-items-center rounded-md font-medium"
                              style={{ minWidth: 34, height: 26, padding: '0 6px', color: b.color, background: cell?.value != null ? `color-mix(in oklch, ${b.color} 16%, transparent)` : 'transparent' }}
                            >
                              {b.label}
                            </span>
                          </td>
                        )
                      })}
                      <td className="px-2 py-2 text-center">
                        <span className="font-bold" style={{ color: overall.color }}>{overall.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* name editor — fix how a name splits so the Aspen grade-copy sorts it right */}
      {roster.length > 0 && (
        <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="mb-1 font-bold" style={{ fontSize: 15 }}>Student names — Aspen sort order</div>
          <div className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Rows are ordered by last name, the way Aspen X2 lists them — so the Control Room&apos;s grade-copy lines up. If a name split the wrong way, fix the first/last split here. (This doesn&apos;t change the student&apos;s Google name.)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left font-medium py-2 pr-3" style={{ color: 'var(--muted-foreground)' }}>Classroom name</th>
                  <th className="text-left font-medium py-2 px-2" style={{ color: 'var(--muted-foreground)' }}>First name</th>
                  <th className="text-left font-medium py-2 px-2" style={{ color: 'var(--muted-foreground)' }}>Last name (sorts on this)</th>
                  <th className="font-medium py-2 px-2" />
                </tr>
              </thead>
              <tbody>
                {[...roster]
                  .sort((a, b) => {
                    // Order by the SAVED last name (updated on save), so a row
                    // only jumps to its new spot once you save — not while typing.
                    const la = (a.last_name || a.name).toLowerCase()
                    const lb = (b.last_name || b.name).toLowerCase()
                    return la.localeCompare(lb)
                  })
                  .map((s) => {
                    const e = edits[s.id] ?? { first: s.first_name ?? '', last: s.last_name ?? '' }
                    const changed = e.first !== (s.first_name ?? '') || e.last !== (s.last_name ?? '')
                    return (
                      <tr key={s.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                        <td className="py-2 pr-3" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{s.name}</td>
                        <td className="py-2 px-2">
                          <input
                            value={e.first}
                            onChange={(ev) => setEdits((p) => ({ ...p, [s.id]: { first: ev.target.value, last: e.last } }))}
                            className="rounded-md border px-2 py-1 w-full"
                            style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)', minWidth: 120 }}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            value={e.last}
                            onChange={(ev) => setEdits((p) => ({ ...p, [s.id]: { first: e.first, last: ev.target.value } }))}
                            className="rounded-md border px-2 py-1 w-full"
                            style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)', minWidth: 140 }}
                          />
                        </td>
                        <td className="py-2 px-2 text-right" style={{ whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => saveName(s.id)}
                            disabled={!changed || savingId === s.id}
                            className="text-sm font-medium px-3 py-1.5 rounded-lg"
                            style={{
                              background: savedId === s.id ? 'var(--success)' : changed ? 'var(--primary)' : 'var(--secondary)',
                              color: savedId === s.id ? 'var(--background)' : changed ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                              border: 'none', cursor: changed && savingId !== s.id ? 'pointer' : 'default',
                            }}
                          >
                            {savedId === s.id ? 'Saved ✓' : savingId === s.id ? 'Saving…' : 'Save'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
