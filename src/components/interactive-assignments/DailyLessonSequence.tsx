'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {DAY_ONE_FOUNDATION,DAY_ONE_REVIEW} from '@/lib/interactive-assignments/foundations/day-one'
import s from './Foundation.module.css'
type Sequence={foundation_id:string;review_id:string;quiz_id:string;quizAvailable:boolean;missing:{id:string;title:string;role:string}[]}
export default function DailyLessonSequence({id,submitted,preview}:{id:string;submitted:boolean;preview:boolean}){
 const [sequence,setSequence]=useState<Sequence|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0)
 useEffect(()=>{if(preview)return;const abort=new AbortController();fetch(`/api/interactive-assignments/${id}/sequence`,{signal:abort.signal,cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setSequence(d.sequence);setError('')}).catch(e=>{if(!abort.signal.aborted)setError(e.message)});return()=>abort.abort()},[id,submitted,preview,retry])
 return <aside className={s.sequence} aria-label="Day 1 learning sequence"><h2>Day 1 · Your learning sequence</h2><ol><li><span>1 · Foundation</span>{(sequence||preview)?<Link href={'/interactive-assignments/'+(sequence?.foundation_id??DAY_ONE_FOUNDATION)}>Learn from the slides</Link>:<span>Learn from the slides</span>}</li><li><span>2 · Review</span>{(sequence||preview)?<Link href={'/interactive-assignments/'+(sequence?.review_id??DAY_ONE_REVIEW)}>Complete the review</Link>:<span>Complete the review when assigned</span>}</li><li><span>3 · Daily quiz</span>{sequence?.quizAvailable&&!sequence.missing.length?<Link href={'/quizzes/'+sequence.quiz_id}>Open Day 1 quiz</Link>:<span>{preview?'Assigned automatically with the review':sequence?.quizAvailable?'Locked until both submissions are saved':'Scheduled with your review'}</span>}</li></ol>{!!sequence?.missing.length&&<p>Still needed: {sequence.missing.map(m=>m.title).join(' and ')}.</p>}{error&&<p role="alert">Could not check quiz access. {error}</p>}{!preview&&<button onClick={()=>setRetry(n=>n+1)}>Check quiz access</button>}<p className={s.status}>Your own foundation and review submissions unlock the quiz. Teacher grading is separate.</p></aside>
}
