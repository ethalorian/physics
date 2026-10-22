'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { BlockDocument } from '@/data/content-blocks'
import type { BlockResponseMap } from '@/components/blocks/useBlockResponses'
import { validateBlockDocument } from '@/data/block-registry'
import GraphicNovelSettings from './GraphicNovelSettings'
import ReflectionLessonSettings from './ReflectionLessonSettings'
import LessonSaveConflict from './LessonSaveConflict'
import LessonEditorNav from './LessonEditorNav'
import GraphicNovelAssignment from '@/components/lessons/GraphicNovelAssignment'

export default function LessonAssignmentBuilder({ lesson, targets, canPublish }: {
  lesson: { id: string; title: string; unit_id: string; lesson_number: number; published: boolean; updated_at: string | null; content_blocks: BlockDocument }
  targets: { id: string; slug: string; statement: string }[]; canPublish: boolean
}) {
  const router = useRouter()
  const [doc, setDoc] = useState(lesson.content_blocks)
  const [version, setVersion] = useState(lesson.updated_at)
  const [published, setPublished] = useState(lesson.published)
  const [saved, setSaved] = useState(JSON.stringify(lesson.content_blocks))
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [conflict, setConflict] = useState<unknown>(null)
  const [preview, setPreview] = useState(false)
  const [answers, setAnswers] = useState<BlockResponseMap>({})
  const dirty = JSON.stringify(doc) !== saved
  useEffect(() => {
    if (!dirty) return
    const unload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    const leave = (e: MouseEvent) => {
      const a = (e.target as Element)?.closest?.('a')
      if (a && a.target !== '_blank' && !a.getAttribute('href')?.startsWith('#') && !window.confirm('Leave without saving your assignment changes?')) { e.preventDefault(); e.stopPropagation() }
    }
    window.addEventListener('beforeunload', unload); document.addEventListener('click', leave, true)
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', leave, true) }
  }, [dirty])
  async function save(publish = false) {
    if (pending.current) return
    setError(''); setNotice('')
    const issues = validateBlockDocument(doc, publish || published)
    if (issues.length) { setError(issues.map(i => i.message).join(' ')); return }
    pending.current = true; setBusy(true)
    const sent = JSON.stringify(doc)
    try {
      const response = await fetch(`/api/lessons/${lesson.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content_blocks: doc, expected_updated_at: version, ...(publish ? { published: true } : {}) }) })
      const data = await response.json()
      if (!response.ok) { if (response.status === 409) setConflict(data.current); throw Error(data.error ?? 'Could not save this assignment.') }
      setVersion(data.lesson.updated_at); setPublished(data.lesson.published); setSaved(sent); setConflict(null)
      setNotice(publish ? 'Assignment published. Add it to your class sequence or calendar.' : 'Assignment saved.')
      router.refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save this assignment.') }
    finally { pending.current = false; setBusy(false) }
  }
  if (preview && doc.reflection?.kind === 'graphic-novel') return <GraphicNovelAssignment id={lesson.id} title={lesson.title} document={doc}
    responses={answers} draft={(id, type, response) => setAnswers(a => ({ ...a, [id]: { response, draft: true, created_at: new Date().toISOString() } }))}
    save={async (id, type, response) => { setAnswers(a => ({ ...a, [id]: { response, created_at: new Date().toISOString() } })); return true }}
    readOnly={false} submitted={false} preview draftState="idle" toolbar={<button className="min-h-11 underline" onClick={() => setPreview(false)}>← Back to assignment builder</button>}
    footer={<p className="rounded-xl border bg-card p-5 text-sm">Student preview · these answers are temporary. Submission is disabled.</p>}/>
  return <main className="mx-auto max-w-5xl p-4 sm:p-6">
    <LessonEditorNav lessonId={lesson.id} title={lesson.title} unitId={lesson.unit_id} day={lesson.lesson_number} published={published} active="build"/>
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Assignment builder</p><h2 className="text-2xl font-semibold">{doc.reflection?.kind === 'graphic-novel' ? 'Bloom’s & DOK reasoning' : 'Creative learning task'}</h2></div>
      {doc.reflection?.kind === 'graphic-novel' && <button type="button" className="min-h-11 rounded-lg border px-4" onClick={() => { setAnswers({}); setPreview(true) }}>Try student view</button>}
    </header>
    <form noValidate onSubmit={e => { e.preventDefault(); void save() }} className="space-y-5">
      <fieldset disabled={busy} className="space-y-5">
        {doc.reflection?.kind === 'graphic-novel' ? <GraphicNovelSettings document={doc} onChange={setDoc} targets={targets} published={published}/> : <>
          <ReflectionLessonSettings document={doc} onChange={setDoc} targets={targets}/>
          {doc.blocks.map(b => (b.type === 'exit_ticket' || b.type === 'sketch') && <label key={b.id} className="block text-sm font-medium">Student directions<textarea className="mt-2 block w-full rounded-lg border bg-background p-3" rows={3} value={b.type === 'sketch' ? b.instruction : b.prompt} onChange={e => setDoc({ ...doc, blocks: doc.blocks.map(x => x.id === b.id ? { ...b, ...(b.type === 'sketch' ? { instruction: e.target.value } : { prompt: e.target.value }) } : x) })}/></label>)}
        </>}
      </fieldset>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {notice && <p role="status" className="text-sm">{notice}</p>}
      {conflict != null && <LessonSaveConflict local={{ content_blocks: doc }} current={conflict}/>}
      <footer className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
        <button disabled={busy || !dirty} className="min-h-11 rounded-lg bg-primary px-4 font-medium text-primary-foreground disabled:opacity-50">{busy ? 'Saving…' : published ? 'Save changes' : 'Save draft'}</button>
        {!published && canPublish && <button type="button" disabled={busy} className="min-h-11 rounded-lg border px-4 font-medium disabled:opacity-50" onClick={() => void save(true)}>Publish assignment</button>}
        <span className="text-sm text-muted-foreground">{dirty ? 'Unsaved changes' : published ? 'Published' : 'Draft saved'}</span>
        <Link className="ml-auto inline-flex min-h-11 items-center text-sm underline" href={`/admin/control-room?view=plan&unit=${encodeURIComponent(lesson.unit_id)}`}>Build a sequence</Link>
      </footer>
    </form>
  </main>
}
