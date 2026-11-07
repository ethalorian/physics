import {cpaFoundation, CPA_EDITION, type EditionState} from './cpa'
import type { LessonAssignment } from '../catalog'

// Retain one independent exit and at least one individual response at every discussion.
// The lab keeps prediction, measurements, slope calculations, revision and transfer.
export const coreQuestions: Record<string, string[]> = {
 'day-one':['f1-source','f1-evidence','f1-predict','f1-wonders','f1-question'],
 'day-two':['f2-position','f2-distance','f2-walk','f2-track','f2-transfer'],
 'day-three':['f3-predict','f3-trials','f3-slopes','f3-revise','f3-transfer','f3-exit'],
 'day-four':['f4-axis','f4-area','f4-diagonal','f4-model','f4-exit-vector'],
 'day-five':['f5-start','f5-endpoint','f5-claim','f5-bound','f5-exit-window'],
 'day-six':['f6-translate','f6-add','f6-components','f6-quadrant','f6-exit-sum'],
 'day-seven':['f7-definition','f7-rate','f7-graph','f7-signs','f7-exit-transfer'],
 'day-eight':['f8-equation','f8-select','f8-braking','f8-reversal','f8-exit-stop'],
 'day-nine':['f9-law','f9-demo','f9-balance','f9-passenger','f9-exit-transfer'],
}

export function foundationEdition(lesson:LessonAssignment,state?:EditionState|null){
 const ids=lesson.foundation && coreQuestions[lesson.foundation]
 if(!ids)return state?.foundationQuestionEdition===CPA_EDITION?cpaFoundation(lesson):lesson
 // The existing save validator serializes a key for every assigned question, even blanks.
 // A legacy draft or submission must always reopen under its original contract.
 if(state?.foundationQuestionEdition!==CPA_EDITION&&lesson.questions.some(q=>!ids.includes(q.id)&&Object.prototype.hasOwnProperty.call(state?.answers??{},q.id)))return lesson
 const sections=lesson.sections.map(section=>({...section,questions:section.questions.filter(q=>ids.includes(q.id))}))
 const core={...lesson,sections,questions:sections.flatMap(s=>s.questions)}
 return state?.foundationQuestionEdition===CPA_EDITION?cpaFoundation(core):core
}
