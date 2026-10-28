'use client'
import dynamic from 'next/dynamic'
import { ProblemStageDisplay } from '@/components/blocks/ProblemStageInput'
import { PROBLEM_STAGES, type ProblemAnswer } from '@/lib/problem-response'
import type { MathResponse } from '@/lib/math-response'
import type { Evidence } from '@/lib/review-desk/types'
const SimulationTrialEvidence=dynamic(()=>import('@/components/interactive-assignments/SimulationTrialEvidence'))
const MathWorkReview=dynamic(()=>import('@/components/math-spine/MathWorkReview'))
const ForceDiagram=dynamic(()=>import('@/components/interactive-assignments/LessonActivity').then(m=>m.ForceDiagram))
export default function EvidenceResponse({value,rendering,depth=0}:{value:unknown;rendering?:Evidence['rendering'];depth?:number}){
 if(value===undefined||value===null||value==='')return <p>No response recorded.</p>
 if(rendering==='simulation'&&typeof value==='object'){const v=value as {state:import('@/lib/interactive-assignments/velocity').VelocityState;simulation:string};return <SimulationTrialEvidence state={v.state} simulation={v.simulation}/>}
 if(rendering==='artifact'&&typeof value==='object'){const v=value as {text?:string;fileId?:string;fileName?:string};return <><p>{v.text}</p>{v.fileId&&<a href={'/api/choice-calendar/artifacts?id='+encodeURIComponent(v.fileId)} target="_blank" rel="noopener noreferrer">Open {v.fileName||'submitted attachment'}</a>}</>}
 if(rendering==='math'&&typeof value==='object')return <MathWorkReview value={value as MathResponse}/>
 if(rendering==='force'&&typeof value==='string')return <ForceDiagram value={value} onChange={()=>{}} readOnly/>
 if(rendering==='problem'&&typeof value==='object')return <div>{PROBLEM_STAGES.map(stage=><section key={stage}><strong>{stage.charAt(0).toUpperCase()+stage.slice(1)}</strong><ProblemStageDisplay value={(value as ProblemAnswer)[stage]} label={stage}/></section>)}</div>
 if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')return <>{String(value)}</>
 if(depth>5)return <p>Open the original assignment to inspect this embedded artifact.</p>
 if(Array.isArray(value))return <ol>{value.map((v,i)=><li key={i}><EvidenceResponse value={v} depth={depth+1}/></li>)}</ol>
 const data=value as Record<string,unknown>
 if(Array.isArray(data.strokes)&&typeof data.text==='string')return <ProblemStageDisplay value={data as unknown as Parameters<typeof ProblemStageDisplay>[0]['value']} label="Response"/>
 if(data.mode==='text'&&typeof data.text==='string'&&Object.keys(data).every(key=>key==='mode'||key==='text'))return <EvidenceResponse value={data.text} depth={depth+1}/>
 return <dl>{Object.entries(data).filter(([key])=>!/(^id$|_id$|token|email|created_at|updated_at|stroke|coordinates)/i.test(key)).map(([key,v])=><div key={key}><dt>{key.replace(/_/g,' ')}</dt><dd><EvidenceResponse value={v} depth={depth+1}/></dd></div>)}</dl>
}
