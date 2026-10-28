"use client"

import { useCallback, useEffect, useState } from 'react'
import LanguageProfileCell from '@/components/admin/LanguageProfileCell'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
import { RefreshCw, Users, Link2, CheckCircle2, AlertCircle } from 'lucide-react'
import { getInitialScopes, getClassroomScopes } from '@/lib/oauth-scopes'
import { studentsHref, teachingHref } from '@/lib/teaching-navigation'

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
  track: string | null
  program?: string | null
}
// Class type as the teacher sees it: one choice that sets BOTH the curriculum
// track (level) and the program (which curriculum). Trades is a curriculum, not
// a level — there is no honors trades — so it maps to program='trades'.
type ClassType = 'cpa' | 'honors' | 'trades' | 'projects'
const CLASS_TYPES: { id: ClassType; label: string; track: 'cpa' | 'honors'; program: 'physics' | 'trades' | 'projects'; hint: string }[] = [
  { id: 'cpa', label: 'CPA', track: 'cpa', program: 'physics', hint: 'CPA Physics — shared video lessons and mastery targets' },
  { id: 'honors', label: 'Honors', track: 'honors', program: 'physics', hint: 'Honors Physics — unlocks the honors thread' },
  { id: 'trades', label: 'Trades', track: 'cpa', program: 'trades', hint: 'Trades Physics — the fieldhouse curriculum (units, targets, mastery tasks)' },
]
const classTypeOf = (track: string | null | undefined, program: string | null | undefined): ClassType =>
  program === 'trades' ? 'trades' : program === 'projects' ? 'projects' : track === 'honors' ? 'honors' : 'cpa'
interface RosterStudent { id: string; name: string; first_name: string | null; last_name: string | null }
export default function RosterManager({ classId, mode }: { classId: string; mode: 'roster' | 'settings' }) {
  const { data: session } = useSession()
  const hasClassroom = Boolean(session?.accessToken)

  const [courses, setCourses] = useState<GClassCourse[] | null>(null)
  const [coursesError, setCoursesError] = useState<string | null>(null)
  const [imported, setImported] = useState<ImportedCourse[]>([])
  const [importing, setImporting] = useState<string | null>(null)
  // Class type chosen at import, per Google Classroom course (defaults to CPA).
  const [typeFor, setTypeFor] = useState<Record<string, ClassType>>({})
  const [status, setStatus] = useState<{ message: string; error: boolean } | null>(null)
  // Name editor (fixes how a student's name splits for the Aspen sort)
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [edits, setEdits] = useState<Record<string, { first: string; last: string }>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [rosterLoading, setRosterLoading] = useState(true)
  const [rosterError, setRosterError] = useState('')
  const [search, setSearch] = useState('')

  const loadImported = useCallback(() => {
    fetch('/api/courses')
      .then((r) => r.json())
      .then((d: { courses?: ImportedCourse[] }) => setImported((d.courses ?? []).filter((c) => c.google_course_id)))
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
    setRosterLoading(true); setRosterError('')
    fetch('/api/roster/students?course_id=' + encodeURIComponent(classId))
      .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error || 'The roster could not load.'); return data })
      .then((d: { students?: RosterStudent[] }) => {
        const list = d.students ?? []
        setRoster(list)
        const seed: Record<string, { first: string; last: string }> = {}
        for (const s of list) seed[s.id] = { first: s.first_name ?? '', last: s.last_name ?? '' }
        setEdits(seed)
      })
      .catch((e: Error) => setRosterError(e.message))
      .finally(() => setRosterLoading(false))
  }, [classId])

  useEffect(() => { if (mode === 'settings') loadImported() }, [loadImported, mode])
  useEffect(() => { if (mode === 'settings' && hasClassroom) loadCourses() }, [hasClassroom, loadCourses, mode])
  useEffect(() => { if (mode === 'roster') loadRoster() }, [loadRoster, mode])

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
      if (!res.ok) throw new Error('The name could not be saved. Please try again.')
      if (res.ok) {
        setRoster((prev) => prev.map((s) => (s.id === id ? { ...s, first_name: edit.first, last_name: edit.last } : s)))
        setSavedId(id)
        setTimeout(() => setSavedId((cur) => (cur === id ? null : cur)), 1800)
      }
    } catch (e) {
      setRosterError(e instanceof Error ? e.message : 'The name could not be saved.')
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
      { callbackUrl: studentsHref('settings', classId) },
      { scope: ROSTER_SCOPE, include_granted_scopes: 'true', access_type: 'offline', prompt: 'consent' },
    )
  }

  // The class type shown/used for a course: a fresh local choice wins, else
  // what's saved on the imported course, else CPA.
  const typeOf = (gid: string): ClassType => {
    if (typeFor[gid]) return typeFor[gid]
    const imp = imported.find((i) => i.google_course_id === gid)
    return classTypeOf(imp?.track, imp?.program)
  }

  // Change a course's class type. For an already-imported course, persist it
  // immediately (so it survives a reload); otherwise hold it for import time.
  const setCourseType = async (gid: string, t: ClassType) => {
    setTypeFor((m) => ({ ...m, [gid]: t }))
    const def = CLASS_TYPES.find((x) => x.id === t)!
    const imp = imported.find((i) => i.google_course_id === gid)
    if (!imp) return
    setImported((list) => list.map((i) => (i.id === imp.id ? { ...i, track: def.track, program: def.program } : i)))
    try {
      await fetch('/api/teacher/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: imp.id, track: def.track, program: def.program }),
      })
    } catch { /* UI already updated; will reconcile on next load */ }
  }

  const importCourse = async (course: GClassCourse) => {
    if (!session?.accessToken) return
    setImporting(course.id)
    setStatus(null)
    try {
      const def = CLASS_TYPES.find((x) => x.id === typeOf(course.id))!
      const res = await fetch('/api/roster/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, accessToken: session.accessToken, track: def.track, program: def.program }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.details || d?.error || 'Import failed')
      setStatus({ message: `Roster synced for ${course.name}: ${d.studentsAdded ?? 0} added, ${d.studentsRemoved ?? 0} removed. ${d.studentsTotal ?? 0} students now in this class.`, error: false })
      loadImported()
      loadRoster()
    } catch (e) {
      setStatus({ message: `Sync failed: ${e instanceof Error ? e.message : 'Unknown error'}`, error: true })
    } finally {
      setImporting(null)
    }
  }

  return (
    <div className="space-y-5" style={{ color: 'var(--foreground)' }}>
      {mode === 'settings' && <>
      {/* connect / sync */}
      <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'color-mix(in oklch, var(--primary) 16%, transparent)', color: 'var(--primary)' }}>
              <Link2 size={20} />
            </div>
            <div>
              <div className="text-title-3" >Google Classroom</div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {hasClassroom
                  ? 'Refresh adds new students and removes students no longer in Google Classroom. Saved work and grades are kept.'
                  : 'Connect to sync your class rosters. Refresh adds new students and removes students no longer in Google Classroom. Saved work and grades are kept.'}
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
                <RefreshCw size={14} /> Refresh classes
              </button>
            )}
            <button
              onClick={connect}
              className="inline-flex items-center gap-1.5 text-sm rounded-lg px-3 py-2 font-medium"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
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
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {courses.map((c) => {
                const already = imported.some((i) => i.google_course_id === c.id)
                // Name on its own row; the type picker + action share the row
                // below and wrap if the card gets narrow. Keeping both on one
                // row crushed the name to zero width and spilled the button.
                return (
                  <div key={c.id} className="rounded-xl border p-3 flex flex-col gap-2.5 min-w-0" style={{ borderColor: 'var(--border)' }}>
                    <div className="min-w-0">
                      <div className="font-medium truncate text-sm"  title={c.name}>{c.name}</div>
                      {c.section && <div className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{c.section}</div>}
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {/* Class type, chosen at import: CPA / Honors (physics) or Trades (its own curriculum). */}
                      <div className="flex rounded-md border overflow-hidden" style={{ borderColor: 'var(--border)' }} title="Choose the class type. CPA and Honors follow the physics curriculum; Trades follows the trades curriculum.">
                        {CLASS_TYPES.map((t) => {
                          const on = typeOf(c.id) === t.id
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setCourseType(c.id, t.id)}
                              title={t.hint}
                              className="text-overline font-semibold px-2 py-1"
                              style={{ background: on ? (t.id === 'trades' ? 'var(--reward)' : 'var(--primary)') : 'var(--card)', color: on ? (t.id === 'trades' ? 'var(--reward-foreground)' : 'var(--primary-foreground)') : 'var(--muted-foreground)' }}
                            >
                              {t.label}
                            </button>
                          )
                        })}
                      </div>
                      <button
                        onClick={() => importCourse(c)}
                        disabled={importing === c.id}
                        className="text-xs rounded-md border px-2.5 py-1.5 whitespace-nowrap"
                        style={{ borderColor: 'var(--border)', background: already ? 'var(--card)' : 'color-mix(in oklch, var(--success) 14%, transparent)', color: already ? 'var(--muted-foreground)' : 'var(--foreground)' }}
                      >
                        {importing === c.id ? 'Syncing…' : already ? 'Refresh roster' : 'Import roster'}
                      </button>
                    </div>
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
          <div role={status.error ? 'alert' : 'status'} className="mt-4 flex items-center gap-2 text-sm rounded-lg p-3" style={{ background: `color-mix(in oklch, var(${status.error ? '--viz-down' : '--success'}) 14%, transparent)` }}>
            {status.error ? <AlertCircle size={16} className="shrink-0" style={{ color: 'var(--viz-down)' }} /> : <CheckCircle2 size={16} className="shrink-0" style={{ color: 'var(--success)' }} />}
            <span>{status.message}</span>
          </div>
        )}
      </div>

      {/* imported classes */}
      {imported.length > 0 && (
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>Synced classes</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {imported.map((c) => (
              <Link key={c.id} href={studentsHref('roster', c.id)}>
                <div className="rounded-2xl border p-4 h-full transition-transform"
                  style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--primary)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                  <div className="text-title-3" >{c.name}</div>
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

      </>}
      {mode === 'roster' && rosterLoading && <p role="status">Loading students…</p>}
      {mode === 'roster' && rosterError && <p role="alert" className="mb-4 text-destructive">{rosterError} <button className="underline" onClick={loadRoster}>Retry</button></p>}
      {mode === 'roster' && !rosterLoading && !rosterError && roster.length === 0 && <p>No students in this class yet. <Link className="underline" href={studentsHref('settings', classId)}>Sync a roster in Class settings</Link>.</p>}
      {/* name editor — fix how a name splits so the Aspen grade-copy sorts it right */}
      {mode === 'roster' && roster.length > 0 && (
        <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3"><h2 className="text-title-3">{roster.length} students</h2><Link className="text-sm font-semibold text-primary" href={studentsHref('settings', classId)}>Manage roster sync →</Link></div>
          <div className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Manage names and language supports for this class. Names are sorted by last name for grade exports; changes here do not change a student&apos;s Google name.
          </div>
          <label className="block mb-5 text-sm">Find a student<input type="search" className="mt-2 block w-full max-w-sm rounded-lg border bg-background p-3" placeholder="Search student names…" value={search} onChange={event => setSearch(event.target.value)} /></label>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr>
                <th scope="col" className="text-left font-medium py-3 pr-4 text-muted-foreground">Student</th>
                <th scope="col" className="text-left font-medium py-3 px-3 text-muted-foreground">Language supports</th>
                <th scope="col" className="text-left font-medium py-3 pl-3 text-muted-foreground">Follow-up</th>
              </tr></thead>
              <tbody>{[...roster].filter(student => `${student.name} ${student.first_name ?? ''} ${student.last_name ?? ''}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => (a.last_name || a.name).localeCompare(b.last_name || b.name)).map(student => {
                const edit = edits[student.id] ?? { first: student.first_name ?? '', last: student.last_name ?? '' }
                const changed = edit.first !== (student.first_name ?? '') || edit.last !== (student.last_name ?? '')
                return <tr key={student.id} className="border-t align-top">
                  <td className="py-4 pr-4 min-w-48">
                    <Link className="font-semibold text-primary inline-flex min-h-9 items-center" href={teachingHref('results', classId) + '&resultStudent=' + encodeURIComponent(student.id)}>{student.name}</Link>
                    <details className="mt-1"><summary className="cursor-pointer text-xs text-muted-foreground py-2">Edit name</summary>
                      <div className="grid gap-2 max-w-64 py-2">
                        <label className="text-xs text-muted-foreground">First name<input aria-label={`First name for ${student.name}`} value={edit.first} onChange={event => setEdits(previous => ({ ...previous, [student.id]: { first: event.target.value, last: edit.last } }))} className="mt-1 w-full rounded-lg border bg-background p-2 text-sm text-foreground" /></label>
                        <label className="text-xs text-muted-foreground">Last name for sorting<input aria-label={`Last name for ${student.name}`} value={edit.last} onChange={event => setEdits(previous => ({ ...previous, [student.id]: { first: edit.first, last: event.target.value } }))} className="mt-1 w-full rounded-lg border bg-background p-2 text-sm text-foreground" /></label>
                        <button onClick={() => saveName(student.id)} disabled={!changed || savingId === student.id} className="rounded-lg bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50">{savedId === student.id ? 'Saved ✓' : savingId === student.id ? 'Saving…' : 'Save name'}</button>
                      </div>
                    </details>
                  </td>
                  <td className="py-4 px-3"><LanguageProfileCell userId={student.id} /></td>
                  <td className="py-4 pl-3"><div className="flex flex-wrap gap-x-4 gap-y-1 min-w-28"><Link className="text-primary py-2" href={studentsHref('activity', classId) + '&student=' + encodeURIComponent(student.id)}>Activity</Link><Link className="text-primary py-2" href={teachingHref('results', classId) + '&resultStudent=' + encodeURIComponent(student.id)}>Work</Link></div></td>
                </tr>
              })}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
