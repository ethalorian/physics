import { validClaudeSnapshot, type ClaudeSnapshot } from '@/lib/claude-explainer'
import { PHYSICS_DEFAULTS, validPhysicsPatch, type PhysicsControls, type PhysicsExplainerDescriptor } from '@/lib/physics-explainer'
import type { ContentBlock } from '@/data/content-blocks'

/** Versioned tool capability on a block, shared by every course and presentation face. */
export interface MeasurementToolDescriptor {
  kind: 'measurement-bench'
  version: 1
  variant: 'measure' | 'mark' | 'inspect'
}
export interface CaseFrame { title:string; image?:string; alt?:string; prompt:string; body?:string; check?:string }
export type TeachingToolDescriptor = MeasurementToolDescriptor | PhysicsExplainerDescriptor | {kind:'case-board';version:1;frames:CaseFrame[]}
export interface MeasurementState extends PhysicsControls { claude?:ClaudeSnapshot; frame?:number; setup: 'offset' | 'straight' | 'tilted'; mark: number; show: boolean }
export interface TeachingToolSnapshot { kind: 'measurement-bench'|'case-board'|'physics-explainer'; version: 1; mode: 'demonstrate' | 'practice'; state: MeasurementState }
export type TeachingToolStates = Record<string, TeachingToolSnapshot>
export interface TeachingToolCommand { block_id: string; state?: Partial<MeasurementState>; mode?: 'demonstrate' | 'practice'; reset?: boolean }

export function initialTeachingTool(block?:ContentBlock): TeachingToolSnapshot {
  return {kind:block?.teachingTool?.kind??'measurement-bench',version:1,mode:'demonstrate',state:{...(block?.teachingTool?.kind==='physics-explainer'?PHYSICS_DEFAULTS:{}),setup:'offset',mark:128,show:false,frame:0}}
}
export function supportsTeachingTool(block: ContentBlock): boolean {
  if(block.teachingTool?.kind==='physics-explainer')return block.teachingTool.version===1&&block.teachingTool.frames.length>0&&block.teachingTool.frames.length<=40&&block.teachingTool.frames.every(f=>typeof f.title==='string'&&typeof f.body==='string'&&typeof f.prompt==='string')
  if(block.teachingTool?.kind==='case-board')return block.teachingTool.version===1&&Array.isArray(block.teachingTool.frames)&&block.teachingTool.frames.length>0&&block.teachingTool.frames.length<=6&&block.teachingTool.frames.every(f=>typeof f.title==='string'&&typeof f.prompt==='string')
  return block.teachingTool?.kind === 'measurement-bench' && block.teachingTool.version === 1 && ['measure','mark','inspect'].includes(block.teachingTool.variant)
}
/** Validate a small command; no arbitrary JSON, code, grade or student answer is accepted. */
export function applyTeachingToolCommand(block: ContentBlock, previous: TeachingToolSnapshot | undefined, input: unknown): TeachingToolSnapshot | null {
  if (!supportsTeachingTool(block) || !input || typeof input !== 'object' || Array.isArray(input)) return null
  const c = input as Record<string, unknown>
  if (c.block_id !== block.id || Object.keys(c).some(k=>!['block_id','state','mode','reset'].includes(k))) return null
  if (c.mode !== undefined && c.mode !== 'demonstrate' && c.mode !== 'practice') return null
  if (c.reset !== undefined && typeof c.reset !== 'boolean') return null
  const patch = c.state === undefined ? {} : c.state
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return null
  const p = patch as Record<string, unknown>
  if(block.teachingTool?.kind==='physics-explainer') {
    if(block.teachingTool.source) {
      if(Object.keys(p).some(k=>!['frame','show','claude'].includes(k)))return null
      if(p.frame!==undefined&&(typeof p.frame!=='number'||!Number.isInteger(p.frame)||p.frame<0||p.frame>=block.teachingTool.frames.length))return null
      if(p.show!==undefined&&typeof p.show!=='boolean')return null
      if(p.claude!==undefined&&!validClaudeSnapshot(block.teachingTool.source.id,p.claude))return null
    } else if(!validPhysicsPatch(p)||(typeof p.frame==='number'&&p.frame>=block.teachingTool.frames.length))return null
    const old=c.reset||previous?.kind!=='physics-explainer'?initialTeachingTool(block):previous
    return {...old,mode:(c.mode as TeachingToolSnapshot['mode']|undefined)??old.mode,state:{...old.state,...p}}
  }
  if (Object.keys(p).some(k=>!(block.teachingTool?.kind==='case-board'?['frame','show']:['setup','mark','show']).includes(k))) return null
  if (p.setup !== undefined && !['offset','straight','tilted'].includes(String(p.setup))) return null
  if (p.mark !== undefined && (typeof p.mark !== 'number' || !Number.isInteger(p.mark) || p.mark < 0 || p.mark > 160)) return null
  if (p.show !== undefined && typeof p.show !== 'boolean') return null
  if (p.frame !== undefined && (typeof p.frame!=='number'||!Number.isInteger(p.frame)||p.frame<0||block.teachingTool?.kind!=='case-board'||p.frame>=block.teachingTool.frames.length))return null
  const old = c.reset || previous?.kind!==block.teachingTool?.kind ? initialTeachingTool(block) : previous ?? initialTeachingTool(block)
  return {...old,mode:(c.mode as TeachingToolSnapshot['mode']|undefined)??old.mode,state:{...old.state,...p} as MeasurementState}
}

export function visibleTeachingTools(blocks: ContentBlock[], states: TeachingToolStates | null | undefined): TeachingToolStates {
  return Object.fromEntries(blocks.filter(supportsTeachingTool).filter(b=>states?.[b.id]).map(b=>[b.id,states![b.id]]))
}
