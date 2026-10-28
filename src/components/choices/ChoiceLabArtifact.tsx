'use client'
import RevisionCycle from '@/components/review-desk/RevisionCycle'
import { useRef, useState } from 'react'
import type { ChoiceOption, ChoiceSelection } from '@/lib/choice-calendar'
import { MAX_ARTIFACT_BYTES } from '@/lib/lesson-artifacts'
import type { ChoiceAction } from './ChoiceTeacher'

export function LabArtifactReview({ selection }: { selection?: ChoiceSelection }) {
  return <details className="mt-2 text-sm"><summary className="cursor-pointer py-2">{selection?.artifact_submitted_at ? 'View submitted lab work' : selection?.artifact_version ? 'View lab draft' : 'Lab artifact not submitted'}</summary>
    {selection?.artifact_response?.text && <p className="max-w-lg whitespace-pre-wrap break-words py-2">{selection.artifact_response.text}</p>}
    {selection?.artifact_response?.fileId && <a className="inline-flex min-h-11 items-center underline" target="_blank" rel="noopener noreferrer" href={'/api/choice-calendar/artifacts?id=' + selection.artifact_response.fileId}>Open {selection.artifact_response.fileName ?? 'lab file'}</a>}
  </details>
}
export default function ChoiceLabArtifact({ sectionId, option, selection, userId, disabled, save }: {
  sectionId: string; option: ChoiceOption; selection?: ChoiceSelection; userId: string; disabled: boolean; save: ChoiceAction
}) {
  const [text, setText] = useState(selection?.artifact_response?.text ?? ''), [file, setFile] = useState<{id: string; name: string} | null>(selection?.artifact_response?.fileId ? { id: selection.artifact_response.fileId, name: selection.artifact_response.fileName ?? 'Lab file' } : null)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), flight = useRef(false)
  const submitted = !!selection?.artifact_submitted_at, locked = disabled || busy || submitted || !selection?.selected
  const persist = (submit: boolean, upload = file) => save({ action: 'save-lab-artifact', section_id: sectionId, option_id: option.id, version: selection?.artifact_version ?? 0, text, file_id: upload?.id ?? null, submit })
  async function upload(selected?: File) {
    if (!selected || locked || flight.current) return
    setError('')
    if (!selected.size || selected.size > MAX_ARTIFACT_BYTES) { setError('Choose a photo or PDF smaller than 4 MB.'); return }
    flight.current = true; setBusy(true)
    try {
      const form = new FormData(); form.set('file', selected); form.set('section_id', sectionId); form.set('option_id', option.id); form.set('expected_user_id', userId)
      const response = await fetch('/api/choice-calendar/artifacts', { method: 'POST', body: form }), data = await response.json()
      if (!response.ok) throw Error(data.error ?? 'Upload failed. Please retry.')
      setFile(data)
      if (!await persist(false, data)) setError('Your file uploaded. Choose Save draft to attach it to your work.')
    } catch (e) { setError((e as Error).message) } finally { flight.current = false; setBusy(false) }
  }
  return <section className="space-y-3 rounded-xl border bg-card p-4" aria-label="Your lab artifact">
    <RevisionCycle sourceKey={'choice:'+sectionId+':'+option.id}/>
    <h4 className="font-semibold">Turn in</h4><p>{option.artifactInstructions}</p>
    <p className="text-sm text-muted-foreground">{submitted ? 'Submitted. Your teacher will review your work.' : 'Submit your own work. Type a response or upload a photo/PDF.'}</p>
    {!selection?.selected && <p className="text-sm">Choose this lab to begin.</p>}
    <label className="block text-sm">Your response<textarea className="mt-2 block w-full rounded-lg border bg-background p-3" rows={5} maxLength={30000} disabled={locked} value={text} onChange={e => setText(e.target.value)}/></label>
    {file && <a className="inline-flex min-h-11 items-center underline" target="_blank" rel="noopener noreferrer" href={'/api/choice-calendar/artifacts?id=' + file.id}>Open {file.name}</a>}
    {!submitted && <><label className="block text-sm">{file ? 'Replace file' : 'Upload file'}<input className="mt-2 block w-full rounded-lg border p-2" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={locked} onChange={e => { void upload(e.target.files?.[0]); e.target.value = '' }}/><span className="text-muted-foreground">Photo or PDF · up to 4 MB</span></label><div className="flex flex-wrap gap-3"><button className="min-h-11 rounded-lg border px-4 disabled:opacity-50" disabled={locked || !text.trim() && !file} onClick={() => void persist(false)}>Save draft</button><button className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground disabled:opacity-50" disabled={locked || !text.trim() && !file} onClick={() => void persist(true)}>Submit lab work</button></div></>}
    {selection?.lab_completed_at && !submitted && <p className="text-sm">Lab session complete. Submit your artifact to finish this choice.</p>}
    {submitted && !selection?.lab_completed_at && <p className="text-sm">Artifact submitted. Your teacher still needs to mark the lab session complete.</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>
}
