'use client'
import Link from 'next/link'
import { useLearningResource } from '@/app/home/useLearningWeek'
import s from '@/components/review-modules/review.module.css'
export default function Page(){const {data,error,loading,refresh}=useLearningResource<{assignments:{slug:string;title:string;status:string}[]}>('/api/review-modules');return <section className={s.admin}><h1>Review assignments</h1><p>Open your review and enter the code from your teacher.</p>{loading&&<p role="status">Loading…</p>}{error&&<p role="alert">Sign in to see your assigned reviews. <button onClick={refresh}>Retry</button></p>}<div className={s.cards}>{data?.assignments.map(a=><Link className={s.card} key={a.slug} href={'/review/'+a.slug}><h2>{a.title}</h2><p>{a.status==='submitted'?'Submitted':'Open assignment →'}</p></Link>)}</div></section>}
