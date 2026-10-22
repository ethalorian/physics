'use client'

import { useMemo, useState, type ReactNode } from 'react'
import type { BlockDocument, ExitTicketBlock } from '@/data/content-blocks'
import type { BlockResponseMap, DraftFn, SaveMeta } from '@/components/blocks/useBlockResponses'
import AssignmentWorkspace from '@/components/interactive-assignments/AssignmentWorkspace'
import { QuestionPrompt, WrittenResponse } from '@/components/interactive-assignments/QuestionResponse'
import ProblemStageInput from '@/components/blocks/ProblemStageInput'
import { NOVEL_BOOK, graphicNovelWorkspace, novelResponseText, editNovelResponse, novelDrawingResponse } from '@/lib/graphic-novel-assignments'
import s from '@/components/interactive-assignments/assignment.module.css'

export default function GraphicNovelAssignment({ id, title, document, responses, draft, save, readOnly, submitted, preview, draftState, toolbar, feedback, footer }: {
  id: string; title: string; document: BlockDocument; responses: BlockResponseMap; draft: DraftFn
  save: (id: string, type: string, response: unknown, meta?: SaveMeta) => Promise<boolean>
  readOnly: boolean; submitted: boolean; preview: boolean; draftState: string
  toolbar: ReactNode; feedback?: string; footer: ReactNode
}) {
  const lesson = useMemo(() => graphicNovelWorkspace(document, title, id), [document, title, id])
  const questions = document.blocks.filter((b): b is ExitTicketBlock => b.type === 'exit_ticket')
  const answers = Object.fromEntries(questions.map(q => [q.id, novelResponseText(responses[q.id]?.response)]))
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')
  return <main className={`${s.page} ${s.assignmentPage} space-y-4 pb-16`} data-graphic-novel-workspace>
    <header className="space-y-3 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">{toolbar}</div>
      <p className="text-sm font-semibold text-primary">2026-XJ · Chapter {lesson.day}</p>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p>Read the chapter. Answer {questions.length} question{questions.length === 1 ? '' : 's'}. Use a scene or panel as evidence.</p>
      {preview && <p role="status" className="text-sm text-muted-foreground">Teacher preview · no student work is changed.</p>}
      {submitted && <p role="status" className="text-sm font-medium">Submitted for teacher review.</p>}
      {!preview && !readOnly && <p role="status" className="text-sm text-muted-foreground">{draftState === 'offline' ? 'Draft could not sync. Keep this page open and try saving again.' : draftState === 'saving' ? 'Saving draft…' : 'Save your answers, then submit your work.'}</p>}
      {feedback && <section aria-label="Teacher feedback" className="rounded-xl border bg-card p-4"><h2 className="font-semibold">Teacher feedback</h2><p className="whitespace-pre-wrap">{feedback}</p></section>}
    </header>
    <AssignmentWorkspace lesson={lesson} answers={answers} submitted={submitted} resourceLabel="Read" sampleStudent={preview}
      renderTool={() => <ChapterPages key={lesson.day} chapter={lesson.day}/> }>
      <section id="assignment-part-1" tabIndex={-1} className={s.part} aria-labelledby="novel-work-title">
        <h2 id="novel-work-title">Explain your thinking</h2>
        {questions.map((q, index) => {
          const value = responses[q.id]?.response
          const drawing = novelDrawingResponse(value)
          const disabled = readOnly || saving === q.id
          return <div className={s.question} key={q.id}>
            <p className="mb-2 text-sm font-semibold">Question {index + 1}</p>
            <QuestionPrompt>{q.prompt}</QuestionPrompt>
            {drawing.strokes.length ? <ProblemStageInput label={`Your reasoning for question ${index + 1}`} help="Use a scene or panel as evidence." value={drawing} disabled={disabled} onChange={next => { const nextValue = novelDrawingResponse(next); draft(q.id, q.type, { ...nextValue, mode: nextValue.mode === 'drawing' ? 'sketch' : 'text' }) }}/> : <WrittenResponse id={`answer-${q.id}`} label={`Your reasoning for question ${index + 1}`} value={answers[q.id]} maxLength={10000} disabled={disabled} onChange={text => draft(q.id, q.type, editNovelResponse(value, text))}/>}
            {!!q.sei?.frames?.length && <details className="mt-3 text-sm"><summary className="cursor-pointer py-2">Need a starting sentence?</summary>{q.sei.frames.map((frame, i) => <p key={i} className="py-1">{frame.text}</p>)}</details>}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {!readOnly && <button type="button" className="min-h-11 rounded-lg border px-4 text-sm font-medium disabled:opacity-50" disabled={!!saving || (!answers[q.id]?.trim() && !drawing.strokes.length)} onClick={async () => {
                setSaving(q.id); setError('')
                try { if (!await save(q.id, q.type, value, { response_mode: drawing.mode === 'drawing' ? 'sketch' : 'text', target_id: q.targetId, evidence_source: 'exit_ticket' })) setError('Your answer could not be saved. Try again before submitting.') }
                catch { setError('Your answer could not be saved. Try again before submitting.') }
                finally { setSaving(null) }
              }}>{saving === q.id ? 'Saving…' : `Save answer ${index + 1}`}</button>}
              <span className="text-sm text-muted-foreground">{responses[q.id] && !responses[q.id].draft ? 'Answer saved' : 'Reviewed by your teacher after submission'}</span>
            </div>
          </div>
        })}
        {error && <p role="alert" className="text-destructive">{error}</p>}
      </section>
      <section id="assignment-submit" tabIndex={-1} className="mt-5">{footer}</section>
    </AssignmentWorkspace>
  </main>
}

function ChapterPages({ chapter }: { chapter: number }) {
  const info = NOVEL_BOOK.chapters.find(c => c.day === chapter)!
  const [page, setPage] = useState(info.start)
  const art = NOVEL_BOOK.pages[page]
  return <section id="assignment-teaching-tool" className="overflow-hidden rounded-xl border bg-card" aria-label={`Read chapter ${chapter}`}>
    <header className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
      <h2 className="font-semibold">{info.title}</h2>
      <nav className="flex items-center gap-3" aria-label="Chapter pages">
        <button type="button" className="min-h-11 rounded-lg border px-3 disabled:opacity-50" disabled={page === info.start} onClick={() => setPage(p => p - 1)} aria-label="Previous chapter page">←</button>
        <span className="text-sm" aria-live="polite">Page {page - info.start + 1} of {info.end - info.start + 1}</span>
        <button type="button" className="min-h-11 rounded-lg border px-3 disabled:opacity-50" disabled={page === info.end} onClick={() => setPage(p => p + 1)} aria-label="Next chapter page">→</button>
      </nav>
    </header>
    {/* Approved comic artwork, displayed once beside the assignment. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="h-auto w-full" src={art.src} alt={art.description} width={1024} height={1536}/>
    <details className="border-t p-4"><summary className="min-h-11 cursor-pointer text-sm font-medium">Read this page as text</summary>{art.text.map((text, i) => <p className="my-3 text-sm" key={i}>{text}</p>)}</details>
  </section>
}
