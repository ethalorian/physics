'use client'
import Link from 'next/link'
import {ArrowRight,ClipboardCheck} from 'lucide-react'
import type {QuizList} from '@/lib/quizzes/types'
import {quizStatus,gradeLabel} from '@/lib/quizzes/types'
import {dueLabel,useQuizData} from './shared'
import s from './Quiz.module.css'
export default function QuizStudentList({compact=false}:{compact?:boolean}){
 const {data,error,loading,load}=useQuizData<QuizList>('/api/quizzes')
 if(data?.staff)return compact?null:<div className={s.app}><Link className={s.link} href="/admin/quizzes">Open the teacher quiz center →</Link></div>
 const quizzes=data?.quizzes.filter(q=>q.status==='published'||data.work.some(w=>w.quiz_id===q.id))??[]
 const pending=quizzes.filter(q=>q.status==='published'&&!['submitted','graded'].includes(data?.work.find(w=>w.quiz_id===q.id)?.state??''))
 const shown=compact?[...pending,...quizzes.filter(q=>!pending.includes(q))].slice(0,3):quizzes
 return <section className={`${s.app} ${compact?s.compact:''}`} aria-label="Assigned quizzes">{compact?<div className={s.row}><h2>Quizzes</h2><Link href="/quizzes" className={s.link}>All quizzes & grades <ArrowRight size={16}/></Link></div>:<header className={s.hero}><p className={s.eyebrow}>SHOW WHAT YOU UNDERSTAND</p><h1>Your quizzes</h1><p>Use precise vocabulary, explain your thinking, and apply what you know. Your teacher returns a quiz grade and separate feedback on your learning targets.</p></header>}
 {!!pending.length&&<p role="status" className={s.notice}>{pending.length} {pending.length===1?'quiz needs':'quizzes need'} completion. You can return to them later; submit each when you are ready.</p>}
 {error&&<div className={s.error} role="alert">{error} <button onClick={()=>void load()} className={s.secondary}>Try again</button></div>}{loading&&!data&&<p role="status">Loading quizzes…</p>}
 <div className={s.grid}>{shown.map(q=>{const w=data?.work.find(w=>w.quiz_id===q.id),r=data?.reviews.find(r=>r.submission_id===w?.submission_id),course=data?.courses.find(c=>c.id===q.course_id);return <article className={`${s.card} ${s.quizCard} ${s[q.kind]}`} key={q.id}><div className={s.row}><span className={s.badge}>{q.kind==='understanding'?'Physics understanding':q.kind==='vocabulary'?'Vocabulary':'Vocabulary + application'}</span><ClipboardCheck size={22}/>{pending.includes(q)&&<span className={s.badge}>Needs completion</span>}</div><h2 className="mt-4">{q.title}</h2><p className={s.muted}>{course?.name} · {course?.section} · {q.question_count} questions · {q.possible} points</p><p className={s.muted}>{dueLabel(q.due_at)}{q.status==='archived'?' · Closed':''}</p><p className="my-3"><strong>{r?.decision==='graded'?gradeLabel(r):quizStatus(q,w)}</strong></p><Link className={s.button} href={`/quizzes/${q.id}`}>{w?.state==='graded'?'View grade & feedback':w?.state==='returned'?'Revise quiz':w?.state==='submitted'?'View submission':q.status==='archived'?'View quiz':w?'Continue quiz':'Start quiz'}<ArrowRight size={17}/></Link></article>})}</div>
 {data?.locked?.map(q=><article className={s.card} key={q.id}><h2>{q.title}</h2><p>{dueLabel(q.due_at)} · Locked</p><p>Submit the required work to unlock this quiz:</p>{q.prerequisites?.map(p=><p key={p.id}><Link className={s.link} href={'/interactive-assignments/'+p.id}>{p.title} →</Link></p>)}{q.reading_id&&<Link className={s.link} href={'/readings/'+q.reading_id}>{q.reading_title} →</Link>}</article>)}
 {!loading&&data&&!shown.length&&!data.locked?.length&&<p className={s.notice}>{quizzes.length?'No unfinished quizzes. Open all quizzes to see your returned grades.':'No quizzes assigned yet. Your teacher will publish them here.'}</p>}
 </section>
}
