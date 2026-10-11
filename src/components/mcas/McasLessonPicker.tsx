'use client'
import {useState} from 'react'
import type {ContentBlock} from '@/data/content-blocks'
import {mcasLessonBlock,insertMcasBlocks} from '@/lib/mcas/authoring'
import McasPicker from './McasPicker'
import s from './Mcas.module.css'
export default function McasLessonPicker({blocks,targets,unitId,onChange}:{blocks:ContentBlock[];targets:{slug:string;statement:string}[];unitId?:string;onChange:(blocks:ContentBlock[])=>void}) {
  const [target,setTarget]=useState(targets.length===1?targets[0].slug:''),[after,setAfter]=useState(''),[notice,setNotice]=useState('')
  return <section className={s.panel} aria-label="MCAS lesson checkpoints"><h3>Weave MCAS questions into this lesson</h3><p className={s.notice}>Place a short check after students learn the relevant idea. Open response includes a sketch area. Added questions are optional practice and keep existing student responses intact.</p><div className={s.toolbar}><label>MCAS checkpoint target<select value={target} onChange={e=>setTarget(e.target.value)}><option value="">Choose the learning target…</option>{targets.map(t=><option key={t.slug} value={t.slug}>{t.statement}</option>)}</select></label><label>Insert MCAS after<select value={after} onChange={e=>setAfter(e.target.value)}><option value="">At the end of the lesson</option>{blocks.map((b,i)=><option key={b.id} value={b.id}>{i+1}. {b.teachingMoment?.title??b.type} · {b.id}</option>)}</select></label></div><McasPicker initialUnit={unitId} title="Choose lesson checkpoints" limit={4} existingIds={blocks.flatMap(b=>b.mcasId?[b.mcasId]:[])} blockedReason={!target?'Choose a learning target before adding a checkpoint.':after&&!blocks.some(b=>b.id===after)?'Choose a current insertion point.':''} onAdd={items=>{onChange(insertMcasBlocks(blocks,items.map(item=>mcasLessonBlock(item,target)),after||null));setNotice(`${items.length} MCAS questions added to the lesson draft. Use Save content to keep this placement.`)}}/>{notice&&<p role="status">{notice}</p>}</section>
}
