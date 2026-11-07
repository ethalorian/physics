import {effectiveTrack} from '@/lib/track-visibility'
import type {LessonAssignment, LessonQuestion} from '../catalog'
import authored from '@/data/foundations/cpa-questions.json'
export const CPA_EDITION = 'cpa-v1' as const
export type FoundationQuestionEdition = 'cpa-v1' | 'honors-v1'
export type EditionState = {foundationQuestionEdition?:FoundationQuestionEdition;answers?:Record<string,unknown>}

/** Only the server may select a new edition. Existing work is a frozen contract. */
export function resolveFoundationQuestionEdition(saved:EditionState|null|undefined,track:unknown):FoundationQuestionEdition|undefined {
 if(saved?.foundationQuestionEdition)return saved.foundationQuestionEdition
 // Even empty answer keys identify a legacy validator's saved question set.
 if(saved)return undefined
 return effectiveTrack(typeof track==='string'?track:null)==='cpa'?CPA_EDITION:'honors-v1'
}
export const CPA_HINT='Follow the numbered steps. Keep the sign and unit. Explain your answer in one short sentence when asked.'
export const CPA_LEARN='Read the matching slides. Try each step in your own answer box. Then compare your thinking with your group. Keep your own answers.'
export const CPA_EXIT='Work on your own. Use the given equation or steps. Include units and a short explanation when asked.'
export function cpaFoundation(lesson:LessonAssignment):LessonAssignment {
 if(!lesson.foundation)return lesson
 const bank=authored as Record<string,{prompt:string;explanation:string;blooms:NonNullable<LessonQuestion['demand']>['blooms'];dok:1|2|3}>
 const sections=lesson.sections.map((section,i)=>({...section,learn:i===3?CPA_EXIT:CPA_LEARN,questions:section.questions.map(q=>{
  const a=bank[q.id];if(!a)throw Error('Missing CPA question: '+q.id)
  return {...q,prompt:a.prompt,explanation:a.explanation,hint:CPA_HINT,demand:{blooms:a.blooms,dok:a.dok,evidence:a.explanation}}
 })}))
 return {...lesson,sections,questions:sections.flatMap(s=>s.questions),targetNote:'CPA guided edition: judge the evidence requested by these questions against the linked learning targets. Equation selection and other supplied steps are support, not independent evidence. Do not infer mastery of omitted Honors tasks. Rate each student’s own answers and private reflections; peer writing is context. Distinguish supplied sample analysis from measurements the student collected. Completion does not set mastery.'}
}
