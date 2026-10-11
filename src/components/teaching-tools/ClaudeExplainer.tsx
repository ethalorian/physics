'use client'
import { useEffect, useRef, useState } from 'react'
import type { ContentBlock } from '@/data/content-blocks'
import type { MeasurementState } from '@/lib/teaching-tool-spec'
import { connectClaudeFrame } from '@/lib/claude-explainer-bridge'
import { validClaudeSnapshot } from '@/lib/claude-explainer'
import { Button } from '@/components/ui/button'

export default function ClaudeExplainer({block,state,onChange,disabled,showControls,interactive=showControls}:{block:ContentBlock;state:MeasurementState;onChange:(patch:Partial<MeasurementState>)=>Promise<boolean>|void;disabled?:boolean;showControls:boolean;interactive?:boolean}) {
 const iframe=useRef<HTMLIFrameElement>(null),cleanup=useRef<()=>void>(()=>{}),latest=useRef({state,onChange,disabled,interactive})
 const [applied,setApplied]=useState('')
 const [loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false),[mount,setMount]=useState(0)
 latest.current={state,onChange,disabled,interactive}
 const tool=block.teachingTool?.kind==='physics-explainer'?block.teachingTool:null,source=tool?.source
 useEffect(()=>()=>cleanup.current(),[])
 useEffect(()=>{setLoaded(false);setFailed(false);const timer=setTimeout(()=>setFailed(true),20000);return()=>clearTimeout(timer)},[source?.src,mount])
 if(!source||!tool)return null
 const index=Math.max(0,Math.min(tool.frames.length-1,state.frame??0))
 function connect(){
  cleanup.current();if(!iframe.current||!source)return
  cleanup.current=connectClaudeFrame(iframe.current,{
   read:()=>({frame:Math.max(0,Math.min(tool!.frames.length-1,latest.current.state.frame??0)),...(latest.current.state.claude?{claude:latest.current.state.claude}:{})}),
   writable:()=>latest.current.interactive,
   ready:()=>{setLoaded(true);setFailed(false)},
   applied:()=>{const value=JSON.stringify(latest.current.state);requestAnimationFrame(()=>requestAnimationFrame(()=>setApplied(value)))},
   emit:async value=>{if(latest.current.disabled||!latest.current.interactive||!value.claude||!validClaudeSnapshot(source.id,value.claude))return false;return latest.current.onChange(value)},
   link:href=>{if(href.startsWith('/explainers/claude/'))window.open(href,'_blank','noopener')},
  })
 }
 const navigate=(frame:number)=>{void onChange({frame,...(state.claude?{claude:{...state.claude,offset:0}}:{})})}
 return <div data-claude-explainer={source.id} data-claude-applied={applied} data-claude-ready={loaded?'true':'false'} style={{height:showControls?'auto':'100%',width:'100%'}}>
  {showControls&&<><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Use the original controls below. Scrolling and interactions update the classroom screen.</p><a className="inline-flex min-h-12 items-center underline" href={encodeURI(source.src)} target="_blank" rel="noopener noreferrer">Open original in a new tab</a></div><nav aria-label="Explainer sections" className="mb-3 flex gap-2"><Button variant="outline" disabled={disabled||index===0} onClick={()=>navigate(index-1)}>Previous</Button><select className="min-h-12 min-w-0 flex-1 rounded-lg border bg-background px-3" aria-label="Explainer section" disabled={disabled} value={index} onChange={e=>navigate(Number(e.target.value))}>{tool.frames.map((f,i)=><option value={i} key={i}>{i+1}. {f.title}</option>)}</select><Button disabled={disabled||index===tool.frames.length-1} onClick={()=>navigate(index+1)}>Next</Button></nav></>}
  {!loaded&&<p role="status" className="p-3">{failed?'The original explainer is taking longer to load. Open it in a new tab or retry.':'Loading the original explainer…'}{failed&&<Button variant="outline" onClick={()=>setMount(n=>n+1)}>Retry</Button>}</p>}
  <iframe key={`${source.id}:${mount}`} ref={iframe} title={`Claude original · ${block.teachingMoment?.title??source.id}`} src={encodeURI(source.src)} onLoad={connect} tabIndex={interactive?0:-1} style={{display:'block',width:'100%',height:showControls?'75vh':'100%',minHeight:showControls?600:undefined,border:0,pointerEvents:interactive&&loaded?'auto':'none'}} />
 </div>
}
