import { TEXTBOOK_SECTIONS, sectionPageRange } from '@/data/textbook-sections'
import type { ReadingBlock } from '@/data/content-blocks'
import { matchReadingTarget, numberedReadingReference } from './textbook-target-mapping'
import type { ReadingAssignment, ReadingTarget } from './textbook-assignments'

import { lessonReadingKey } from './lesson-reading-key'
/** A prefilled draft uses the same assignment schema and reviewed target mapping. */
export function lessonReadingDraft(lesson:{id:string;title:string},block:ReadingBlock,courseId:string,targets:ReadingTarget[],program:string,newId:()=>string):ReadingAssignment {
  const sections=TEXTBOOK_SECTIONS[block.chapter]?.sections.filter(s=>block.sectionIds.includes(s.id))??[]
  const range=sectionPageRange(block.sectionIds)
  const authored=block.assignmentChecks??[
    ...sections.filter(s=>s.conceptCheck).map(s=>({reference:`Section ${s.id} · Concept Check`,prompt:s.conceptCheck!,targetId:''})),
    ...(block.thinkAndSolve??[]).map(n=>({reference:numberedReadingReference(block.chapter,n),prompt:'',targetId:''}))
  ]
  return {id:newId(),origin_key:lessonReadingKey(lesson.id,block.id),course_id:courseId,title:`${lesson.title} · Read & respond`.slice(0,160),chapter:block.chapter,
    reading:`Sections ${block.sectionIds.join(', ')}${range?` · printed p. ${range.from}${range.to>range.from?'–'+range.to:''}`:''}`,
    section_ids:block.sectionIds,instructions:block.focus??'Read the assigned sections, explain your thinking, then submit your checks for teacher review.',
    questions:authored.map(q=>({id:newId(),reference:q.reference,prompt:q.prompt,target_id:(q.targetId?targets.find(t=>(t.id===q.targetId||t.slug===q.targetId)&&t.program===program):matchReadingTarget(block.chapter,q.reference,targets,program,q.prompt).target)?.id??''})),due_at:null,status:'draft',version:0,created_at:new Date().toISOString()}
}
