'use client'
import Link from 'next/link'
import { assessmentResultHref } from '@/lib/assessment-center'
import { useState } from 'react'
import { useLearningResource } from '@/app/home/useLearningWeek'
import type { ChoiceSnapshot } from '@/lib/choice-calendar-server'
import type { ResultActivity } from '@/lib/assessment-results/types'
import SubmissionSuggestions from './SubmissionSuggestions'
import ChoiceLabBrief from '@/components/choices/ChoiceLabBrief'
import { ChoiceGradebook, type ChoiceAction } from '@/components/choices/ChoiceTeacher'
import type { LessonEvidenceReview } from './ResultEvidencePanel'
export default function ChoiceResultReview({activity,studentId,classId,onSaved,onReviewLesson,targets}:{activity:ResultActivity;studentId:string;classId:string;onSaved:()=>void;onReviewLesson:LessonEvidenceReview;targets:{id:string;statement:string}[]}) {
  const {data,error,refresh}=useLearningResource<ChoiceSnapshot>('/api/choice-calendar?class='+encodeURIComponent(classId))
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('')
  const section=data?.sections.find(s=>s.id===activity.choiceSectionId),option=section?.options.find(o=>o.id===activity.sourceId)
  const save:ChoiceAction=async body=>{if(busy||data?.readOnly)return null;setBusy(true);setMessage('');try{const r=await fetch('/api/choice-calendar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),result=await r.json();if(!r.ok)throw Error(result.error);refresh();onSaved();return result}catch(e){setMessage((e as Error).message);return null}finally{setBusy(false)}}
  if(error)return <p role="alert">Could not load this choice. <button onClick={refresh}>Retry</button></p>
  if(!data||!section)return <p>Loading choice evidence…</p>
  return <div className="space-y-4"><ChoiceLabBrief option={option} teacher/>{option?.artifactInstructions && activity.cells[studentId]?.submittedAt && <SubmissionSuggestions source="choice" id={section.id+':'+option.id+':'+studentId}/>} {option?.artifactInstructions&&<p><strong>Turn in: </strong>{option.artifactInstructions}</p>}<ChoiceGradebook section={option?{...section,options:[option]}:section} data={{...data,roster:data.roster.filter(s=>s.id===studentId)}} save={save} busy={busy}/>{(activity.evidenceActivities??[]).filter(a=>!['reflection','video'].includes(a.kind)).map(a=><p key={a.key}><Link className="inline-flex min-h-11 items-center text-primary underline" href={assessmentResultHref(a.kind,a.sourceId,classId,'',studentId)}>Review {a.title} →</Link></p>)}{(activity.lessonIds??[]).map(lesson=><section key={lesson} className="space-y-2"><h4 className="font-semibold">Submitted assignment evidence</h4>{(activity.evidenceActivities?.find(a=>a.sourceId===lesson)?.targetIds??activity.targetIds??[]).map(target=><button key={target} className="block min-h-11 text-left underline" onClick={()=>onReviewLesson(studentId,target,{unitId:activity.unitIds[0],lessonId:lesson,submissionId:activity.evidenceActivities?.find(a=>a.sourceId===lesson)?.cells[studentId]?.submissionId})}>Review {targets.find(t=>t.id===target)?.statement??'learning target'}</button>)}</section>)}{message&&<p role="alert">{message}</p>}</div>
}
