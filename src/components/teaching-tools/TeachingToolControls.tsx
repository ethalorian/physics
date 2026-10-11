'use client'

import { paginateBlocks, type BlockDocument } from '@/data/content-blocks'
import type { CommandSession } from '@/lib/classroom-command'
import { teachingTitle } from '@/lib/teaching-content'
import { initialTeachingTool, supportsTeachingTool, type TeachingToolCommand } from '@/lib/teaching-tool-spec'
import { TeachingToolContext } from './TeachingToolRenderer'
import TeachingToolRenderer from './TeachingToolRenderer'

/** The same command surface is mounted on the iPad and the desktop live panel. */
export default function TeachingToolControls({ document,session,busy,patch }: {document:BlockDocument;session:CommandSession;busy:boolean;patch:(p:Record<string,unknown>)=>Promise<boolean>}) {
  const tools=document.blocks.filter(supportsTeachingTool)
  if(!tools.length)return null
  const pages=paginateBlocks(document.blocks)
  const current=tools.find(b=>b.id===session.projected_block_id)??pages[session.current_section]?.blocks.find(supportsTeachingTool)??tools[0]
  const original=current.teachingTool?.kind==='physics-explainer'&&Boolean(current.teachingTool.source)
  const snapshot=session.teaching_tool_state?.[current.id]??initialTeachingTool(current)
  const command=(c:TeachingToolCommand)=>patch({teaching_tool:c,expected_command_revision:session.command_revision})
  return <section aria-label="Live teaching tool" className="rounded-xl border bg-card p-4 space-y-4">
    <div><h2 className="text-title-2">{original?'Interactive explainer':'Teaching tool'}</h2><p className="text-sm text-muted-foreground">{original?'Use Play, sliders, and questions here. Your changes appear on the classroom screen.':'These controls update the classroom screen. Student practice stays separate.'}</p></div>
    <label className="block text-sm">{original?'Explainer':'Tool in this lesson'}<select aria-label={original?'Open an explainer':'Teaching tool to project'} className="mt-2 min-h-12 w-full rounded-lg border bg-background p-3" disabled={busy} value={current.id} onChange={e=>void patch({projected_block_id:e.target.value,blackout:false,poll_block_id:null})}>{tools.map(b=><option key={b.id} value={b.id}>{teachingTitle(b)}</option>)}</select></label>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy} className="min-h-12 rounded-lg border px-4" onClick={()=>void patch({projected_block_id:current.id,blackout:false,poll_block_id:null})}>Show this tool</button>
      <button type="button" disabled={busy} className="min-h-12 rounded-lg border px-4" aria-pressed={snapshot.mode==='practice'} onClick={()=>void command({block_id:current.id,mode:snapshot.mode==='practice'?'demonstrate':'practice'})}>{snapshot.mode==='practice'?'Bring class back to demonstration':'Open student practice'}</button>
      <button type="button" disabled={busy} className="min-h-12 rounded-lg border px-4" onClick={()=>void command({block_id:current.id,reset:true})}>Reset demonstration</button>
    </div>
    <TeachingToolContext.Provider value={{role:'teacher',states:session.teaching_tool_state??{},busy,command}}><TeachingToolRenderer block={current}/></TeachingToolContext.Provider>
    <p className="text-sm" role="status">{busy?'Controls temporarily unavailable':`Confirmed classroom state · revision ${session.command_revision??0}`}</p>
  </section>
}
