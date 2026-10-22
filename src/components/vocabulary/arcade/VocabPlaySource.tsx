'use client'

import { useEffect, useRef, useState } from 'react'
import type { VocabularyTerm } from '@/types/assignment'

export interface ResolvedPlay { terms: VocabularyTerm[]; scoreSetId: string | null; label: string; unitId?: string | null }
const LAST_UNIT = 'vocab:lastUnit'

/** Every game uses the complete published word pool for the selected class unit. */
export default function VocabPlaySource({ onResolved, initialLessonId }: { onResolved: (r: ResolvedPlay) => void; initialLessonId?: string }) {
  const [units, setUnits] = useState<{id:string;name:string}[]>([]), [unitId, setUnitId] = useState('')
  const [count, setCount] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState(''), [retry, setRetry] = useState(0), [resolvedUnit, setResolvedUnit] = useState('')
  const onResolvedRef = useRef(onResolved)
  useEffect(() => { onResolvedRef.current = onResolved }, [onResolved])
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true); setError('')
      try {
        const response = await fetch('/api/vocab/sources', { signal: controller.signal })
        if (!response.ok) throw Error('Unit vocabulary could not load. Try again.')
        const sources = await response.json() as { units: {id:string;name:string}[] }
        if (controller.signal.aborted) return
        setUnits(sources.units)
        const params = new URLSearchParams(location.search)
        let remembered = ''
        try { remembered = localStorage.getItem(LAST_UNIT) ?? '' } catch { /* Storage is optional. */ }
        const chosen = unitId || params.get('unit_id') || remembered
        const query = new URLSearchParams({ practice: 'unit' })
        if (unitId) query.set('unit_id', unitId)
        else if (params.get('task_id')) query.set('task_id', params.get('task_id')!)
        else if (params.get('set_id')) query.set('set_id', params.get('set_id')!)
        else if (initialLessonId || params.get('lesson_id')) query.set('lesson_id', initialLessonId || params.get('lesson_id')!)
        else if (sources.units.length) query.set('unit_id', sources.units.some(u => u.id === chosen) ? chosen : sources.units[0].id)
        else { setCount(0); onResolvedRef.current({ terms: [], scoreSetId: null, label: '' }); return }
        const result = await fetch('/api/vocab/play?' + query, { signal: controller.signal })
        const data = await result.json() as ResolvedPlay & { error?: string }
        if (!result.ok) throw Error(data.error ?? 'Practice words could not load.')
        if (controller.signal.aborted) return
        setCount(data.terms.length)
        setResolvedUnit(data.unitId ?? '')
        onResolvedRef.current(data)
        if (data.unitId) { try { localStorage.setItem(LAST_UNIT, data.unitId) } catch { /* Optional. */ } }
      } catch (e) { if (!controller.signal.aborted) { setCount(0); setError((e as Error).message); onResolvedRef.current({ terms: [], scoreSetId: null, label: '' }) } }
      finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void load()
    return () => controller.abort()
  }, [unitId, initialLessonId, retry])
  return <div className="space-y-2">
    <label className="grid gap-2 text-sm font-medium">Practice unit<select aria-label="Practice unit" className="min-h-11 rounded-lg border border-border bg-card px-3 text-foreground" value={unitId || resolvedUnit} onChange={e => { setUnitId(e.target.value); onResolvedRef.current({terms:[],scoreSetId:null,label:''}) }} disabled={loading || !units.length}>{!units.length && <option value="">No unit vocabulary yet</option>}{units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
    <p className="text-xs text-muted-foreground" role="status">{loading ? 'Loading unit words…' : `${count} words · all published words and tiers in this unit`}</p>
    {error && <p role="alert" className="text-sm text-destructive">{error} <button type="button" className="min-h-11 underline" onClick={() => setRetry(n => n + 1)}>Retry</button></p>}
  </div>
}
