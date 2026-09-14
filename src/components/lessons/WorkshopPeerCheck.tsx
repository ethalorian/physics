'use client'

import styles from './WorkshopResponses.module.css'
import { CheckCircle2, Wrench } from 'lucide-react'
import { useState } from 'react'
import { useDraft } from '@/components/blocks/useDraft'

interface Review { decision?: string; reading?: string; fix?: string; source?: string; text?: string }
export default function WorkshopPeerCheck({ value, onDraft, onSave }: { value: unknown; onDraft: (v: unknown)=>void; onSave: (v: unknown)=>void | Promise<boolean> }) {
  const [review,setReview] = useState<Review>((value as Review)??{})
  const [saved,setSaved] = useState(false)
  const packed = {...review,text:review.decision && review.reading && review.source ? `${review.source}: ${review.decision==='ready'?'Ready':'Needs a fix'}. I checked from zero to ${review.reading} in.${review.decision==='fix'?` Correction: ${review.fix??''}`:''}` : ''}
  useDraft(onDraft,packed)
  function change(key: keyof Review, v: string) {setReview(prev=>({...prev,[key]:v}));setSaved(false)}
  const complete = Boolean(review.decision && review.source && review.reading?.trim() && (review.decision!=='fix'||review.fix?.trim()))
  return <div className={`${styles.response} space-y-5`}>
    <p>Check the mark against the required 8 3/8 inches. Save the result your partner can act on.</p>
    <div className={styles.fieldGrid}><label className="block">What did you check?<select aria-label="Work checked" className="block mt-2 w-full min-h-12 rounded-lg border bg-card p-3" value={review.source??''} onChange={e=>change('source',e.target.value)}><option value="">Choose the work</option><option>A partner’s mark</option><option>My own mark, measured again</option><option>The supplied example on screen</option></select></label>
    <label className="block">Your reading from zero to the mark (inches)<input aria-label="Checked reading in inches" className="block w-full rounded-lg border bg-card p-3 mt-2" placeholder="For example: 8 3/8" value={review.reading??''} onChange={e=>change('reading',e.target.value)} /></label>
    </div><div className={styles.decision} role="group" aria-label="Check decision">{[['ready','Ready'],['fix','Needs a fix']].map(([v,label])=><button key={v} type="button" aria-pressed={review.decision===v} className="rounded-lg border px-5 py-3" style={{background:review.decision===v?'var(--secondary)':'var(--card)',borderColor:review.decision===v?'var(--primary)':'var(--border)'}} onClick={()=>change('decision',v)}>{v==='ready'?<CheckCircle2 size={24} aria-hidden/>:<Wrench size={24} aria-hidden/>}{label}</button>)}</div>
    {review.decision==='fix'&&<label className="block">What should change?<textarea aria-label="Specific correction" className="block w-full rounded-lg border bg-card p-3 mt-2" rows={2} placeholder="Move the mark… / Reset zero…" value={review.fix??''} onChange={e=>change('fix',e.target.value)} /></label>}
    <button data-response-action type="button" className="rounded-lg bg-primary px-5 py-3 text-primary-foreground disabled:opacity-50" disabled={!complete} onClick={async()=>{const ok=await onSave(packed);setSaved(ok!==false)}}>{saved?'Check saved ✓':'Save this check'}</button>
  </div>
}
