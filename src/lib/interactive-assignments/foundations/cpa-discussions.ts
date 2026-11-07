import legacy from '@/data/foundations/cpa-lab-legacy-prompts.json'
import supports from '@/data/foundations/cpa-discussions.json'
import labs from '@/data/foundations/cpa-lab-supports.json'
import {getFoundationCheckpoints,type FoundationKey,type Checkpoint} from './checkpoints'
import type {LessonQuestion} from '../catalog'
export const cpaDiscussionSupport=(foundation:FoundationKey,index:number)=>supports[foundation][index]
/** Display-only supports. Never rewrite student state, checkpoint IDs or the example being checked. */
export function cpaCheckpoints(foundation:FoundationKey):readonly Checkpoint[]{return getFoundationCheckpoints(foundation).map((c,i)=>{const s=cpaDiscussionSupport(foundation,i);return {...c,prompts:s.prompts as [string,string],discuss:s.discuss,reply:s.reply,reflection:s.reflect,solo:{...c.solo,idea:s.soloIdea,critique:s.critique,reflection:s.soloReflect}}})}
export function cpaLabSupport(q:LessonQuestion){return (labs as Record<string,string>)[q.id]??''}
export function hasCpaSupport(staff:boolean,track:string|null|undefined,edition:string|undefined){return staff?edition==='cpa-v1':track==null||track==='cpa'}

export function cpaLabPrompt(q:LessonQuestion,edition?:string){return edition==='cpa-v1'?q.prompt:(legacy as Record<string,string>)[q.id]??q.prompt}
