/** Bloom’s describes the thinking; Webb DOK describes the task’s complexity.
 * Format, verbosity, verbs, and completion alone never establish a level. */
export const BLOOMS = ['Remember','Understand','Apply','Analyze','Evaluate','Create'] as const
export type AssessmentDemand = { blooms:typeof BLOOMS[number]; dok:1|2|3|4; evidence:string }
export const ASSESSMENT_DESIGN_STANDARD = `Vary the thinking across the assignment: include an accessible concept check, application in a new situation, and analysis or evaluation supported by evidence. Use authentic multiple choice, numerical/modeling problems, and written or drawn reasoning where each fits. Track Bloom’s separately from Webb DOK. Do not assign DOK from a verb or the response format. Scaffold access to the reasoning without supplying its conclusion. Across a learning sequence, include all six Bloom’s processes and DOK 1–4. Reserve DOK 4 for an extended investigation with planning, multiple evidence sources or conditions, testing, revision, and synthesis; a short question or a design proposal alone is not DOK 4. Treat a score or completed response as evidence for teacher review, never an automatic mastery rating.`
export function validateDemand(raw:unknown):AssessmentDemand|undefined {
 if(raw===undefined)return undefined
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Choose the question’s Bloom’s process and DOK.')
 const d=raw as AssessmentDemand
 if(!BLOOMS.includes(d.blooms)||![1,2,3,4].includes(d.dok)||typeof d.evidence!=='string'||!d.evidence.trim()||d.evidence.length>500)throw Error('Describe the thinking and evidence required by this question.')
 return {blooms:d.blooms,dok:d.dok,evidence:d.evidence.trim()}
}
export const demand=(blooms:AssessmentDemand['blooms'],dok:AssessmentDemand['dok'],evidence:string):AssessmentDemand=>({blooms,dok,evidence})
