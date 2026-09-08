'use client'
import { useState } from 'react'
import { BookOpen, MonitorPlay, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { ContentBlock } from '@/data/content-blocks'
import type { CommandLesson, LiveCommandState } from '@/lib/classroom-command'
import { projectedBlockPages } from '@/lib/projected-block'

export function blockLabel(block: ContentBlock): string {
  const values = block as unknown as Record<string, unknown>
  const question = values.question as { prompt?: string } | undefined
  const text = ['title', 'statement', 'markdown', 'instruction', 'prompt', 'patternPrompt', 'frame', 'connection'].map(key => values[key]).find(value => typeof value === 'string' && value.trim())
  return String(text ?? question?.prompt ?? block.type.replaceAll('_', ' ')).replace(/[#*_`]/g, '').trim()
}

export default function ProjectionPanel({ lesson, live, slideLabel, pulseOpen, busy, patch, returnToDeck }: {
  lesson: CommandLesson; live: LiveCommandState; slideLabel?: string; pulseOpen: boolean; busy: boolean
  patch: (body: Record<string, unknown>) => Promise<boolean>; returnToDeck: () => void
}) {
  const [choice, setChoice] = useState('')
  const [search, setSearch] = useState('')
  const blocks = lesson.content_blocks.blocks.filter(b => b.type !== 'deck')
  const chosen = blocks.find(b => b.id === choice)
  const projected = blocks.find(b => b.id === live.session.projected_block_id)
  const part = live.session.projected_block_page ?? 0
  const count = projected ? projectedBlockPages(projected).length : 1
  const overlay = live.session.blackout ? 'Screen blanked' : live.lobby ? 'Group lobby' : pulseOpen ? 'Pulse check' : live.session.poll_block_id ? 'Live poll' : null
  const filtered = blocks.filter(b => b.id === choice || `${b.type} ${blockLabel(b)}`.toLowerCase().includes(search.toLowerCase()))
  return <Card id="projector-controls" className="overflow-hidden gap-0 scroll-mt-44">
    <div className="grid md:grid-cols-2">
      <div className="flex flex-col justify-between gap-6 bg-primary/5 p-5 sm:p-6">
        <div><p className="text-overline text-primary">Selected for the classroom screen</p><div className="my-4 flex items-center gap-2">{projected ? <BookOpen aria-hidden className="text-primary" /> : <MonitorPlay aria-hidden className="text-primary" />}<h2 className="text-title-2">{overlay ?? (projected ? 'Lesson block' : 'Lesson deck')}</h2></div><p className="text-title-3 break-words">{overlay ? live.lobby ? `Join code · ${live.lobby.code}` : 'Class activity is covering the lesson view.' : projected ? blockLabel(projected).slice(0, 180) : slideLabel ?? lesson.title}</p><p className="mt-3 text-caption text-muted-foreground">{projected ? `Block from this lesson · ${count > 1 ? `screen ${part + 1} of ${count}` : 'fits one screen'}` : `Deck slide ${live.session.current_slide + 1}`}</p>{overlay && <p className="mt-3 text-caption">{live.session.blackout ? 'Use Show screen in Deck controls to resume.' : 'Close the activity to reveal your selected deck or block.'}</p>}</div>
        <div className="rounded-xl border bg-background p-4"><p className="text-overline text-muted-foreground">Student follow-along</p><p className="mt-2 text-body">{projected ? 'Students in Follow mode move to this block’s lesson section.' : 'Mapped slides guide students through the lesson. You can project a block whenever you need it.'}</p></div>
        {projected && <div className="flex flex-wrap items-center gap-2"><Button variant="outline" className="min-h-12" disabled={busy} onClick={returnToDeck}>Return to deck · slide {live.session.current_slide + 1}</Button>{count > 1 && <><Button aria-label="Previous block screen" className="min-h-12" disabled={busy || part === 0} onClick={() => patch({ projected_block_page: part - 1 })}>Previous</Button><Button aria-label="Next block screen" className="min-h-12" disabled={busy || part >= count - 1} onClick={() => patch({ projected_block_page: part + 1 })}>Next</Button></>}</div>}
      </div>
      <div className="min-w-0 space-y-4 p-5 sm:p-6"><div><h3 className="text-title-3">Bring a lesson block to the screen</h3><p className="mt-1 text-caption text-muted-foreground">Choose from {lesson.title}. Your deck stays on its current slide.</p></div><label className="block text-caption">Find a block<input className="mt-1 min-h-12 w-full rounded-xl border bg-background px-3 text-base" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search a prompt, graph, or activity" /></label><label className="block text-caption">Lesson block<select aria-label="Lesson block to project" className="mt-1 min-h-12 w-full min-w-0 rounded-xl border bg-background px-3 text-base" value={choice} onChange={e => setChoice(e.target.value)}><option value="">Choose a block…</option>{filtered.map(b => <option key={b.id} value={b.id}>{blocks.indexOf(b) + 1}. {b.type.replaceAll('_', ' ')} · {blockLabel(b).slice(0, 90)}</option>)}</select></label>
        <div className="min-h-28 rounded-xl border border-dashed p-4">{chosen ? <><p className="text-overline text-primary">Ready to project · {chosen.type.replaceAll('_', ' ')}</p><p className="mt-2 text-body break-words line-clamp-4">{blockLabel(chosen)}</p><p className="mt-2 text-caption text-muted-foreground">{['graph','figure','diagram'].includes(chosen.type) ? 'Whole visual · one screen · no splitting' : `${projectedBlockPages(chosen).length} projector screen${projectedBlockPages(chosen).length === 1 ? '' : 's'}`}</p></> : <p className="text-muted-foreground">Choose a block to review its content before students see it.</p>}</div>
        <Button className="min-h-14 w-full" disabled={busy || !chosen} onClick={() => patch({ projected_block_id: choice, blackout: false })}><ArrowUpRight aria-hidden size={18} />Project lesson block</Button>
      </div>
    </div>
  </Card>
}
