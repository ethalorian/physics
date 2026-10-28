'use client'

import { useLearningResource } from '@/app/home/useLearningWeek'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import AssignmentIdentity from '@/components/AssignmentIdentity'
import type { PlanActivity, SavedUnitSequence } from '@/lib/teaching-plans/types'
import s from '@/components/choices/ChoiceSequence.module.css'

export default function CalendarSequencePicker({ catalog, classId, classLabel, unitId, currentCount, onChoose, onClose }: {
  catalog: PlanActivity[]; classId: string; classLabel: string; unitId: string; currentCount: number
  onChoose: (unitId: string) => void; onClose: () => void
}) {
  const { data, loading, error, refresh } = useLearningResource<{ sequences: SavedUnitSequence[] }>('/api/teaching-plans?view=sequences&class=' + encodeURIComponent(classId))
  return <Dialog open onOpenChange={open => { if (!open) onClose() }}><DialogContent className={s.library}>
    <DialogTitle>Change sequence</DialogTitle>
    <DialogDescription>Choose the saved sequence to use in {classLabel}’s carousel. You’ll review the change before applying it.</DialogDescription>
    <div className={s.libraryBody}>
      {loading ? <p role="status">Loading saved sequences…</p> : error ? <div role="alert"><p>Saved sequences couldn’t load.</p><button type="button" onClick={refresh}>Retry sequences</button></div> : data?.sequences.length ? data.sequences.map(sequence => <article key={sequence.id} className={s.details} aria-label={sequence.title}>
        <h3>{sequence.title}</h3>
        <p>{sequence.steps.length} activities in the saved sequence{sequence.unitId === unitId ? ` · Currently showing ${currentCount}` : ''}</p>
        <details><summary>View activities</summary><ol>{sequence.steps.map(step => <li key={step.id}><AssignmentIdentity source={catalog.find(a => a.key === step.activityKey) ?? step}/></li>)}</ol></details>
        <button type="button" className={s.primary} disabled={!sequence.steps.length} onClick={() => onChoose(sequence.unitId)}>Use this sequence</button>
      </article>) : <p>No saved sequences yet. Build and save a sequence in Plan first.</p>}
    </div>
  </DialogContent></Dialog>
}
