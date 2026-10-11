'use client'
import {useId,useRef,useState} from 'react'
import type {QuizCard} from '@/lib/quizzes/types'
import {quizFetch} from './shared'
import s from './Quiz.module.css'

export default function QuizArchive({quiz,disabled,onChanged}:{quiz:Pick<QuizCard,'id'|'title'|'version'|'status'>;disabled?:boolean;onChanged:()=>Promise<void>}) {
  const dialog=useRef<HTMLDialogElement>(null),title=useId(),description=useId()
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  const archived=quiz.status==='archived'
  async function save(){
    if(busy)return
    setBusy(true);setError('')
    try {await quizFetch(`/api/quizzes/${quiz.id}`,{action:archived?'reopen':'archive',version:quiz.version});dialog.current?.close();await onChanged()}
    catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  return <><button type="button" className={s.secondary} disabled={disabled||busy} onClick={()=>{setError('');dialog.current?.showModal()}}>{archived?'Restore & reopen':'Archive quiz'}</button>
    <dialog ref={dialog} className={s.deleteDialog} aria-labelledby={title} aria-describedby={description} onCancel={e=>{if(busy)e.preventDefault()}}><div className={s.stack}>
      <h2 id={title}>{archived?'Restore and reopen this quiz?':'Archive this quiz?'}</h2><strong>{quiz.title}</strong>
      <p id={description}>{archived?'This quiz returns to the active list and students can submit again. The original due date stays in place.':'This removes the quiz from the active list and closes new submissions. Student work, grades, and feedback stay available. Find it under Archived to restore it. Copies in other sections are unchanged.'}</p>
      {error&&<p role="alert" className={s.error}>{error}</p>}
      <div className={s.actions}><button type="button" className={s.secondary} autoFocus disabled={busy} onClick={()=>dialog.current?.close()}>Cancel</button><button type="button" className={s.button} disabled={busy} onClick={()=>void save()}>{busy?'Saving…':archived?'Restore & reopen':'Archive quiz'}</button></div>
    </div></dialog>
  </>
}
