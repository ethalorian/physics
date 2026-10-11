'use client'

import {useId, useRef, useState} from 'react'
import {Trash2, Undo2} from 'lucide-react'
import {quizFetch} from './shared'
import s from './Quiz.module.css'

export type DeletedQuizDraft = {id: string; title: string; version: number}

export default function QuizDeleteDraft({quiz, disabled, onDeleted}: {
  quiz: DeletedQuizDraft; disabled?: boolean; onDeleted: (draft: DeletedQuizDraft) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null), titleId = useId(), descriptionId = useId()
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  async function remove() {
    if (busy) return
    setBusy(true); setError('')
    try {
      const result = await quizFetch<DeletedQuizDraft>(`/api/quizzes/${quiz.id}/draft`, {action: 'delete', version: quiz.version})
      dialog.current?.close(); onDeleted(result)
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }
  return <>
    <button type="button" className={s.secondary} disabled={disabled || busy} onClick={() => {setError(''); dialog.current?.showModal()}}><Trash2 size={16}/>Delete draft</button>
    <dialog ref={dialog} className={s.deleteDialog} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={e => {if (busy) e.preventDefault()}}>
      <div className={s.stack}>
        <h2 id={titleId}>Delete this draft?</h2>
        <p className={s.draftTitle}>{quiz.title || 'Untitled quiz'}</p>
        <p id={descriptionId}>This removes the draft from your quiz library. Copies assigned to other sections stay available. You can undo this after deleting.</p>
        {error && <p role="alert" className={s.error}>{error}</p>}
        <div className={s.actions}>
          <button type="button" className={s.secondary} disabled={busy} autoFocus onClick={() => dialog.current?.close()}>Keep draft</button>
          <button type="button" className={`${s.button} ${s.deleteButton}`} disabled={busy} onClick={() => void remove()}>{busy ? 'Deleting…' : 'Delete draft'}</button>
        </div>
      </div>
    </dialog>
  </>
}

export function QuizDraftDeletedNotice({draft, onRestored}: {draft: DeletedQuizDraft; onRestored: () => void}) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  async function restore() {
    if (busy) return
    setBusy(true); setError('')
    try { await quizFetch(`/api/quizzes/${draft.id}/draft`, {action: 'restore', version: draft.version}); onRestored() }
    catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }
  return <div className={`${s.notice} mb-4`}>
    <div className={s.row}><p role="status">Draft deleted: <strong>{draft.title}</strong></p><button type="button" className={s.secondary} disabled={busy} onClick={() => void restore()}><Undo2 size={16}/>{busy ? 'Restoring…' : 'Undo delete'}</button></div>
    {error && <p role="alert" className={s.error}>{error}</p>}
  </div>
}
