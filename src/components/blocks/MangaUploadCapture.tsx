'use client'
import { useContext, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { LessonReadingPreview } from '@/components/readings/LessonReadingContext'
import { MAX_ARTIFACT_BYTES, isArtifactResponseComplete, type ArtifactResponse } from '@/lib/lesson-artifacts'
import type { SketchBlock } from '@/data/content-blocks'
import { useDraft } from './useDraft'

type Receipt = { id: string; name: string; content_type: string }
export default function MangaUploadCapture({ block, lessonId, value, readOnly, onDraft, onSave }: {
  block: SketchBlock; lessonId: string; value: unknown; readOnly: boolean
  onDraft: (value: ArtifactResponse) => void; onSave: (value: ArtifactResponse) => Promise<unknown> | void
}) {
  const preview = useContext(LessonReadingPreview), session = useSession().data
  const initial = value as ArtifactResponse | undefined
  const [answer, setAnswer] = useState<ArtifactResponse>({ attachmentId: initial?.attachmentId, text: initial?.text ?? '' })
  const [receipt, setReceipt] = useState<Receipt | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState(false)
  const flight = useRef(false)
  useDraft(onDraft, answer)
  useEffect(() => {
    if (!answer.attachmentId) { setReceipt(null); return }
    const controller = new AbortController()
    fetch(`/api/lessons/artifacts?id=${encodeURIComponent(answer.attachmentId)}&metadata=1`, { signal: controller.signal }).then(async r => {
      const data = await r.json(); if (!r.ok) throw Error(data.error ?? 'Could not load the uploaded page.'); setReceipt(data)
    }).catch(e => { if (e.name !== 'AbortError') setError(e.message) })
    return () => controller.abort()
  }, [answer.attachmentId])
  async function upload(file?: File) {
    if (!file || readOnly || preview || flight.current) return
    setError(''); setSaved(false)
    if (!file.size || file.size > MAX_ARTIFACT_BYTES) { setError('Choose a photo or PDF smaller than 4 MB.'); return }
    flight.current = true; setBusy(true)
    try {
      const form = new FormData(); form.set('file', file); form.set('lesson_id', lessonId); form.set('block_id', block.id); form.set('expected_user_id', session?.user?.id ?? '')
      const response = await fetch('/api/lessons/artifacts', { method: 'POST', body: form }), data = await response.json()
      if (!response.ok) throw Error(data.error ?? 'Upload failed. Please try again.')
      setReceipt(data); setAnswer(old => ({ ...old, attachmentId: data.id }))
    } catch (e) { setError((e as Error).message) }
    finally { flight.current = false; setBusy(false) }
  }
  const captionRequired = block.captionRequired !== false
  const href = answer.attachmentId ? `/api/lessons/artifacts?id=${encodeURIComponent(answer.attachmentId)}` : ''
  return <div className="space-y-4">
    <p>{block.instruction}</p>
    {block.prompts && <ul className="list-disc space-y-1 pl-5 text-sm">{block.prompts.map(prompt => <li key={prompt}>{prompt}</li>)}</ul>}
    {receipt && <figure className="space-y-2 rounded-xl border bg-card p-3">
      {receipt.content_type.startsWith('image/') && /* eslint-disable-next-line @next/next/no-img-element */ <img src={href} alt="Your uploaded manga page" className="max-h-[40rem] w-full rounded-lg object-contain" />}
      <figcaption><a className="inline-flex min-h-11 items-center underline" href={href} target="_blank" rel="noopener noreferrer">{receipt.content_type === 'application/pdf' ? 'Download PDF' : 'Open uploaded page'} · {receipt.name}</a></figcaption>
    </figure>}
    {!readOnly && <label className="block text-sm">{answer.attachmentId ? 'Replace manga page' : 'Upload manga page'}
      <input className="mt-2 block min-h-11 w-full rounded-lg border bg-background p-2" type="file" accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf" disabled={busy || preview} onChange={e => { void upload(e.target.files?.[0]); e.target.value = '' }} />
      <span className="mt-1 block text-muted-foreground">JPEG, PNG, WebP, or PDF · up to 4 MB. Upload your page, then submit the assignment.</span>
    </label>}
    {preview && !readOnly && <p className="text-sm text-muted-foreground">Uploads are disabled in teacher preview. Students upload their own page here.</p>}
    {(captionRequired || !!answer.text) && <label className="block text-sm">Physics caption<textarea aria-label="Physics caption" className="mt-2 block w-full rounded-lg border bg-background p-3" rows={4} maxLength={10000} disabled={readOnly || busy} value={answer.text} onChange={e => { setAnswer(old => ({ ...old, text: e.target.value })); setSaved(false) }} placeholder="Explain the physics your page shows and where you see it in your life." /></label>}
    {!readOnly && <button type="button" className="min-h-11 rounded-lg border px-4 disabled:opacity-50" disabled={busy || !isArtifactResponseComplete(answer, captionRequired)} onClick={async () => {
      if (flight.current) return; flight.current = true; setBusy(true); setError('')
      try { const ok = await onSave(answer); setSaved(ok !== false) } catch { setError('Could not save. Your upload is kept. Please retry.') } finally { flight.current = false; setBusy(false) }
    }}>{busy ? 'Saving…' : captionRequired ? 'Save page and caption' : 'Save page'}</button>}
    {saved && <p role="status" className="text-sm">{captionRequired ? 'Page and caption saved.' : 'Page saved.'}</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>
}
