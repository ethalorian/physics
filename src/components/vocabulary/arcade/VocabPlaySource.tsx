"use client"

import { useCallback, useEffect, useState } from 'react'
import type { VocabularyTerm } from '@/types/assignment'

// Shared "what do you want to play?" selector for the arcade: pick a unit OR a
// single lesson, plus a tier filter. Resolves to terms + a score-attribution set
// id via /api/vocab/play and reports them up through onResolved.
//
// One-tap play: when nothing steers the picker (no deep link), it resolves a
// smart default on its own — the last-used selection (localStorage), else the
// first lesson with vocab — so every game opens with words already loaded.
// Once sources are known it ALWAYS eventually calls onResolved (possibly with
// zero terms), so pages can treat "no callback yet" as a loading state.

interface SourceUnit { id: string; name: string }
interface SourceLesson { id: string; title: string; unit: string }
interface Assigned { setId: string; lessonId: string | null; unitId: string | null; dueOn: string | null; label: string }
export interface ResolvedPlay { terms: VocabularyTerm[]; scoreSetId: string | null; label: string }

const LAST_PLAY_KEY = 'vocab:lastPlay'
const TIERS = ['all', '1', '2', '3']

export default function VocabPlaySource({ onResolved, initialLessonId }: { onResolved: (r: ResolvedPlay) => void; initialLessonId?: string }) {
  const [units, setUnits] = useState<SourceUnit[]>([])
  const [lessons, setLessons] = useState<SourceLesson[]>([])
  const [assigned, setAssigned] = useState<Assigned[]>([])
  const [scope, setScope] = useState<'lesson' | 'unit'>('lesson')
  const [lessonId, setLessonId] = useState(initialLessonId ?? '')
  const [unitId, setUnitId] = useState('')
  const [tier, setTier] = useState('all')
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/vocab/sources').then((r) => r.json())
      .then((d: { units?: SourceUnit[]; lessons?: SourceLesson[]; assigned?: Assigned[] }) => { setUnits(d.units ?? []); setLessons(d.lessons ?? []); setAssigned(d.assigned ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Deep-linked from a lesson (e.g. the vocab block's "Play Word Shoot" button):
  // preselect that lesson's vocab and resolve its terms immediately.
  useEffect(() => {
    if (!initialLessonId) return
    setScope('lesson')
    setLessonId(initialLessonId)
    fetch(`/api/vocab/play?lesson_id=${initialLessonId}&tier=all`).then((r) => r.json())
      .then((d: ResolvedPlay) => { setCount(d.terms?.length ?? 0); onResolved(d) })
      .catch(() => { setCount(0); onResolved({ terms: [], scoreSetId: null, label: '' }) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLessonId])

  // Deep-linked from the arcade hub's "current focus" steer (?lesson_id= or
  // ?unit_id= on ANY game page): preselect and resolve, no prop plumbing
  // needed. window.location (not useSearchParams) keeps prerender happy.
  useEffect(() => {
    if (initialLessonId) return
    const sp = new URLSearchParams(window.location.search)
    const lid = sp.get('lesson_id'), uid = sp.get('unit_id')
    if (!lid && !uid) return
    const scope2 = lid ? 'lesson' as const : 'unit' as const
    const id = (lid ?? uid)!
    setScope(scope2)
    if (lid) setLessonId(lid); else setUnitId(id)
    fetch(`/api/vocab/play?${lid ? 'lesson_id' : 'unit_id'}=${id}&tier=all`).then((r) => r.json())
      .then((d: ResolvedPlay) => { setCount(d.terms?.length ?? 0); onResolved(d) })
      .catch(() => { setCount(0); onResolved({ terms: [], scoreSetId: null, label: '' }) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resolve = useCallback((nextScope: 'lesson' | 'unit', id: string, t: string) => {
    if (!id) { setCount(null); onResolved({ terms: [], scoreSetId: null, label: '' }); return }
    // Remember the pick so the next game (or visit) opens straight into it.
    try { localStorage.setItem(LAST_PLAY_KEY, JSON.stringify({ scope: nextScope, id, tier: t })) } catch { /* ignore */ }
    const qs = nextScope === 'lesson' ? `lesson_id=${id}` : `unit_id=${id}`
    fetch(`/api/vocab/play?${qs}&tier=${t}`).then((r) => r.json())
      .then((d: ResolvedPlay) => { setCount(d.terms?.length ?? 0); onResolved(d) })
      .catch(() => { setCount(0); onResolved({ terms: [], scoreSetId: null, label: '' }) })
  }, [onResolved])

  // Smart default (one-tap play): no deep link and nothing picked yet →
  // restore the last-used selection if it still exists, else fall back to the
  // first lesson (then first unit) with vocab. If there is nothing at all to
  // play, settle with an empty resolve so callers can leave loading state.
  useEffect(() => {
    if (loading || initialLessonId) return
    const sp = new URLSearchParams(window.location.search)
    if (sp.get('lesson_id') || sp.get('unit_id')) return
    if (lessonId || unitId) return
    // The teacher's assignment beats memory: the newest assigned set with a lesson opens first.
    const a = assigned.find((x) => x.lessonId && lessons.some((l) => l.id === x.lessonId))
    if (a?.lessonId) { setScope('lesson'); setLessonId(a.lessonId); resolve('lesson', a.lessonId, 'all'); return }
    let stored: { scope?: string; id?: string; tier?: string } | null = null
    try { stored = JSON.parse(localStorage.getItem(LAST_PLAY_KEY) ?? 'null') } catch { /* ignore */ }
    const t = stored?.tier && TIERS.includes(stored.tier) ? stored.tier : 'all'
    if (stored?.scope === 'lesson' && stored.id && lessons.some((l) => l.id === stored?.id)) {
      setScope('lesson'); setLessonId(stored.id); setTier(t); resolve('lesson', stored.id, t); return
    }
    if (stored?.scope === 'unit' && stored.id && units.some((u) => u.id === stored?.id)) {
      setScope('unit'); setUnitId(stored.id); setTier(t); resolve('unit', stored.id, t); return
    }
    if (lessons.length > 0) { setScope('lesson'); setLessonId(lessons[0].id); resolve('lesson', lessons[0].id, 'all'); return }
    if (units.length > 0) { setScope('unit'); setUnitId(units[0].id); resolve('unit', units[0].id, 'all'); return }
    onResolved({ terms: [], scoreSetId: null, label: '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const sel = { borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }

  if (loading) return <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading vocab…</div>
  if (units.length === 0 && lessons.length === 0) {
    return <div className="rounded-lg border p-3 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>No vocabulary published yet — a teacher needs to add lesson vocab first.</div>
  }

  return (
    <div className="space-y-3">
      {assigned.length > 0 && (
        <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'color-mix(in oklch, var(--reward) 45%, var(--border))', background: 'color-mix(in oklch, var(--reward) 12%, var(--card))' }}>
          <span className="font-semibold">Assigned · Asignado:</span>{' '}
          {assigned.map((a, i) => (
            <button key={a.setId} type="button" className="underline mr-2" onClick={() => { if (a.lessonId) { setScope('lesson'); setLessonId(a.lessonId); resolve('lesson', a.lessonId, tier) } }}>
              {a.label}{a.dueOn ? ` (due ${a.dueOn})` : ''}{i < assigned.length - 1 ? '' : ''}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        {(['lesson', 'unit'] as const).map((s) => (
          <button key={s} onClick={() => { setScope(s); setLessonId(''); setUnitId(''); setCount(null); onResolved({ terms: [], scoreSetId: null, label: '' }) }}
            className="text-sm rounded-lg border px-3 py-1.5 capitalize" style={{ borderColor: 'var(--border)', background: scope === s ? 'var(--primary)' : 'var(--card)', color: scope === s ? 'var(--primary-foreground, white)' : 'var(--foreground)' }}>
            {s === 'lesson' ? 'By lesson' : 'By unit'}
          </button>
        ))}
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        {scope === 'lesson' ? (
          <select value={lessonId} onChange={(e) => { setLessonId(e.target.value); resolve('lesson', e.target.value, tier) }} className="rounded-lg border px-2.5 py-1.5 text-sm" style={sel}>
            <option value="">— choose a lesson —</option>
            {lessons.map((l) => <option key={l.id} value={l.id}>{l.unit ? `${l.unit} · ` : ''}{l.title}</option>)}
          </select>
        ) : (
          <select value={unitId} onChange={(e) => { setUnitId(e.target.value); resolve('unit', e.target.value, tier) }} className="rounded-lg border px-2.5 py-1.5 text-sm" style={sel}>
            <option value="">— choose a unit —</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        <select value={tier} onChange={(e) => { setTier(e.target.value); resolve(scope, scope === 'lesson' ? lessonId : unitId, e.target.value) }} className="rounded-lg border px-2.5 py-1.5 text-sm" style={sel}>
          <option value="all">All tiers</option>
          <option value="1">Tier 1 · everyday</option>
          <option value="2">Tier 2 · academic</option>
          <option value="3">Tier 3 · physics</option>
        </select>
      </div>

      {count !== null && (
        <div className="text-xs" style={{ color: count > 0 ? 'var(--muted-foreground)' : 'var(--destructive)' }}>
          {count > 0 ? `${count} terms ready` : 'No terms for this selection'}
        </div>
      )}
    </div>
  )
}
