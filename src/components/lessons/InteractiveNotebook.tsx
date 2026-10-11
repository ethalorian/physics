'use client'

import { useEffect, useRef, useState } from 'react'
import type { QuestionBlock } from '@/data/content-blocks'
import type { BlockResponseMap, DraftFn, SaveMeta } from '@/components/blocks/useBlockResponses'
import { notebookAnswers, notebookAnswerChanges, UNITS_NOTEBOOK_SOURCE } from '@/lib/interactive-notebook'
import { connectNotebookFrame } from '@/lib/notebook-frame'
import { Button } from '@/components/ui/button'

interface Props {
  questions: QuestionBlock[]
  responses: BlockResponseMap
  draft: DraftFn
  save: (id: string, type: string, response: unknown, meta?: SaveMeta) => Promise<boolean>
  readOnly: boolean
  draftState: string
}

export default function InteractiveNotebook(props: Props) {
  const frame = useRef<HTMLIFrameElement>(null), cleanup = useRef<() => void>(() => {})
  const latest = useRef(props)
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0)
  const [saving, setSaving] = useState(false), [message, setMessage] = useState(''), [saveError, setSaveError] = useState('')
  const busy = useRef(false)
  latest.current = props
  useEffect(() => () => cleanup.current(), [])
  useEffect(() => { setReady(false); setFailed(false); const timer = setTimeout(() => setFailed(true), 20000); return () => clearTimeout(timer) }, [retry])
  const answers = notebookAnswers(props.questions, props.responses)
  const changed = props.questions.filter(question => props.responses[question.id]?.draft)
  const saved = props.questions.filter(question => props.responses[question.id] && !props.responses[question.id].draft).length

  function connect() {
    cleanup.current()
    if (!frame.current) return
    cleanup.current = connectNotebookFrame(frame.current, {
      read: () => notebookAnswers(latest.current.questions, latest.current.responses),
      writable: () => !latest.current.readOnly && !busy.current,
      changed: values => {
        const { questions, responses, draft } = latest.current
        for (const change of notebookAnswerChanges(questions, responses, values)) draft(change.blockId, 'question', change.response)
        setSaveError('')
      },
      ready: () => { setReady(true); setFailed(false) },
      link: () => setMessage('Related explainers are outside this assignment. Your answers stay with this lesson; use Back to lessons to choose another lesson.'),
    })
  }
  async function saveAnswers() {
    if (busy.current || props.readOnly) return
    busy.current = true; setSaving(true); setSaveError('')
    try {
      for (const question of changed) {
        if (!await props.save(question.id, 'question', props.responses[question.id].response, { response_mode: 'choice' })) throw new Error('Some answers could not be saved. Your draft is kept. Retry when you are connected.')
      }
    } catch (error) { setSaveError(error instanceof Error ? error.message : 'Could not save answers. Please retry.') }
    finally { busy.current = false; setSaving(false) }
  }
  return <section aria-label="Interactive units notebook" className="min-w-0">
    <div className="flex flex-wrap items-center justify-between gap-3 border-y bg-card px-4 py-3">
      <div><p className="text-sm font-medium" role="status">{Object.keys(answers).length} of {props.questions.length} questions answered · {saved} saved</p><p className="mt-1 text-xs text-muted-foreground">{props.readOnly ? 'Read-only lesson work' : props.draftState === 'offline' ? 'Offline — drafts are kept on this device. Reconnect before submitting.' : changed.length ? 'Answers are kept as drafts. Save them here or submit the lesson below.' : 'Explore the examples, answer the checks, then finish your reflection below.'}</p></div>
      {!props.readOnly && <Button onClick={() => void saveAnswers()} disabled={!ready || saving || changed.length === 0}>{saving ? 'Saving answers…' : 'Save answers'}</Button>}
    </div>
    {message && <p role="status" className="p-3 text-sm">{message}</p>}
    {saveError && <p role="alert" className="p-3 text-sm text-destructive">{saveError}</p>}
    {!ready && <div className="p-5" role="status">{failed ? <><p>The notebook did not load. Your saved answers are still available in the question list below.</p><Button className="mt-3" variant="outline" onClick={() => setRetry(value => value + 1)}>Retry notebook</Button></> : 'Loading your notebook and saved answers…'}</div>}
    <iframe key={retry} ref={frame} title="Units and dimensions · interactive lesson" src={encodeURI(UNITS_NOTEBOOK_SOURCE.src)} onLoad={connect} onError={() => setFailed(true)} tabIndex={ready ? 0 : -1} style={{ display: 'block', width: '100%', height: '82dvh', minHeight: 540, border: 0, visibility: ready ? 'visible' : 'hidden', pointerEvents: ready ? 'auto' : 'none' }} />
  </section>
}
