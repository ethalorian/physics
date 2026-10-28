'use client'
import { nextTimeText } from '@/lib/teacher-feedback'
import { useEffect, useRef, useState } from 'react'
import { useLearningResource } from '@/app/home/useLearningWeek'
import type { SuggestionRow, SuggestionSource, SubmissionSuggestion } from '@/lib/assessment-results/suggestions'
import s from './ResultsWorkspace.module.css'
type Props = { source: SuggestionSource; id: string; disabled?: boolean; onApply?: (value: SubmissionSuggestion) => void;
  onRating?: (rating: SubmissionSuggestion['ratings'][number]) => void; onFeedback?: (feedback: string) => void;
  onScores?: (scores: SubmissionSuggestion['scores'], includeFeedback: boolean) => void; onReady?: (value: SubmissionSuggestion) => void;
  onTargets?: (targets: SuggestionRow['targets']) => void;
}
export default function SubmissionSuggestions({source,id,disabled,onApply,onRating,onFeedback,onScores,onReady,onTargets}:Props) {
  const url='/api/assessment-results/suggestions?' + new URLSearchParams({source,id})
  const {data:cachedData,dataUrl,error,refresh} = useLearningResource<SuggestionRow>(url)
  const data=dataUrl===url?cachedData:null
  const [retrying,setRetrying] = useState(false),[message,setMessage] = useState('')
  const callbacks=useRef({onReady,onTargets});callbacks.current={onReady,onTargets}
  const applied=useRef('')
  useEffect(()=>{if(data?.targets)callbacks.current.onTargets?.(data.targets);if(data?.status==='ready'&&data.result){const key=source+id+JSON.stringify(data.result);if(applied.current!==key){applied.current=key;callbacks.current.onReady?.(data.result)}}},[data,source,id])
  useEffect(()=>{if(!data || !['queued','processing','error'].includes(data.status))return;const timer=setInterval(refresh,data.status==='error'?30000:6000);return()=>clearInterval(timer)},[data,refresh])
  async function retry(){setRetrying(true);setMessage('');try{const r=await fetch('/api/assessment-results/suggestions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source,id})});if(!r.ok)throw Error('Could not restart the suggestion. Try again.');setMessage('Claude is preparing a private suggestion.');setTimeout(refresh,2000)}catch(e){setMessage((e as Error).message)}finally{setRetrying(false)}}
  return <section className={s.suggestions} aria-label="Claude submission suggestions"><header><strong>Claude draft · Private</strong><span>{data?.status==='ready'?'Ready to review':data?.status==='error'?'Retry pending or needs attention':'Preparing suggestions…'}</span></header>
    {data?.result && <><p>{data.result.summary}</p><div className={s.suggestionRatings}>{data.result.ratings.map(r=><div key={r.target_id} data-tone={r.level===3?'high':r.level===2?'mid':r.level===1?'low':'none'}><strong>{r.level===null?'Insufficient evidence':`${r.level} · ${['','Not yet','Almost','Got it'][r.level]}`}</strong><p>{data.targets.find(t=>t.id===r.target_id)?.statement}</p><small>{r.rationale}</small>{onRating&&<button className={s.button} disabled={disabled} onClick={()=>onRating(r)}>Use this mastery suggestion</button>}</div>)}</div>{data.result.scores.map(score=><p key={score.id}><strong>{score.earned} / {score.possible}</strong> · {score.feedback}</p>)}<p><strong>Next time:</strong> {nextTimeText(data.result.next_time)}</p>
      {onFeedback&&<button className={s.button} disabled={disabled} onClick={()=>onFeedback(data.result!.summary+'\n\nNext time: '+nextTimeText(data.result!.next_time))}>Use suggested feedback</button>}
      {onScores&&!!data.result.scores.length&&<><button className={s.button} disabled={disabled} onClick={()=>onScores(data.result!.scores,false)}>Fill missing automatic scores</button><button className={s.button} disabled={disabled} onClick={()=>onScores(data.result!.scores,true)}>Use question feedback in empty fields</button></>}
      {onApply&&<button className={s.button} disabled={disabled} onClick={()=>onApply(data.result!)}>Use suggestions in my draft</button>}</>}
    <p className={s.note}>Suggestions stay private. Choose or edit mastery and feedback, then use the release button. Completion alone does not determine mastery.</p>
    {(error || data?.status==='error') && <><p role="alert">{data?.error || 'Suggestions could not load. Your review controls are still available.'}</p><p>Automatic retries run in the background. You can also retry now.</p><button className={s.button} disabled={disabled || retrying} onClick={()=>void retry()}>Retry Claude</button></>}{message && <p role="status">{message}</p>}
  </section>
}
