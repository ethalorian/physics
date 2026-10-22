import 'server-only'
import { CONNECTED_CHAPTERS } from '@/components/readings/interactive/connected-chapter-catalog'
import { chapterTwoDefinition } from '@/components/readings/interactive/chapter-two-definition'
import type { SyllabusStep, SyllabusWord } from '@/lib/reading-syllabus'
import type { ReadingTarget } from '@/lib/textbook-assignments'
import type { InteractiveChapterDefinition } from '@/components/readings/interactive/reader-contract'

const pilotWords:SyllabusWord[][]=[
 [{term:'force',definition:'A push or pull caused by an interaction.'},{term:'net force',definition:'The vector sum of all external forces acting on a chosen object.'}],
 [{term:'equilibrium',definition:'A condition of zero net force and no change in velocity.'},{term:'tension',definition:'A pulling force transmitted along a taut rope or cable.'}],
 [{term:'normal force',definition:'A support force perpendicular to a contact surface.'},{term:'weight',definition:'The gravitational force acting on an object.'}],
 [{term:'static equilibrium',definition:'Equilibrium while an object remains at rest.'},{term:'dynamic equilibrium',definition:'Equilibrium while an object moves at constant velocity.'}],
 [{term:'vector',definition:'A quantity with magnitude and direction.'},{term:'component',definition:'The part of a vector along a chosen direction.'}],
]
function templates(d:InteractiveChapterDefinition,words:SyllabusWord[][],situations:{prompt:string;reasoning:string}[]):SyllabusStep[]{
 return d.sections.map((s,i)=>({id:`textbook-${d.book}-${s.number.replace('.','-')}`,sourceBook:d.book,selectionRequired:true,
  unit:'',title:`${d.book==='hewitt'?'Hewitt':'OpenStax'} ${s.number} · ${s.title}`,focus:s.target,chapter:d.book==='hewitt'?d.chapter:2,sections:d.book==='hewitt'?[s.number]:[],prerequisites:[],words:words[i],vocabularyTarget:'',
  ...(d.book==='openstax'?{honorsReading:{sections:[s.number],from:s.page,to:Number(s.pages.split('–').at(-1)),focus:s.target}}:{}),
  readingCheck:{prompt:`Explain your choice for this section check: ${s.check.prompt}\nOptions: ${s.check.options.join(' / ')}\nUse a diagram, relationship, or example from section ${s.number} to justify your answer.`,guide:`${s.check.options[s.check.correct]} — ${s.check.feedback[s.check.correct]} ${s.check.teacher}`,target:'',reference:`Section ${s.number} · Explain`},
  quizCheck:{prompt:`Start with this situation from the reading: ${situations[i].prompt}\nChange one physically meaningful condition, state what stays fixed, and predict the new outcome. Explain why it differs from (or agrees with) the original using a labeled sketch, words, or a calculation.`,guide:`Original reasoning: ${situations[i].reasoning}\nCredit a clearly specified change, a prediction consistent with the changed condition, and a causal explanation with appropriate units or diagram. A copied original answer without a changed case is insufficient.`,target:''},
  honors:{prompt:`Choose a limiting case or assumption in section ${s.number}. Describe a specific situation where the simple model needs revision and explain what additional information or physics is needed.`,guide:`Section focus: ${s.target}. ${s.check.teacher} Credit a valid limit or changed assumption and a physically consistent explanation of its consequence.`,target:''}
 }))
}
/** Original lesson content supplies the vocabulary and prompts; teachers explicitly map curriculum targets. */
export const TEXTBOOK_SYLLABUS:SyllabusStep[]=[
 ...templates(chapterTwoDefinition,pilotWords,chapterTwoDefinition.sections.map(s=>({prompt:s.check.prompt,reasoning:s.check.teacher}))),
 ...CONNECTED_CHAPTERS.flatMap(({definition,lessons})=>templates(definition,lessons.map(s=>s.terms.map(([term,definition])=>({term,definition}))),lessons.map(s=>s.worked))),
]
export function mapTextbookTargets(step:SyllabusStep,targets:ReadingTarget[],selection:{unit:unknown;reading_target:unknown;vocabulary_target:unknown}):SyllabusStep{
 if(!step.selectionRequired)return step
 const unit=String(selection.unit)
 if(!/^unit-[1-8]$/.test(unit))throw Error('Choose a curriculum unit for this reading.')
 const available=targets.filter(t=>t.program==='physics'&&t.unit_id===unit)
 const reading=available.find(t=>t.id===selection.reading_target),vocab=available.find(t=>t.id===selection.vocabulary_target&&t.domain==='knowledge')
 if(!reading?.slug||!vocab?.slug)throw Error('Choose an available reading target and a vocabulary Knowledge target from this unit.')
 return {...step,unit,vocabularyTarget:vocab.slug,readingCheck:{...step.readingCheck,target:reading.slug},quizCheck:{...step.quizCheck,target:reading.slug},honors:{...step.honors,target:reading.slug}}
}
