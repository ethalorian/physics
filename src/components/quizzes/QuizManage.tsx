'use client'
import {useEffect,useId,useRef,useState} from 'react'
import Link from 'next/link'
import type {QuizCard} from '@/lib/quizzes/types'
import {quizFetch,useQuizData} from './shared'
import QuizArchive from './QuizArchive'
import QuizDeleteDraft from './QuizDeleteDraft'
import QuizDueDateEditor from './QuizDueDateEditor'
import s from './Quiz.module.css'
import i from './QuizInventory.module.css'

interface Preview {id:string;title:string;version:number;status:string;deleted_at:string|null;fingerprint:string;impact:{work:number;submissions:number;reviews:number;reviewDrafts:number;copies:number;generations:number}}
export default function QuizManage({quiz,href,onChanged,onClose,onReuse,onDeleted,readOnly}:{quiz:QuizCard;href:string;onChanged:()=>Promise<void>;onClose:()=>void;onReuse:()=>void;onDeleted:()=>void;readOnly:boolean}) {
 const dialog=useRef<HTMLDialogElement>(null),heading=useId()
 const {data:preview,loading,error:loadError,load}=useQuizData<Preview>(`/api/quizzes/${quiz.id}/manage`)
 const [title,setTitle]=useState(quiz.title),[confirm,setConfirm]=useState(''),[deleting,setDeleting]=useState(false),[editingDue,setEditingDue]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 useEffect(()=>{const element=dialog.current;element?.showModal();return()=>element?.close()},[])
 async function refresh(){setConfirm('');await onChanged();await load()}
 async function act(action:'rename'|'delete'|'restore'){
  if(busy||readOnly||!preview)return
  setBusy(true);setError('');setNotice('')
  try{
   if(action==='restore')await quizFetch(`/api/quizzes/${quiz.id}/draft`,{action:'restore',version:preview.version})
   else await quizFetch(`/api/quizzes/${quiz.id}/manage`,{action,version:preview.version,title:action==='delete'?confirm:title.trim(),...(action==='delete'?{fingerprint:preview.fingerprint}:{})})
   if(action==='delete'){onDeleted();return}
   await refresh();setNotice(action==='rename'?'Quiz title saved.':'Draft restored.')
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 const blocked=busy||loading||readOnly||!!loadError||!preview
 return <dialog ref={dialog} className={`${s.deleteDialog} ${i.manager}`} aria-labelledby={heading} onCancel={e=>{e.preventDefault();if(!busy)onClose()}}><div className={s.stack}>
  <div className={s.row}><h2 id={heading}>{deleting?'Permanently delete quiz':'Manage quiz'}</h2><button type="button" className={s.secondary} disabled={busy} onClick={onClose}>Close</button></div>
  <p className={s.muted}>{quiz.title}</p>
  {loadError&&<p className={s.error} role="alert">{loadError} <button className={s.secondary} onClick={()=>void load()}>Retry</button></p>}
  {loading&&<p role="status">Loading current quiz inventory…</p>}
  {error&&<p role="alert" className={s.error}>{error} <button className={s.secondary} disabled={busy} onClick={()=>{setError('');void refresh()}}>Reload current quiz</button></p>}
  {notice&&<p role="status" className={s.notice}>{notice}</p>}
  {deleting?<>
   <p>This permanently removes <strong>{preview?.title??quiz.title}</strong> from the database. This cannot be undone.</p>
   {preview&&<dl className={i.impact}>{[['Student work records',preview.impact.work],['Submitted attempts',preview.impact.submissions],['Grades / feedback reviews',preview.impact.reviews],['Unfinished review drafts',preview.impact.reviewDrafts]].map(([label,count])=><div key={label}><dt>{label}</dt><dd>{count}</dd></div>)}</dl>}
   <p>Existing teacher-recorded mastery ratings remain in assessment history. {preview?.impact.copies??0} copied quizzes will stay available; their link to this source will be removed.</p>
   <p className={s.muted}>Archiving keeps this quiz and all its student work available for reference.</p>
   <label className={s.field}>Type the exact quiz title to confirm<input autoComplete="off" value={confirm} onChange={e=>setConfirm(e.target.value)} disabled={blocked}/></label>
   <div className={s.actions}><button className={s.secondary} disabled={busy} onClick={()=>{setDeleting(false);setConfirm('');setError('')}}>Cancel deletion</button><button className={i.danger} disabled={blocked||confirm!==preview?.title} onClick={()=>void act('delete')}>{busy?'Deleting…':'Permanently delete quiz'}</button></div>
  </>:<>
   {!quiz.deleted_at?<>
    <form className={s.stack} onSubmit={e=>{e.preventDefault();void act('rename')}}><label className={s.field}>Quiz title<input value={title} maxLength={160} disabled={blocked} onChange={e=>setTitle(e.target.value)}/></label><div><button className={s.button} disabled={blocked||!title.trim()||title.trim()===preview?.title}>Save title</button></div></form>
    <div className={s.actions}><Link className={s.secondary} href={href} onClick={onClose}>{quiz.status==='draft'?'Edit questions & publish':'Open quiz & student work'}</Link><button className={s.secondary} disabled={blocked||!quiz.question_count} onClick={onReuse}>Copy / assign to a class</button>{quiz.status==='published'&&<button className={s.secondary} disabled={blocked} onClick={()=>setEditingDue(!editingDue)}>Edit due date</button>}</div>
    {quiz.status!=='draft'&&<p className={s.muted}>To change the questions, copy this quiz into a new draft.</p>}
    {editingDue&&<QuizDueDateEditor quiz={{...quiz,version:preview?.version??quiz.version}} onCancel={()=>setEditingDue(false)} onSaved={()=>{setEditingDue(false);void refresh()}}/>}
    <div className={i.retire}><h3>{quiz.status==='draft'?'Remove from active inventory':'Availability'}</h3>{quiz.status==='draft'?<QuizDeleteDraft quiz={{...quiz,version:preview?.version??quiz.version}} disabled={blocked} onDeleted={()=>{onClose();void onChanged()}}/>:<QuizArchive quiz={{...quiz,version:preview?.version??quiz.version}} disabled={blocked} onChanged={refresh}/>}</div>
   </>:<div className={s.stack}><p>This draft was removed from the active inventory. Restore it to edit or publish it.</p><button className={s.button} disabled={blocked} onClick={()=>void act('restore')}>Restore draft</button></div>}
   <div className={i.retire}><h3>Permanent removal</h3><p className={s.muted}>Delete this quiz and its saved work from the database. Review the affected records before confirming.</p><button className={i.danger} disabled={blocked} onClick={()=>{setDeleting(true);setConfirm('');setError('');void load()}}>Review permanent deletion</button></div>
  </>}
 </div></dialog>
}
