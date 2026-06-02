"use client"

import { useCallback, useEffect, useState } from 'react'
import type { VocabularyTerm } from '@/types/assignment'

// Shared "what do you want to play?" selector for the arcade: pick a unit OR a
// single lesson, plus a tier filter. Resolves to terms + a score-attribution set
// id via /api/vocab/play and reports them up through onResolved.

interface SourceUnit { id: string; name: string }
interface SourceLesson { id: string; title: string; unit: string }
export interface ResolvedPlay { terms: VocabularyTerm[]; scoreSetId: string | null; label: string }

export default function VocabPlaySource({ onResolved, initialLessonId }: { onResolved: (r: ResolvedPlay) => void; initialLessonId?: string }) {
  const [units, setUnits] = useState<SourceUnit[]>([])
  const [lessons, setLessons] = useState<SourceLesson[]>([])
  const [scope, setScope] = useState<'lesson' | 'unit'>('lesson')
  const [lessonId, setLessonId] = useState(initialLessonId ?? '')
  const [unitId, setUnitId] = useState('')
  const [tier, setTier] = useState('all')
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/vocab/sources').then((r) => r.json())
      .then((d: { units?: SourceUnit[]; lessons?: SourceLesson[] }) => { setUnits(d.units ?? []); setLessons(d.lessons ?? []) })
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

  const resolve = useCallback((nextScope: 'lesson' | 'unit', id: string, t: string) => {
    if (!id) { setCount(null); onResolved({ terms: [], scoreSetId: null, label: '' }); return }
    const qs = nextScope === 'lesson' ? `lesson_id=${id}` : `unit_id=${id}`
    fetch(`/api/vocab/play?${qs}&tier=${t}`).then((r) => r.json())
      .then((d: ResolvedPlay) => { setCount(d.terms?.length ?? 0); onResolved(d) })
      .catch(() => { setCount(0); onResolved({ terms: [], scoreSetId: null, label: '' }) })
  }, [onResolved])

  const sel = { borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }

  if (loading) return <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading vocab…</div>
  if (units.length === 0 && lessons.length === 0) {
    return <div className="rounded-lg border p-3 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>No vocabulary published yet — a teacher needs to add lesson vocab first.</div>
  }

  return (
    <div className="space-y-3">
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
        <div className="text-xs" style={{ color: count > 0 ? 'var(--muted-foreground)' : '#C08B8B' }}>
          {count > 0 ? `${count} terms ready` : 'No terms for this selection'}
        </div>
      )}
    </div>
  )
}
