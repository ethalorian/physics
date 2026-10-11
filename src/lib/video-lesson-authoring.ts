import { VIDEO_VOCABULARY } from '@/data/video-vocabulary'
import { PHYSICS_VIDEO_PROMPTS } from '@/data/physics-video-prompts'
import type { BlockDocument } from '@/data/content-blocks'
import { PHYSICS_VIDEOS, videoBlock } from './video-instruction'

/** Materializes the resource into the canonical lesson model before assignment. */
export function createVideoLesson(youtubeId: string): BlockDocument | null {
  const video = PHYSICS_VIDEOS.find(item => item.youtubeId === youtubeId)
  const prompts = PHYSICS_VIDEO_PROMPTS[youtubeId]
  if (!video || !prompts) return null
  const targetSlugs = video.targets.filter(target => target.relationship === 'teaches').map(target => target.slug)
  const targetId = targetSlugs[0]
  const references:Record<number,{src:string;alt:string}>={
    9:{src:'/learning/video-graph-scale.svg',alt:'A reference graph with time on the horizontal axis, position on the vertical axis, and equal steps along each axis.'},
    10:{src:'/learning/video-scientific-notation.svg',alt:'Scientific notation has a coefficient, a power of ten, and a unit. Negative powers of ten describe small positive values.'},
    11:{src:'/learning/video-metric-prefixes.svg',alt:'Reference: giga 10⁹, mega 10⁶, kilo 10³, no prefix 10⁰, milli 10⁻³, micro 10⁻⁶, nano 10⁻⁹.'},
    12:{src:'/learning/video-unit-conversions.svg',alt:'To change kilometers to meters, multiply by 1 000 meters over 1 kilometer. The kilometer units cancel and meters remain.'},
    13:{src:'/learning/video-vector-addition.svg',alt:'A vector 3 meters east followed tip to tail by 4 meters north has a resultant 5 meters long from the first tail to the final tip.'},
    14:{src:'/learning/video-vector-components.svg',alt:'A vector A makes angle theta from positive x. Its horizontal component is A cos theta and its vertical component is A sin theta. Component signs identify the quadrant.'},
    15:{src:'/learning/video-vector-products.svg',alt:'Dot product: AB cos theta, a scalar. Cross product: magnitude AB sin theta, direction perpendicular by the right-hand rule. In the xy plane, its z-component is AxBy minus AyBx.'},
  }
  const visual = references[video.sequence] ?? {src:video.sequence === 1 ? '/learning/measurement.svg' : video.sequence === 2 ? '/learning/acceleration.svg' : video.sequence <= 6 ? '/learning/video-position.svg' : '/learning/video-rates.svg',alt:video.sequence <= 6 ? 'Reference model for interpreting measurements, positions and direction.' : 'Reference model contrasting a trip, displacement, distance and elapsed time.'}
  const sei = { visual, frames: [{ level: 1 as const, text: 'I notice ___. This means ___ because ___.' }, { level: 3 as const, text: 'My reasoning is ___, supported by ___.' }], wordBank: video.sequence >= 9 ? (VIDEO_VOCABULARY[youtubeId]??[]).map(v=>v.term) : ['quantity', 'unit', 'position', 'change', 'direction', 'evidence'], modes: ['text' as const, 'sketch' as const] }
  return {
    schemaVersion: 1, presentation: 'physics-path', dayType: 'STANDARD',
    learningPath: { version: 1, kind: 'lesson', focus: video.focus, targetSlugs, foundations: video.collection === 'Foundations' },
    blocks: [
      { ...videoBlock(video), targetId, workshop: { stage: 'Watch & understand', pageBreakBefore: true } },
      { id: `scope-${youtubeId}`, type: 'prose', markdown: video.targets.filter(target => target.relationship === 'teaches').map(target => target.scope).join('\n\n') },
      { id: `vocabulary-${youtubeId}`, type: 'vocab', terms: VIDEO_VOCABULARY[youtubeId]??[], referencePanel: true },
      ...(prompts.workedExample ? [{id:`worked-${youtubeId}`,type:'worked_example' as const,format:'problem-workspace' as const,...prompts.workedExample,workshop:{stage:'See it worked',pageBreakBefore:true}}] : []),
      { id: `check-${youtubeId}`, type: 'question', capture: true, targetId, evidenceRole: 'practice', sei,
        workshop: { stage: 'Check your thinking', pageBreakBefore: true },
        question: { prompt: prompts.check.prompt, options: prompts.check.choices.map((text, index) => ({ id: 'ABC'[index], text, feedback: prompts.check.feedback[index] })), correctOptionId: 'ABC'[prompts.check.correct] } },
      ...(prompts.additionalChecks??[]).map((check,i)=>({id:`check-${youtubeId}-${i+2}`,type:'question' as const,capture:true as const,targetId,evidenceRole:'practice' as const,sei,question:{prompt:check.prompt,options:check.choices.map((text,index)=>({id:'ABC'[index],text,feedback:check.feedback[index]})),correctOptionId:'ABC'[check.correct]}})),
      { id: `explain-${youtubeId}`, type: 'exit_ticket', capture: true, targetId, evidenceRole: 'exit', prompt: prompts.reflection, sei,
        workshop: { stage: 'Apply & explain', pageBreakBefore: true } },
    ],
  }
}
