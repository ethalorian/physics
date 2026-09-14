'use client'

import { createContext, useContext, useState } from 'react'
import type { ContentBlock } from '@/data/content-blocks'
import { initialTeachingTool, type MeasurementState, type TeachingToolCommand, type TeachingToolStates } from '@/lib/teaching-tool-spec'
import CaseBoard from '@/components/lessons/CaseBoard'
import WorkshopScene from '@/components/lessons/WorkshopScene'
import { usePresentLive } from '@/components/lessons/PresentLiveProvider'

export const TeachingToolContext = createContext<{ states: TeachingToolStates; role: 'teacher'|'projector'; busy?: boolean; command?: (c:TeachingToolCommand)=>Promise<boolean> } | null>(null)

/** Registry boundary: courses author capabilities; hosts supply shared state and permission. */
export default function TeachingToolRenderer({ block }: {block:ContentBlock}) {
  const host = useContext(TeachingToolContext)
  const live = usePresentLive()
  const [own,setOwn] = useState<MeasurementState>(initialTeachingTool(block).state)
  const [independent,setIndependent] = useState(false)
  if (!block.teachingTool) return null
  if (!['measurement-bench','case-board'].includes(block.teachingTool.kind)||block.teachingTool.version!==1) return <p role="alert">This teaching tool version is unavailable. Use the written steps while your teacher checks the lesson.</p>
  const shared = host?.states[block.id] ?? live.session?.teachingTools?.[block.id] ?? (!host && live.session ? initialTeachingTool() : undefined)
  const studentFollowing = !host && live.follow && !independent && shared?.mode!=='practice' && Boolean(shared)
  const value = host ? shared?.state??initialTeachingTool().state : studentFollowing ? shared!.state : own
  const projector = host?.role==='projector'
  const controls = !projector && (!host || Boolean(host.command)) && !studentFollowing
  const update = (patch:Partial<MeasurementState>) => {
    if (host?.command) void host.command({block_id:block.id,state:patch})
    else if (!host && !studentFollowing) setOwn(v=>({...v,...patch}))
  }
  return <div data-teaching-tool={block.teachingTool.kind} data-tool-mode={host?.role??(studentFollowing?'following':'practice')}>
    {!host && shared && <div className="flex flex-wrap items-center gap-3 text-sm py-2">
      <span>{studentFollowing?'Following the classroom demonstration':shared.mode==='practice'?'Your teacher has opened practice':'Your own practice — kept separately'}</span>
      {shared.mode!=='practice' && <button type="button" className="min-h-11 rounded-lg border px-4" onClick={()=>{if(independent)live.setFollow(true);setIndependent(v=>!v)}}>{independent?'Rejoin demonstration':'Try on my own'}</button>}
    </div>}
    {block.teachingTool.kind==='case-board'?<CaseBoard block={block} state={value} onChange={update} disabled={Boolean(host?.busy)} showControls={controls}/>:<WorkshopScene block={block} state={value} onChange={update} disabled={Boolean(host?.busy)} showControls={controls}/>}
  </div>
}
