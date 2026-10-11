'use client'
import {useId,useRef,useState} from 'react'
import Link from 'next/link'
import type {QuizCard} from '@/lib/quizzes/types'
import {quizCsv} from '@/lib/quizzes/insights'
import {dueLabel,quizFetch} from './shared'
import s from './Quiz.module.css'
import i from './QuizInventory.module.css'

export default function QuizInventory({quizzes,total,pending,units,courseName,href,onManage,onChanged,onClear,loading,readOnly}:{quizzes:QuizCard[];total:number;pending:Record<string,number>;units:{id:string;name:string}[];courseName:(id:string)=>string;href:(id:string,course:string)=>string;onManage:(id:string)=>void;onChanged:()=>Promise<void>;onClear:()=>void;loading:boolean;readOnly:boolean}){
 const [selected,setSelected]=useState<Set<string>>(new Set()),[action,setAction]=useState<'archive'|'reopen'>('archive'),[busy,setBusy]=useState(false),[notice,setNotice]=useState('')
 const dialog=useRef<HTMLDialogElement>(null),heading=useId()
 const selectable=quizzes.filter(q=>!q.deleted_at&&q.status!=='draft'),chosen=selectable.filter(q=>selected.has(q.id)),eligible=chosen.filter(q=>q.status===(action==='archive'?'published':'archived'))
 function toggle(id:string){setSelected(current=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);return next})}
 async function bulk(){
  setBusy(true);let done=0;const failures:string[]=[]
  for(const q of eligible){try{await quizFetch(`/api/quizzes/${q.id}`,{action,version:q.version});done++}catch(e){failures.push(`${q.title}: ${(e as Error).message}`)}}
  setNotice(`${done} ${done===1?'quiz':'quizzes'} ${action==='archive'?'archived':'reopened'}.${failures.length?' '+failures.join(' '):''}`);setSelected(new Set());dialog.current?.close();await onChanged();setBusy(false)
 }
 function download(){const rows=[['Quiz','Class','Status','Type','Units','Created','Due','Student work','Awaiting review'],...quizzes.map(q=>[q.title,courseName(q.course_id),q.deleted_at?'Removed draft':q.status,q.kind,units.filter(u=>q.unit_ids?.includes(u.id)).map(u=>u.name).join('; '),q.created_at??'',q.due_at??'',q.work_count??'',pending[q.id]??0])];const url=URL.createObjectURL(new Blob([quizCsv(rows)],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='quiz-inventory.csv';a.click();URL.revokeObjectURL(url)}
 return <section className={i.inventory} aria-label="Quiz inventory">
  <div className={i.toolbar}><p>{quizzes.length} of {total} quizzes</p><div className={s.actions}><button className={s.secondary} onClick={onClear}>Clear filters</button><button className={s.secondary} disabled={loading||busy} onClick={()=>void onChanged()}>Refresh inventory</button><button className={s.secondary} disabled={!quizzes.length} onClick={download}>Export inventory</button></div></div>
  {chosen.length>0&&<div className={i.selection}><strong>{chosen.length} selected</strong><button className={s.secondary} disabled={readOnly||busy||!chosen.some(q=>q.status==='published')} onClick={()=>{setAction('archive');dialog.current?.showModal()}}>Archive selected</button><button className={s.secondary} disabled={readOnly||busy||!chosen.some(q=>q.status==='archived')} onClick={()=>{setAction('reopen');dialog.current?.showModal()}}>Reopen selected</button><button className={s.secondary} disabled={busy} onClick={()=>setSelected(new Set())}>Clear selection</button></div>}
  {notice&&<p role="status" className={s.notice}>{notice}</p>}
  <div className={s.tableScroll}><table className={i.table}><caption className="sr-only">Quiz inventory, availability, student activity, and management</caption><thead><tr><th scope="col"><input type="checkbox" aria-label="Select all assigned quizzes in this view" checked={!!selectable.length&&chosen.length===selectable.length} disabled={readOnly||busy||!selectable.length} onChange={e=>setSelected(e.target.checked?new Set(selectable.map(q=>q.id)):new Set())}/></th>{['Quiz / class','Status','Student activity','Dates','Manage'].map(h=><th scope="col" key={h}>{h}</th>)}</tr></thead><tbody>{quizzes.map(q=><tr key={q.id}>
   <td>{q.status!=='draft'&&!q.deleted_at&&<input type="checkbox" aria-label={`Select ${q.title}`} checked={selected.has(q.id)} disabled={readOnly||busy} onChange={()=>toggle(q.id)}/>}</td>
   <th scope="row">{q.deleted_at?<button className={i.title} onClick={()=>onManage(q.id)}>{q.title}</button>:<Link className={i.title} href={href(q.id,q.course_id)}>{q.title}</Link>}<small>{courseName(q.course_id)} · {q.kind} · {q.question_count} questions · {q.possible} pts</small><small>{units.filter(u=>q.unit_ids?.includes(u.id)).map(u=>u.name).join(' · ')||'No unit linked'}</small></th>
   <td><span className={s.badge}>{q.deleted_at?'Removed draft':q.status==='draft'?'Draft':q.status==='archived'?'Archived':'Published'}</span></td>
   <td><strong>{q.work_count===undefined?'—':q.work_count===0?'No student work':`${q.work_count} started`}</strong><small>{pending[q.id]?`${pending[q.id]} awaiting review`:q.status==='draft'?'Not assigned':'Nothing awaiting review'}</small></td>
   <td><span>{dueLabel(q.due_at)}</span><small>{q.created_at?`Created ${new Date(q.created_at).toLocaleDateString()}`:'Creation date unavailable'}</small></td>
   <td><button className={s.secondary} aria-label={`Manage ${q.title}`} onClick={()=>onManage(q.id)}>Manage</button></td>
  </tr>)}</tbody></table></div>
  <dialog ref={dialog} className={s.deleteDialog} aria-labelledby={heading} onCancel={e=>{if(busy)e.preventDefault()}}><div className={s.stack}><h2 id={heading}>{action==='archive'?'Archive':'Reopen'} {eligible.length} quizzes?</h2><p>{action==='archive'?'Close new submissions and remove these quizzes from active inventory. All student work and grades stay available.':'Make these quizzes active again and allow students to submit. Existing due dates stay in place.'}</p><ul>{eligible.map(q=><li key={q.id}>{q.title} · {courseName(q.course_id)}</li>)}</ul><div className={s.actions}><button className={s.secondary} autoFocus disabled={busy} onClick={()=>dialog.current?.close()}>Cancel</button><button className={s.button} disabled={busy||!eligible.length} onClick={()=>void bulk()}>{busy?'Saving…':action==='archive'?'Archive quizzes':'Reopen quizzes'}</button></div></div></dialog>
 </section>
}
