import type { BlockDocument, ExSection } from '@/data/content-blocks'
import { TEXTBOOK_SECTIONS } from '@/data/textbook-sections'
import type { ReadingAssignment } from '@/lib/textbook-assignments'

export interface TextbookGroupActivity { id:string; label:string; prompt:string; blockId:string|null; targetId:string|null; targetSlug:string|null; bookUrl:string; debrief:string }
const debrief='Compare two groups’ explanations. Which evidence or equation supports the claim? Resolve one disagreement, then each student records a revised explanation.'
export function collectTextbookActivities(doc:BlockDocument,chapters:{chapter:number;sections:ExSection[]}[],assignments:ReadingAssignment[]):TextbookGroupActivity[] {
 const activities:TextbookGroupActivity[]=[]
 for(const b of doc.blocks) {
  if(b.type!=='reading'&&b.type!=='concept_exercise')continue
  const base={blockId:b.id,targetId:null,targetSlug:b.targetId??null,bookUrl:`/textbook?ch=${b.chapter}`,debrief}
  if(b.type==='reading') {
   for(const id of b.sectionIds) {
    const section=TEXTBOOK_SECTIONS[b.chapter]?.sections.find(s=>s.id===id)
    if(section?.conceptCheck)activities.push({...base,id:`reading:${b.id}:${id}`,label:`§${id} · ${section.title}`,prompt:`Conceptual Physics §${id}, p. ${section.page}\n\n${section.conceptCheck}`})
   }
   for(const n of b.thinkAndSolve??[])activities.push({...base,id:`solve:${b.id}:${n}`,label:`Chapter ${b.chapter} · Think and Solve ${n}`,prompt:`Open Conceptual Physics Chapter ${b.chapter}, Think and Solve question ${n}. Read the full problem and figure in the textbook, then agree on a solution with units and a reasonableness check.`})
  } else {
   for(const section of chapters.find(c=>c.chapter===b.chapter)?.sections??[]) {
    if(b.sectionIds?.length&&!b.sectionIds.includes(section.id))continue
    for(const item of section.items)activities.push({...base,id:`exercise:${b.id}:${section.id}:${item.n}`,label:`§${section.id} · Activity ${item.n}`,prompt:`Conceptual Physics activity §${section.id} · ${item.n}\n\n${item.prompt}${item.options?.length?'\n\n'+item.options.map(o=>`${o.letter}. ${o.text}`).join('\n'):''}`})
   }
  }
 }
 for(const a of assignments)for(const q of a.questions)activities.push({id:`assignment:${a.id}:${q.id}`,label:`${a.title} · ${q.reference||'Question'}`,prompt:[a.reading,q.reference,q.prompt].filter(Boolean).join('\n\n'),blockId:null,targetId:q.target_id,targetSlug:null,bookUrl:`/textbook?ch=${a.chapter}`,debrief})
 return activities
}
export function groupTextbookPrompt(activity:TextbookGroupActivity):string {
 return `${activity.prompt}\n\n1. Think independently for 30 seconds.\n2. Take turns explaining; check the text, diagram, or calculation together.\n3. Submit one group claim with evidence and reasoning. Include a diagram or equation when useful.\n4. Identify a disagreement or uncertainty to discuss.\n\n[Open textbook](${activity.bookUrl})`
}
