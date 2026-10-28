'use client'
import {useState} from 'react'
import type {Session} from '@/lib/math-missions/types'
import SubmissionSuggestions from '@/components/admin/results/SubmissionSuggestions'
import {useAssessmentReviewGuard} from '@/components/admin/useAssessmentReviewGuard'
import styles from './missions.module.css'
export default function MissionRelease({session,onSaved}:{session:Session&{review_note:string|null;reviewed_at:string|null;review_rating?:number|null};onSaved:()=>void}){
 const [level,setLevel]=useState<string>(''),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[released,setReleased]=useState(false)
 useAssessmentReviewGuard(!released&&(busy||!!level||!!note))
 async function release(){setBusy(true);setError('');try{const r=await fetch('/api/math-missions/teacher',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'review',id:session.id,revision:session.revision,level:level==='skip'?null:Number(level),note})});const d=await r.json();if(!r.ok)throw Error(d.error);setReleased(true);onSaved()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 if(session.reviewed_at||released)return <section><strong>Review released</strong><p>{session.review_note??note}</p>{session.review_rating&&<p>Mastery: {session.review_rating}/3</p>}</section>
 return <section aria-label="Review math mission"><SubmissionSuggestions source="mission" id={session.id} disabled={busy} onRating={r=>setLevel(r.level===null?'skip':String(r.level))} onFeedback={text=>setNote(old=>old||text)}/><label className={styles.field}>Mastery decision<select value={level} disabled={busy} onChange={e=>setLevel(e.target.value)}><option value="">Choose…</option><option value="skip">Skip · no new mastery rating</option><option value="1">1 · Not yet</option><option value="2">2 · Almost</option><option value="3">3 · Got it</option></select></label><label className={styles.field}>Feedback (optional)<textarea value={note} maxLength={4000} disabled={busy} onChange={e=>setNote(e.target.value)}/></label><button className={styles.primary} disabled={busy||!level} onClick={()=>void release()}>Release mastery & feedback</button>{error&&<p role="alert">{error}</p>}</section>
}
