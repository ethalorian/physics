import catalog from '@/data/physics-learning-catalog.json'
import type { BlockDocument } from '@/data/content-blocks'

const physicsIds=new Set(catalog.map(l=>l.id))
/** Presentation-only adapter: same block IDs, target links, prompts and response fields.
 * Existing documents and historical submissions are never rewritten. */
export function physicsProblemFormat(lessonId:string,document:BlockDocument):BlockDocument {
  if(!physicsIds.has(lessonId)&&!document.learningPath)return document
  return {...document,blocks:document.blocks.map(block=>{
    if(block.type==='gewa'&&!block.responseFormat)return {...block,responseFormat:'problem-workspace' as const}
    if(block.type==='worked_example'&&!block.format)return {...block,format:'problem-workspace' as const}
    return block
  })}
}
