'use client'
import { LessonLocationLabel, lessonLocation } from '@/components/lessons/LessonVisualIdentity'
import { answerGuide } from '@/components/lessons/lesson-answer-guide'
import { isCaptureBlock } from '@/data/content-blocks'
import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { ContentBlock } from '@/data/content-blocks'
import type { CommandLesson, LiveCommandState } from '@/lib/classroom-command'
import { teachingTitle } from '@/lib/teaching-content'
import { projectedBlockPages } from '@/lib/projected-block'

export function blockLabel(block: ContentBlock): string { return teachingTitle(block).replace(/[#*_`]/g, '').trim() }

export default function ProjectionPanel({ lesson, live, pulseOpen, busy, patch }: {
  lesson: CommandLesson; live: LiveCommandState; pulseOpen: boolean; busy: boolean
  patch: (body: Record<string, unknown>) => Promise<boolean>
}) {
  const [choice, setChoice] = useState('')
  const [search, setSearch] = useState('')
  const blocks = lesson.content_blocks.blocks.filter(b => b.type !== 'deck')
  const chosen = blocks.find(b => b.id === choice)
  const chosenLocation = lessonLocation(chosen?.id, blocks)
  const overlay = live.session.blackout ? 'Screen blanked' : live.lobby ? 'Group lobby' : pulseOpen ? 'Pulse check' : live.session.poll_block_id ? 'Live poll' : null
  const filtered = blocks.filter(b => b.id === choice || `${b.type} ${blockLabel(b)}`.toLowerCase().includes(search.toLowerCase()))
  return <Card id="projector-controls" className="overflow-hidden gap-0 scroll-mt-44">
      <div className="min-w-0 space-y-4 p-5 sm:p-6"><div><h3 className="text-title-3">Choose from this lesson</h3><p className="mt-1 text-caption text-muted-foreground">Choose from {lesson.title}. Your deck stays on its current slide.</p></div><label className="block text-caption">Find a block<input className="mt-1 min-h-12 w-full rounded-xl border bg-background px-3 text-base" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search a prompt, graph, or activity" /></label><label className="block text-caption">Lesson block<select aria-label="Lesson block to project" className="mt-1 min-h-12 w-full min-w-0 rounded-xl border bg-background px-3 text-base" value={choice} onChange={e => setChoice(e.target.value)}><option value="">Choose a block…</option>{filtered.map(b => <option key={b.id} value={b.id}>{blocks.indexOf(b) + 1}. {b.type.replaceAll('_', ' ')} · {blockLabel(b).slice(0, 90)}</option>)}</select></label>
        <div className="rounded-xl border bg-muted/30 p-4 min-h-28">{chosen ? <><p className="text-overline text-primary">Ready to project</p><div className="mt-2 text-caption text-primary"><LessonLocationLabel location={chosenLocation} /></div><p className="mt-2 text-body break-words line-clamp-4">{blockLabel(chosen)}</p>{isCaptureBlock(chosen) && <p className="mt-2 text-caption"><strong>{answerGuide(chosen).title}</strong> · {answerGuide(chosen).parts.join(' · ')}</p>}<p className="mt-2 text-caption text-muted-foreground">{['graph','figure','diagram'].includes(chosen.type) ? 'Whole visual · one screen · no splitting' : `${projectedBlockPages(chosen).length} projector screen${projectedBlockPages(chosen).length === 1 ? '' : 's'}`}</p></> : <p className="text-muted-foreground">Choose a block to review its content before students see it.</p>}</div>
        {overlay && <p role="status" className="text-sm">{overlay}. Close the activity or show the screen before projecting lesson content.</p>}
        <Button className="min-h-14 w-full" disabled={busy || !chosen || Boolean(overlay)} onClick={() => patch({ projected_block_id: choice, blackout: false })}><ArrowUpRight aria-hidden size={18} />Project lesson block</Button>
      </div>
  </Card>
}
