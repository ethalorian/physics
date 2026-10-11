'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { DeckActivity } from '@/lib/deck-activities'

export default function DeckActivities({ activities, currentSlide, busy, onChoose }: {
  activities: DeckActivity[]
  currentSlide: number
  busy: boolean
  onChoose: (activity: DeckActivity, mode: 'solo' | 'lobby') => void
}) {
  const [selectedId, setSelectedId] = useState('')
  const [search, setSearch] = useState('')
  const filtered = activities.filter(a => `${a.title} ${a.prompt}`.toLowerCase().includes(search.toLowerCase()))
  const chosen = filtered.find(a => a.id === selectedId) ?? filtered.find(a => a.kind === 'exit_ticket') ?? filtered[0]
  if (!activities.length) return null
  return <Card density="compact" className="space-y-3" id="deck-activities">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-title-2">Activities from this deck</h2><span className="text-sm text-muted-foreground">{activities.length} activities · {activities[0].unitId.startsWith('trades-etf-') ? 'ETF' : activities[0].track === 'shared' ? 'Class presentation' : activities[0].track === 'honors' ? 'Honors' : 'CPA'}</span></div>
    <p className="text-sm text-muted-foreground">Choose a question, then prepare an individual response or a group lobby.</p>
    <div className="flex flex-wrap gap-2">
      {activities.filter(a => a.kind === 'warmup').map(a => <Button key={a.id} variant="outline" className="min-h-12" onClick={() => { setSearch(''); setSelectedId(a.id) }}>This deck’s opening question</Button>)}
      {activities.filter(a => a.kind === 'exit_ticket').map(a => <Button key={a.id} variant="outline" className="min-h-12" onClick={() => { setSearch(''); setSelectedId(a.id) }}>This deck’s exit ticket</Button>)}
      {activities.some(a => a.slide === currentSlide + 1) && <Button variant="outline" className="min-h-12" onClick={() => { setSearch(''); setSelectedId(activities.find(a => a.slide === currentSlide + 1)!.id) }}>Current slide’s question</Button>}
    </div>
    <label className="block text-sm font-medium">Find a question<input aria-label="Find a deck activity" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search this deck…" className="mt-1 min-h-12 w-full rounded-lg border bg-background px-3 text-base" /></label>
    {chosen ? <>
      <label className="block text-sm font-medium">Deck activity<select aria-label="Deck activity" value={chosen.id} onChange={e => setSelectedId(e.target.value)} className="mt-1 min-h-12 w-full rounded-lg border bg-background px-3 text-base">{filtered.map(a => <option key={a.id} value={a.id}>Slide {a.slide} · {a.title}</option>)}</select></label>
      <div className="space-y-3 rounded-xl border bg-muted/40 p-4"><p className="text-sm font-semibold">{chosen.title} · Slide {chosen.slide}</p><p className="whitespace-pre-wrap">{chosen.prompt}</p><p className="text-sm text-muted-foreground">{chosen.targetStatement ? `Learning target: ${chosen.targetStatement}` : 'Choose a learning target when preparing a solo response.'}</p><a className="inline-flex min-h-12 items-center text-sm underline" href={chosen.src+'#'+chosen.slide} target="_blank" rel="noopener noreferrer">Open source slide</a></div>
      <div className="flex flex-wrap gap-3"><Button className="min-h-12" disabled={busy} onClick={() => onChoose(chosen, 'solo')}>Use as solo activity</Button><Button variant="outline" className="min-h-12" disabled={busy} onClick={() => onChoose(chosen, 'lobby')}>Use in a lobby</Button></div>
      <p className="text-sm text-muted-foreground">Review and edit below, then launch. Solo responses enter your mastery drawer. Group work opens in the lobby.</p>
    </> : <p role="status">No questions match. Try a different word.</p>}
  </Card>
}
