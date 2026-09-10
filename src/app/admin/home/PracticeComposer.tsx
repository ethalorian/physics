'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Catalog { sets: { id: string; name: string | null }[]; words: { id: string; term: string; vocabulary_set_id: string }[] }
export default function PracticeComposer({ courseId, students, onClose, onAssigned }: {
  courseId: string; students: { id: string; name: string }[]; onClose: () => void; onAssigned: () => void
}) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [setId, setSetId] = useState('')
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [note, setNote] = useState('')
  const [minimum, setMinimum] = useState(2)
  const [threshold, setThreshold] = useState(80)
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setError('')
    fetch('/api/vocab/catalog', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Practice resources could not load.')
      const data = await response.json()
      if (!Array.isArray(data.sets) || !Array.isArray(data.words)) throw new Error('Practice resources could not load.')
      setCatalog(data)
    }).catch(error => { if (!controller.signal.aborted) setError(error.message) })
    return () => controller.abort()
  }, [retry])
  const words = catalog?.words.filter(word => word.vocabulary_set_id === setId) ?? []
  async function assign() {
    if (!title.trim() || !selectedWords.length || !students.length) return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/vocab/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ course_ids: [courseId], student_ids: students.map(student => student.id), term_ids: selectedWords, title: title.trim(), due_on: due || undefined, note, threshold, min_checks: minimum, check_mode: selectedWords.length === 1 ? 'recall' : 'recognition' }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Practice could not be assigned.')
      onAssigned()
    } catch (error) { setError(error instanceof Error ? error.message : 'Practice could not be assigned.') }
    finally { setBusy(false) }
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose() }}><DialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-xl sm:max-w-2xl" onEscapeKeyDown={event => { if (busy) event.preventDefault() }} onPointerDownOutside={event => { if (busy) event.preventDefault() }}>
    <DialogHeader><DialogTitle>Assign individual practice</DialogTitle><DialogDescription>Vocabulary practice appears on each selected student’s Home. Track check starts, completed checks, and word progress here.</DialogDescription></DialogHeader>
    <div className="rounded-xl bg-muted p-3"><p className="text-sm font-semibold">{students.length} selected {students.length === 1 ? 'student' : 'students'}</p><p className="mt-1 max-h-20 overflow-y-auto text-xs text-muted-foreground">{students.map(student => student.name).join(', ')}</p></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}{!catalog && <Button variant="outline" onClick={() => setRetry(n => n + 1)}>Retry resources</Button>}</p>}
    {!catalog ? <p role="status">Loading practice resources…</p> : <form className="space-y-4" onSubmit={event => { event.preventDefault(); void assign() }}>
      <label className="block text-sm font-medium">Word set<select aria-label="Word set" required className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3" value={setId} disabled={busy} onChange={event => { const id = event.target.value; setSetId(id); setSelectedWords(catalog.words.filter(word => word.vocabulary_set_id === id).slice(0, 60).map(word => word.id)); setTitle(catalog.sets.find(set => set.id === id)?.name || 'Vocabulary practice') }}><option value="">Choose published vocabulary…</option>{catalog.sets.filter(set => catalog.words.some(word => word.vocabulary_set_id === set.id)).map(set => <option key={set.id} value={set.id}>{set.name || 'Untitled word set'}</option>)}</select></label>
      {!!words.length && <fieldset className="rounded-xl border p-3"><legend className="px-1 text-sm">Words to practice · {selectedWords.length}/60 selected</legend><div className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto">{words.map(word => <label key={word.id} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={selectedWords.includes(word.id)} disabled={busy || (!selectedWords.includes(word.id) && selectedWords.length >= 60)} onChange={event => setSelectedWords(previous => event.target.checked ? [...previous, word.id] : previous.filter(id => id !== word.id))} />{word.term}</label>)}</div></fieldset>}
      <label className="block text-sm font-medium">Assignment title<input aria-label="Assignment title" required maxLength={200} value={title} disabled={busy} onChange={event => setTitle(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3" /></label>
      <div className="grid gap-3 sm:grid-cols-3"><label className="text-sm">Due date (optional)<input aria-label="Due date (optional)" type="date" value={due} disabled={busy} onChange={event => setDue(event.target.value)} className="mt-1 min-h-11 w-full min-w-0 rounded-lg border bg-background px-2" /></label><label className="text-sm">Checks per word<select aria-label="Checks per word" value={minimum} disabled={busy} onChange={event => setMinimum(Number(event.target.value))} className="mt-1 min-h-11 w-full rounded-lg border bg-background px-2">{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}</select></label><label className="text-sm">Accuracy goal<select aria-label="Accuracy goal" value={threshold} disabled={busy} onChange={event => setThreshold(Number(event.target.value))} className="mt-1 min-h-11 w-full rounded-lg border bg-background px-2">{[60,70,80,90,100].map(n => <option key={n} value={n}>{n}%</option>)}</select></label></div>
      <label className="block text-sm">Directions (optional)<textarea maxLength={2000} value={note} disabled={busy} onChange={event => setNote(event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border bg-background p-3" /></label>
      <p className="text-xs text-muted-foreground">{selectedWords.length === 1 ? 'One word uses recall / spelling.' : 'Students complete recognition checks on the selected words.'} Completion uses the accuracy goal and required checks for each word.</p>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy || !selectedWords.length || !title.trim()}>{busy ? 'Assigning…' : `Assign to ${students.length} ${students.length === 1 ? 'student' : 'students'}`}</Button></div>
    </form>}
  </DialogContent></Dialog>
}
