"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, X, Zap } from 'lucide-react'
import moments from '@/data/unit1-lobby-moments.json'
import type { ContentBlock } from '@/data/content-blocks'
import { lobbyReadyDefault } from '@/data/content-blocks'

/**
 * Lobby launcher (L-1 … L-6) — press L on any staff surface. The drawer
 * pre-fills the class, the lesson (day) and its lobbyReady blocks, plus the
 * pre-authored lobby moments for that day (from lesson-plan data, L-6). Launch
 * creates the session through the existing /api/lobby/sessions (L-1) with
 * lesson_id / block_id / target_id, then opens the projector board.
 */

type Course = { id: string; name: string; section: string | null; program: string; teacher_email?: string | null; mine?: boolean }
type Lesson = { id: string; title: string; slug: string; lesson_number: number | null; unit: string | null; unit_id: string | null; content_blocks?: { blocks?: ContentBlock[] } | null }
type Moment = { kind: string; when: string; minutes: number; title: string; prompt: string; blocks: string[]; debrief: string; then: string; surface: string }
type Choice = { key: string; label: string; kind: string; prompt: string; blockId: string | null; blockType: string | null; targetId: string | null; debrief?: string; then?: string }

const MOMENTS = moments as unknown as Record<string, { title: string; moments: Moment[] }>
const MODES: { id: string; label: string }[] = [
  { id: 'near_peer', label: 'Near-peer' }, { id: 'random', label: 'Random' }, { id: 'matched', label: 'Matched' },
]

/** Map a block type to the lobby task type the student device already renders. */
function taskTypeFor(blockType: string | null): string {
  if (blockType === 'sketch' || blockType === 'lab_notebook') return 'drawing'
  if (blockType === 'gewa' || blockType === 'equation_sandbox') return 'proof'
  if (blockType === 'question') return 'question'
  return 'short_response'
}

function promptOf(b: ContentBlock): string {
  const x = b as unknown as Record<string, unknown>
  const q = x.question && typeof x.question === 'object' ? (x.question as { prompt?: string }).prompt : undefined
  return String(q ?? x.prompt ?? x.instruction ?? x.frame ?? x.patternPrompt ?? '').trim()
}

export default function LobbyLauncher() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState('')
  // Off by default: the drawer lists only the classes you own, so Launch can
  // never come up pre-armed on a colleague's roster. On = you're covering.
  const [showAll, setShowAll] = useState(false)
  const [scopedTo, setScopedTo] = useState<string[]>([])
  // Reaching past your own classes is an ADMIN affordance. A teacher owns what
  // they own: the server refuses ?scope=all for them, so the toggle must not be
  // offered either -- a control that silently does nothing is worse than none.
  const [canSeeAll, setCanSeeAll] = useState(false)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lessonId, setLessonId] = useState('')
  const [choice, setChoice] = useState<string>('')
  const [mode, setMode] = useState('near_peer')
  const [size, setSize] = useState(4)
  const [languageBalance, setLanguageBalance] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // L-1 · press L anywhere staff-facing (never inside an input).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'l' || e.key === 'L') { e.preventDefault(); setOpen(true) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    fetch(`/api/teacher/courses${showAll ? '?scope=all' : ''}`).then((r) => (r.ok ? r.json() : { courses: [] })).then((d: { courses?: Course[]; scopedTo?: string[]; canSeeAll?: boolean }) => {
      const cs = d.courses ?? []
      setCourses(cs)
      setScopedTo(d.scopedTo ?? [])
      setCanSeeAll(d.canSeeAll === true)
      // Keep a still-valid pick; otherwise land on one of YOUR classes. The old
      // `cs[0]` default was alphabetical across the whole district, which meant
      // the drawer opened pointed at another teacher's section.
      setCourseId((cur) => (cur && cs.some((c) => c.id === cur) ? cur : cs.find((c) => c.mine)?.id ?? cs[0]?.id ?? ''))
    }).catch(() => {})
  }, [open, showAll])

  useEffect(() => {
    if (!open) return
    fetch('/api/lessons/published?limit=200').then((r) => (r.ok ? r.json() : { lessons: [] })).then((d: { lessons?: Lesson[] }) => {
      setLessons((d.lessons ?? []).slice().sort((a, b) => (a.unit ?? '').localeCompare(b.unit ?? '') || (a.lesson_number ?? 0) - (b.lesson_number ?? 0)))
    }).catch(() => {})
  }, [open])

  const lesson = lessons.find((l) => l.id === lessonId) ?? null
  const day = lesson?.lesson_number ?? null
  const isUnit1 = (lesson?.unit_id ?? '') === 'unit-1'

  // The section's lobbyReady blocks (B-6) + this day's pre-authored moments (L-6).
  const choices = useMemo<Choice[]>(() => {
    const out: Choice[] = []
    const dayMoments = isUnit1 && day ? MOMENTS[String(day)]?.moments ?? [] : []
    dayMoments.forEach((m, i) => out.push({ key: `m${i}`, label: m.title, kind: `${m.kind} · ${m.when} · ${m.minutes} min`, prompt: m.prompt, blockId: null, blockType: m.blocks[0] ?? null, targetId: null, debrief: m.debrief, then: m.then }))
    const blocks = lesson?.content_blocks?.blocks ?? []
    for (const b of blocks) {
      if (!lobbyReadyDefault(b)) continue
      const p = promptOf(b)
      if (!p) continue
      out.push({ key: `b:${b.id}`, label: p.length > 90 ? p.slice(0, 88) + '…' : p, kind: `${b.type} block`, prompt: p, blockId: b.id, blockType: b.type, targetId: b.targetId ?? null })
    }
    return out
  }, [lesson, day, isUnit1])

  useEffect(() => { if (choices.length > 0 && !choices.some((c) => c.key === choice)) setChoice(choices[0].key) }, [choices, choice])
  const sel = choices.find((c) => c.key === choice) ?? null

  // A course with `mine` undefined is treated as yours: an older API response
  // that predates ownership tagging should not paint every class as a warning.
  const course = courses.find((c) => c.id === courseId) ?? null
  const ownerOf = (e?: string | null) => (e ?? '').split('@')[0] || 'another teacher'
  const labelOf = (c: Course) => `${c.name}${c.section ? ` \u00b7 ${c.section}` : ''}`
  const myCourses = courses.filter((c) => c.mine !== false)
  const otherCourses = courses.filter((c) => c.mine === false)

  const launch = useCallback(async () => {
    if (!courseId || !sel) return
    setBusy(true); setErr(null)
    try {
      // The target: the block's own, else the lesson's first target (resolved server-side from the slug).
      const r = await fetch('/api/lobby/sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId, task_type: taskTypeFor(sel.blockType), grouping_mode: mode, group_size: size,
          prompt: sel.prompt, lesson_id: lessonId || null, block_id: sel.blockId, target_slug: sel.targetId, language_balance: languageBalance,
          debrief: sel.debrief ?? null, then: sel.then ?? null,
        }),
      })
      const d = (await r.json()) as { session?: { id: string }; error?: string }
      if (!r.ok || !d.session) throw new Error(d.error ?? 'Could not launch')
      setOpen(false)
      router.push(`/admin/lobby/${d.session.id}`)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not launch') } finally { setBusy(false) }
  }, [courseId, sel, mode, size, lessonId, languageBalance, router])

  if (!open) return null
  const field = { borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }
  return (
    <div className="fixed inset-0 z-50" style={{ background: 'color-mix(in oklch, var(--foreground) 35%, transparent)' }} onClick={() => setOpen(false)}>
      <aside onClick={(e) => e.stopPropagation()} className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto p-5 flex flex-col gap-4" style={{ background: 'var(--card)', borderLeft: '1px solid var(--border)', boxShadow: '-16px 0 40px -24px color-mix(in oklch, var(--primary) 40%, transparent)' }} aria-label="Launch a lobby">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Launch a lobby</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Press <kbd>L</kbd> anywhere staff-facing · Esc closes</div>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-md p-1" style={{ color: 'var(--muted-foreground)' }}><X size={18} /></button>
        </div>

        <div className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Class</div>
          <select value={courseId} aria-label="Class" onChange={(e) => setCourseId(e.target.value)} className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={field}>
            {otherCourses.length === 0
              ? myCourses.map((c) => <option key={c.id} value={c.id}>{labelOf(c)}</option>)
              : (
                <>
                  <optgroup label="Your classes">
                    {myCourses.map((c) => <option key={c.id} value={c.id}>{labelOf(c)}</option>)}
                  </optgroup>
                  <optgroup label="Other teachers">
                    {otherCourses.map((c) => <option key={c.id} value={c.id}>{labelOf(c)} — {ownerOf(c.teacher_email)}</option>)}
                  </optgroup>
                </>
              )}
          </select>
          {canSeeAll && (
            <label className="mt-1.5 inline-flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }} title="Admin only. Covering someone else's block? Their classes stay one click away — but are never pre-selected.">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              <span>Show all classes <span style={{ opacity: 0.8 }}>(admin · covering another teacher)</span></span>
            </label>
          )}
          {course?.mine === false && (
            <div className="mt-1.5 text-xs rounded-lg px-2 py-1.5" style={{ background: 'color-mix(in oklch, var(--destructive) 12%, transparent)', color: 'var(--destructive)' }}>
              This is {ownerOf(course.teacher_email)}’s class — the lobby, its groups and every artifact land on their roster.
            </div>
          )}
          {courses.length === 0 && (
            <div className="mt-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {showAll
                ? 'No classes found.'
                : `No classes are owned by ${scopedTo.join(' or ') || 'this account'}.${canSeeAll ? ' Tick \u201cShow all classes\u201d to reach a colleague\u2019s section.' : ' Ask an admin to import or reassign your section.'}`}
            </div>
          )}
        </div>
        <label className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Lesson · day</div>
          <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={field}>
            <option value="">— pick a lesson —</option>
            {lessons.map((l) => <option key={l.id} value={l.id}>{l.unit ? `${l.unit.replace(/^Unit\s*(\d+).*$/i, 'U$1')} · ` : ''}{l.lesson_number ? `Day ${l.lesson_number} · ` : ''}{l.title}</option>)}
          </select>
        </label>

        <div className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>{isUnit1 && day && MOMENTS[String(day)] ? `Day ${day} · ${MOMENTS[String(day)].title} · ${MOMENTS[String(day)].moments.length} lobby moments` : 'Lobby-ready blocks'}</div>
          {choices.length === 0 && <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Pick a lesson with a lobby-ready block (question, sketch, GEWA, observation, sentence frame, data table, transfer prompt).</p>}
          <div className="flex flex-col gap-1.5">
            {choices.map((c) => (
              <button key={c.key} onClick={() => setChoice(c.key)} className="text-left rounded-xl border p-2.5"
                style={{ borderColor: choice === c.key ? 'var(--primary)' : 'var(--border)', background: choice === c.key ? 'color-mix(in oklch, var(--primary) 10%, var(--card))' : 'var(--card)' }}>
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>{c.kind}</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{c.label}</div>
                {c.key !== `b:${c.blockId}` && <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{c.prompt}</div>}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <label>
            <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Grouping</div>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={field}>
              {MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </label>
          <label>
            <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Group size</div>
            <select value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={field}>
              {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
        <label className="inline-flex items-center gap-2 text-sm" title="L-2 / SEI: spread WIDA levels across groups so every group has a bridge for a language-heavy task">
          <input type="checkbox" checked={languageBalance} onChange={(e) => setLanguageBalance(e.target.checked)} />
          <span>Balance by language profile <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>(language-heavy task)</span></span>
        </label>
        <div className="text-xs rounded-lg p-2" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
          <Users size={12} className="inline mr-1" /> Rotating roles (Facilitator · Skeptic · Recorder · Reporter) and the split passphrase are always on. Forming → Working → Debrief; Collect writes one artifact per member with their role.
        </div>

        {err && <div className="text-xs" style={{ color: 'var(--destructive)' }}>{err}</div>}
        <button onClick={launch} disabled={!courseId || !sel || busy} className="rounded-xl px-4 py-2.5 text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          <Zap size={16} /> {busy ? 'Launching…' : sel ? `Launch “${sel.label.length > 40 ? sel.label.slice(0, 38) + '…' : sel.label}” · code goes on the projector` : 'Launch'}
        </button>
      </aside>
    </div>
  )
}
