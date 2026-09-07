'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { PULSE_OPTIONS, uncalledStudents, type TeachingStudent, type ToolsState } from '@/lib/presentation-tools'
import type { LiveCommandState } from '@/lib/classroom-command'

interface Props {
  live: LiveCommandState
  state: ToolsState
  busy: boolean
  action: (body: Record<string, unknown>) => Promise<{ state: ToolsState; selected?: TeachingStudent } | null>
  patch: (body: Record<string, unknown>) => Promise<boolean>
}
export default function TeachingTools({ live, state, busy, action, patch }: Props) {
  const [showAllNeeds, setShowAllNeeds] = useState(false)
  const [anonymous, setAnonymous] = useState(true)
  const [picked, setSelected] = useState<TeachingStudent | null>(null)
  const selected = picked ?? state.roster.find(s => s.id === state.marks.find(m => m.kind === 'called')?.student_id) ?? null
  const [note, setNote] = useState('')
  const [studentId, setStudentId] = useState('')
  const [notice, setNotice] = useState('')
  const remaining = uncalledStudents(state.roster, state.marks).length
  const bookmarks = state.marks.filter(m => m.kind === 'bookmark')
  async function pick(skip = false) {
    const result = await action({ action: skip ? 'skip_pick' : 'pick', student_id: skip ? selected?.id : undefined })
    if (result?.selected) setSelected(result.selected)
  }
  async function bookmark(text: string) {
    if (await action({ action: 'bookmark', note: text, student_id: studentId || null })) { setNote(''); setNotice('Private bookmark saved to the recap.') }
  }
  function exportRecap() {
    const text = ['Teaching recap', ...bookmarks.map(m => `Slide ${m.slide + 1}${m.student_id ? ` · ${state.roster.find(s => s.id === m.student_id)?.name ?? 'Student'}` : ''}: ${m.note}`)].join('\n')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const link = document.createElement('a'); link.href = url; link.download = 'teaching-recap.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <div className="space-y-4">
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <Card id="help-queue" className="min-w-0 gap-3 p-4 scroll-mt-20"><h2 className="text-title-2">Who needs me?</h2><p className="text-caption text-muted-foreground">Private to you. Missing responses are check-in prompts, not evidence of low mastery.</p>
        {state.needs.length ? (showAllNeeds ? state.needs : state.needs.slice(0, 5)).map(student => {
          const query = new URLSearchParams({ student: student.id, class: live.session.course_id })
          if (state.targetId) query.set('target', state.targetId)
          return <div key={student.id} className="rounded-xl border p-3"><div className="font-semibold">{student.name}</div><p className="text-caption text-muted-foreground">{student.reasons.join(' · ')}</p><div className="mt-2 flex flex-wrap gap-2"><Button asChild variant="outline" className="min-h-12"><Link href={`/admin/observe?${query}`} target="_blank">Observe {student.name}</Link></Button>{student.requestedAt && <Button variant="outline" className="min-h-12" disabled={busy} onClick={() => action({ action: 'resolve_help', student_id: student.id })}>Help given</Button>}</div></div>
        }) : <p>No help requests or response gaps right now.</p>}{state.needs.length > 5 && <Button variant="outline" className="min-h-12" onClick={() => setShowAllNeeds(v => !v)}>{showAllNeeds ? 'Show fewer' : `Show all ${state.needs.length} students`}</Button>}
      </Card>
      <Card id="pulse-checks" className="min-w-0 gap-3 p-4 scroll-mt-20"><h2 className="text-title-2">Quick pulse check</h2><label className="flex min-h-12 items-center gap-3"><input type="checkbox" checked={anonymous} disabled={busy || state.pulse?.status === 'open'} onChange={e => setAnonymous(e.target.checked)} className="h-6 w-6" />Anonymous totals only</label><p className="text-caption text-muted-foreground">Anonymous checks never add names or missing-response flags to the help queue.</p>
        {state.pulse?.status === 'open' ? <><p className="font-semibold">{state.pulse.kind === 'readiness' ? 'Readiness' : 'Confidence'} · {state.pulse.anonymous ? 'anonymous' : 'named'}</p>{PULSE_OPTIONS[state.pulse.kind].map((label,i) => <div key={label} className="flex justify-between rounded-lg bg-muted p-3"><span>{label}</span><span>{state.pulse?.tally?.[i] ?? 0}</span></div>)}<p>{state.pulse.saved ?? 0} responses</p><Button className="min-h-12" disabled={busy} onClick={() => action({ action: 'close_pulse' })}>Close pulse check</Button></> : <div className="flex flex-wrap gap-2"><Button className="min-h-14 flex-1" disabled={busy || Boolean(live.session.poll_block_id || live.lobby)} onClick={() => action({ action: 'pulse', kind: 'readiness', anonymous })}>Ready / Almost / Need help</Button><Button variant="outline" className="min-h-14 flex-1" disabled={busy || Boolean(live.session.poll_block_id || live.lobby)} onClick={() => action({ action: 'pulse', kind: 'confidence', anonymous })}>Confidence check</Button></div>}
        {(live.session.poll_block_id || live.lobby) && <p className="text-caption">Close the current poll or lobby before launching a pulse check.</p>}
      </Card>
    </div>
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <Card id="student-picker" className="min-w-0 gap-3 p-4 scroll-mt-20"><h2 className="text-title-2">Fair student picker</h2><p>{remaining} of {state.roster.length} students haven’t had a turn this session.</p>{selected && <p role="status" className="text-title-1">{selected.name}</p>}<div className="flex flex-wrap gap-2"><Button className="min-h-14" disabled={busy || !remaining} onClick={() => pick()}>Pick a student</Button><Button variant="outline" className="min-h-14" disabled={busy || !selected || !remaining} onClick={() => pick(true)}>Skip & pick next</Button><Button variant="outline" className="min-h-14" disabled={busy} onClick={() => patch({ timer_seconds: 60 })}>Think-pair-share · 1 min</Button></div><p className="text-caption text-muted-foreground">Names stay on your iPad. Skipping keeps that student out of this round.</p></Card>
      <Card id="teaching-bookmarks" className="min-w-0 gap-3 p-4 scroll-mt-20"><h2 className="text-title-2">Private teaching bookmarks</h2><label className="text-caption">Student (optional)<select disabled={busy} aria-label="Bookmark student" value={studentId} onChange={e => setStudentId(e.target.value)} className="min-h-12 w-full rounded-xl border bg-background px-3 text-base"><option value="">This lesson / slide</option>{state.roster.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><div className="flex flex-wrap gap-2">{['Revisit this', 'Great explanation', 'Follow up with this student'].map(text => <Button key={text} variant="outline" className="min-h-12" disabled={busy || (text.startsWith('Follow up') && !studentId)} onClick={() => bookmark(text)}>{text}</Button>)}</div><Textarea disabled={busy} aria-label="Private bookmark note" maxLength={1000} value={note} onChange={e => setNote(e.target.value)} placeholder="A detail to remember after class…" className="min-h-24 text-base" /><Button className="min-h-12" disabled={busy || !note.trim()} onClick={() => bookmark(note)}>Save private note</Button>{notice && <p role="status">{notice}</p>}</Card>
    </div>
    <Card className="gap-3 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-title-2">End-of-class recap</h2><Button variant="outline" className="min-h-12" disabled={!bookmarks.length} onClick={exportRecap}>Download recap</Button></div>{bookmarks.length ? bookmarks.map(m => <div key={m.id} className="rounded-xl border p-3"><p className="text-caption text-muted-foreground">Slide {m.slide + 1}{m.student_id ? ` · ${state.roster.find(s => s.id === m.student_id)?.name ?? 'Student'}` : ''}</p><p className="whitespace-pre-wrap">{m.note}</p></div>) : <p>Your private bookmarks will appear here and remain saved after class.</p>}</Card>
  </div>
}
