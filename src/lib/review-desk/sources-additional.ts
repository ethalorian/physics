import 'server-only'
import { NextRequest } from 'next/server'
import { getMasteryStudentWork } from '@/lib/mastery-student-work'
import { vocabularyProgress } from '@/lib/vocab-mastery'
import { row, rows, type SourceRow } from './sources'
import type { AuthContext } from '@/lib/api-auth'
import type { ReviewDocument } from './types'

export async function loadAdditionalSource(ctx:AuthContext,doc:ReviewDocument,native:SourceRow,id?:string) {
  const a=native.activity,user=doc.userId
  if(['lesson','video','reflection','presentation'].includes(a.kind)) {
    const lessonId=a.kind==='presentation'?'presentation:'+a.sourceId:a.sourceId
    native.workByTarget={}
    native.reviews=await rows('mastery_evidence_reviews',{user_id:user,lesson_id:lessonId},'created_at')
    for(const target of doc.targets){
      const params=new URLSearchParams({user_id:user,unit_id:a.unitIds[0],target_id:target.id,lesson_id:lessonId,...(id&&a.kind!=='presentation'?{submission_id:id}:{})})
      const r=await getMasteryStudentWork(new NextRequest('http://review.internal/api/mastery/student-work?'+params),ctx)
      if(!r.ok)throw Error('Could not load the submitted evidence.')
      const data=await r.json();native.workByTarget[target.id]=data.work
      for(const w of data.work as SourceRow[]){const prior=doc.evidence.find(e=>e.id===w.evidenceKey);if(prior){prior.targetIds.push(target.id);continue}doc.evidence.push({id:w.evidenceKey,prompt:w.prompt||w.lessonTitle,response:w.response,guide:w.teacherGuidance,targetIds:[target.id],context:[w.evidenceSource,w.responseMode,...(w.scaffoldsUsed??[])].filter(Boolean).join(' · ')})}
      const released=native.reviews.find((r:SourceRow)=>Array.isArray(r.evidence)&&r.target_id===target.id&&data.work.length>0&&data.work.every((w:SourceRow)=>r.evidence.some((e:SourceRow)=>e.key===w.evidenceKey||e.evidenceKey===w.evidenceKey)))
      if(released)target.released=released.overall_level
      target.allowSkip=false
    }
    native.lessonId=lessonId;doc.version=id??doc.evidence.map(e=>e.id).join(':');doc.canReturn=!!id&&a.kind!=='presentation';doc.canRelease=doc.canRelease&&!!doc.evidence.length&&!!doc.targets.length
    if(!doc.targets.length)doc.limitation='Link a learning target before recording mastery. Completion alone is not evidence of understanding.'
    return
  }
  if(a.kind==='vocabulary') {
    const task=await row('vocab_tasks',{id:a.sourceId});if(!task)throw Error('Vocabulary task unavailable.');native.task=task
    if(task.quiz_format==='checkpoint'){
      const sub=id?await row('vocab_checkpoint_attempts',{id}):null;if(!sub||sub.user_id!==user||sub.task_id!==task.id)throw Error('Checkpoint unavailable.')
      native.sub=sub;native.checkpoint=true;doc.version=sub.id;doc.attempt=sub.number;doc.gradeMode='points';doc.canRelease=!!sub.submitted_at&&!sub.released_at
      doc.evidence=sub.questions.map((q:SourceRow)=>({id:q.id,prompt:q.prompt,response:q.part==='explain'?sub.answers[q.id]:q.options?.[Number(sub.answers[q.id])]??sub.answers[q.id],guide:q.explanation,targetIds:doc.targets.map(t=>t.id)}))
      doc.scoreItems=sub.questions.map((q:SourceRow)=>({id:q.id,label:q.prompt,possible:q.points,step:1,...(q.part==='explain'?{suggested:sub.scores[q.id]}:{automatic:sub.answers[q.id]===String(q.answer)?q.points:0})}))
      doc.limitation='For a fresh checkpoint reassessment, use the original assignment controls to author new situations. Earlier attempts remain intact.'
    }else{
      const checks=await rows('vocab_checks',{task_id:task.id,user_id:user},'completed_at'),reviews=await rows('vocab_mastery_reviews',{task_id:task.id,user_id:user},'created_at'),sub=checks.find(c=>c.id===id)??checks.find(c=>c.completed_at)
      if(!sub?.completed_at)throw Error('No completed vocabulary submission is available.')
      // The source validates the complete evidence identity when a practice rating is released.
      const progress=vocabularyProgress(task as Parameters<typeof vocabularyProgress>[0],checks as Parameters<typeof vocabularyProgress>[1],reviews as Parameters<typeof vocabularyProgress>[2])
      Object.assign(native,{sub,progress});doc.submissionId=sub.id;doc.version=sub.id;doc.evidence=(sub.result??[]).map((r:SourceRow)=>({id:r.term_id,prompt:r.term??task.words?.find((w:SourceRow)=>w.id===r.term_id)?.term??'Vocabulary response',response:r.response,guide:r.definition,targetIds:doc.targets.map(t=>t.id)}))
      if(task.task_kind==='quiz'){doc.gradeMode='points';doc.scoreItems=(sub.result??[]).map((r:SourceRow)=>({id:r.term_id,label:r.term??'Vocabulary response',possible:1,step:1,...(r.correct!==null&&r.correct!==undefined?{suggested:r.correct?1:0}:{})}))}else doc.targets.forEach(t=>t.allowSkip=false)
      doc.limitation='Vocabulary practice stays available to the student. A quiz reassessment uses the original assignment controls.'
    }
    const jobs=await rows('assessment_suggestions',{source:native.checkpoint?'checkpoint':'vocabulary',source_id:doc.submissionId},'updated_at')
    const suggestion=jobs.find(job=>job.version===(native.sub.submitted_at??native.sub.completed_at)&&job.status==='ready')?.result
    if(suggestion){doc.suggestedFeedback=[suggestion.summary,suggestion.next_time].filter(Boolean).join('\n\n');for(const item of doc.scoreItems){const score=suggestion.scores?.find((score:SourceRow)=>score.id===item.id&&score.possible===item.possible);if(score&&item.automatic===undefined){item.suggested=score.earned;item.feedback=score.feedback}}}
    return
  }
  if(a.kind==='choice') {
    const section=await row('choice_sections',{id:a.choiceSectionId}),option=section?.options?.find((o:SourceRow)=>o.id===a.sourceId),sub=await row('choice_selections',{section_id:a.choiceSectionId,option_id:a.sourceId,user_id:user})
    if(!section||!option||!sub?.artifact_submitted_at){doc.canRelease=false;doc.gradeMode='completion';doc.limitation='Review the linked assignments for this choice. Menu completion and points remain in the choice gradebook.';return}
    Object.assign(native,{section,option,sub});doc.submissionId=section.id+':'+option.id+':'+user;doc.version=String(sub.artifact_version);doc.targets.forEach(t=>{t.allowSkip=false;const rating=sub.artifact_ratings?.[t.id];if(rating?.version===sub.artifact_version)t.released=rating.level});native.reviews=Object.values(sub.artifact_ratings??{}).map((v)=>({id:JSON.stringify(v)}))
    doc.evidence=[{id:'artifact',prompt:[option.problem,option.artifactInstructions].filter(Boolean).join('\n'),response:sub.artifact_response,rendering:'artifact',targetIds:doc.targets.map(t=>t.id),context:'Inspect attachments in the original assignment before making a mastery decision.'}]
    return
  }
  doc.gradeMode='completion';doc.canRelease=false;doc.limitation='Paper hand-in records completion. Use the paired quiz for grades and mastery.'
}
