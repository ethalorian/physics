import type { ContentBlock } from '@/data/content-blocks'
import manifest from './claude-manifest.json'

/** Navigation and group prompts for the unchanged Claude export. The HTML owns the explanation. */
export const PHYSICS_EXPLAINERS = manifest
export function physicsExplainerBlocks(): ContentBlock[] {
 const targets:Record<string,string>={course:'u1.anchor-know-unknow',vectors:'u1.vocab-position-distance-displacement',kinematics:'u1.capture-pt-graph',derivatives:'u1.acceleration-rate-of-change',units:'u1.pick-equation-of-motion',uam:'u1.pick-equation-of-motion'}
 return PHYSICS_EXPLAINERS.map(e=>({targetId:targets[e.id],id:`explainer-${e.id}`,type:'prose',markdown:`# ${e.title}\n\n[Open the original interactive explainer](${encodeURI(e.src)})`,referencePanel:true,requiredForCompletion:false,lobbyReady:false,teachingMoment:{phase:'reference',title:e.title,purpose:'Explore the original interactive explanation.'},teachingTool:{kind:'physics-explainer',version:1,source:{id:e.id,src:e.src},frames:e.frames}}))
}
