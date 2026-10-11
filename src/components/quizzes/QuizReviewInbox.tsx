'use client'
import Link from 'next/link'
import { assessmentCenterHref } from '@/lib/assessment-center'
import {useEffect} from 'react'
import type {QuizList} from '@/lib/quizzes/types'
import {useQuizData} from './shared'
import s from './Quiz.module.css'
export default function QuizReviewInbox({classId}: {classId?: string | null} = {}){const {data,error,load}=useQuizData<QuizList>('/api/quizzes');useEffect(()=>{const refresh=()=>{if(document.visibilityState==='visible')void load()};window.addEventListener('focus',refresh);const timer=setInterval(refresh,60000);return()=>{window.removeEventListener('focus',refresh);clearInterval(timer)}},[load]);if(data&&!data.staff)return null;const pending=data?.quizzes.filter(q=>(!classId||q.course_id===classId)&&(data.pending[q.id]??0)>0)??[],count=pending.reduce((n,q)=>n+(data?.pending[q.id]??0),0);return <section className={`${s.app} ${s.compact}`} aria-label="Quiz review inbox"><div className={s.card}><div className={s.row}><h2>Quiz submissions</h2><Link className={s.link} href={assessmentCenterHref('quizzes',null,classId)}>Review quizzes →</Link></div><p role="status">{error?'Quiz inbox could not refresh. Open the quiz center to retry.':!data?'Checking submissions…':count?`${count} ${count===1?'submission':'submissions'} ready for grading and mastery review`:'No quiz submissions waiting for review.'}</p>{pending.map(q=><Link className={s.link} key={q.id} href={assessmentCenterHref('quizzes',q.id,classId)}>{q.title} · {data?.pending[q.id]} to review →</Link>)}</div></section>}
