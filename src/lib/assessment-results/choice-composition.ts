import type {ResultActivity} from './types'
/** A menu owns the choice grade. Native evidence stays linked to that column;
 * attached quizzes retain their independent columns and review workflow. */
export function composeChoiceResults(activities:ResultActivity[]) {
 const owned=new Set<string>()
 for(const choice of activities.filter(a=>a.kind==='choice')) {
   const keys=choice.sourceKeys??(choice.lessonIds??[]).map(id=>'lesson:'+id)
   const sources=activities.filter(a=>a.kind!=='choice'&&(keys.includes(a.key)||['reflection','video'].includes(a.kind)&&keys.includes('lesson:'+a.sourceId)))
   choice.evidenceActivities=sources
   choice.targetIds=[...new Set([...(choice.targetIds??[]),...sources.flatMap(s=>s.targetIds??[])])]
   choice.unitIds=[...new Set([...choice.unitIds,...sources.flatMap(s=>s.unitIds)])]
   for(const native of sources) {
     owned.add(native.key)
     for(const [user,cell] of Object.entries(choice.cells)) {
       const evidence=native.cells[user];if(!evidence||cell.state==='excused')continue
       cell.needsReview ||= evidence.needsReview
       cell.pendingTargets=[...new Set([...(cell.pendingTargets??[]),...(evidence.pendingTargets??(evidence.needsReview?native.targetIds??[]:[]))])]
       if(evidence.assessment)cell.assessment=evidence.assessment
       if(evidence.submittedAt)cell.submittedAt=evidence.submittedAt
     }
   }
   for(const quiz of activities.filter(a=>choice.followUpKeys?.includes(a.key)))for(const [user,cell]of Object.entries(choice.cells)) {
     const evidence=quiz.cells[user];if(!evidence||!['not_started','excused'].includes(evidence.state))continue
     if(cell.state==='excused')quiz.cells[user]={state:'excused',label:'EX',detail:'Unused optional choice',needsReview:false}
     else if(cell.label==='Not chosen')quiz.cells[user]={...evidence,label:'Not chosen',detail:'Unlocks after its chosen activity is submitted',needsReview:false}
   }
 }
 // Requirement zeroes inherit their section's mapping, including native sources.
 for(const missing of activities.filter(a=>a.kind==='choice'&&!a.sourceId))missing.unitIds=[...new Set(activities.filter(a=>a.kind==='choice'&&a.choiceSectionId===missing.choiceSectionId&&a.sourceId).flatMap(a=>a.unitIds))]
 return activities.filter(a=>!owned.has(a.key))
}
