import test from 'node:test'
import assert from 'node:assert/strict'
import { initialReadingStep, syllabusInteractiveHref } from './reading-authoring'
import { buildSyllabusDrafts, buildSyllabusReading } from './reading-syllabus'
import { interactiveChapterForAssignment } from '@/components/readings/interactive/registry'
import { assignmentScope } from '@/components/readings/interactive/assignment-scope'
import { READING_SYLLABUS } from '@/data/reading-syllabus'
import { TEXTBOOK_SYLLABUS } from '@/data/textbook-syllabus'
import { HONORS_READING_MAP } from './openstax-physics'
import { readingDashboardGroups, readingDashboardHref } from './reading-dashboard'
import type { SyllabusCatalog } from './reading-syllabus'

const catalog: SyllabusCatalog = {
  courses: [{id:'cpa',name:'CPA',program:'physics',track:'cpa',section:null},{id:'honors',name:'Honors',program:'physics',track:'honors',section:null}],
  steps: READING_SYLLABUS.map(step=>({...step,honorsReading:HONORS_READING_MAP[step.id]})),
  textbookSteps: TEXTBOOK_SYLLABUS, targets:[],bundles:[],readOnly:false,
}
test('new readings start in the correct interactive book and old chapter links retain their chapter',()=>{
  assert.equal(initialReadingStep(catalog,{creating:true,courseId:'cpa'})?.sourceBook,'hewitt')
  assert.equal(initialReadingStep(catalog,{creating:true,courseId:'honors'})?.sourceBook,'openstax')
  const old=initialReadingStep(catalog,{creating:true,courseId:'cpa',chapter:'4'})!
  assert.equal(old.chapter,4)
  assert.equal(syllabusInteractiveHref(old,catalog.courses[0]),'/readings/preview?course_id=cpa&step_id='+old.id)
  assert.equal(initialReadingStep(catalog,{creating:true,courseId:'honors',book:'hewitt'})?.sourceBook,'hewitt')
})
test('saved section links reopen the section and all four connected resources',()=>{
  const step=TEXTBOOK_SYLLABUS.find(step=>step.sourceBook==='openstax'&&step.honorsReading?.sections.includes('2.3'))!
  const url=new URL(readingDashboardHref({view:'assignments',create:true,resource:'reading',courseId:'honors',stepId:step.id}),'https://local')
  assert.equal(initialReadingStep(catalog,{creating:true,stepId:url.searchParams.get('step_id')})?.id,step.id)
  const resource=(id:string)=>({id,title:id,status:'draft'})
  const group=readingDashboardGroups({...catalog,bundles:[{course_id:'honors',step_id:step.id,reading_id:'r',practice_id:'p',reading_quiz_id:'q',vocabulary_quiz_id:'v',created_at:'',reading:resource('r'),practice:resource('p'),readingQuiz:resource('q'),vocabularyQuiz:resource('v')}]},null,null)[0]
  assert.equal(group.step?.id,step.id)
  assert.equal(group.resources.length,4)
  assert.equal(group.title,step.title)
  assert.equal(syllabusInteractiveHref(step,catalog.courses[1]),'/readings/preview?course_id=honors&step_id='+step.id)
})
test('Honors preview follows its primary source; an explicit Hewitt section stays Hewitt',()=>{
  const mapped=catalog.steps.find(step=>step.id==='position')!
  assert.equal(syllabusInteractiveHref(mapped,catalog.courses[1]),'/readings/preview?course_id=honors&step_id='+mapped.id)
  assert.equal(syllabusInteractiveHref(mapped,catalog.courses[0]),'/readings/preview?course_id=cpa&step_id='+mapped.id)
  assert.equal(syllabusInteractiveHref({...mapped,sourceBook:'hewitt'},catalog.courses[1]),'/readings/preview?course_id=honors&step_id='+mapped.id)
  assert.equal(syllabusInteractiveHref({...mapped,passage:'Course reading',honorsReading:undefined},catalog.courses[0]),null)
  assert.equal(syllabusInteractiveHref({...mapped,honorsReading:{from:1,to:2,sections:['1.1','2.1'],focus:'Across chapters'}},catalog.courses[1]),null)
})

test('saved syllabus preview opens the actual reading, retaining edited questions and boundaries',()=>{
 const step=catalog.steps.find(s=>s.id==='displacement')??catalog.steps[8]
 assert.equal(syllabusInteractiveHref(step,catalog.courses[1],'saved-reading'),'/readings/saved-reading?reader=interactive')
 assert.equal(syllabusInteractiveHref(step,catalog.courses[0],'edited-reading'),'/readings/edited-reading?reader=interactive')
})
test('unprepared previews use exactly the reading that draft preparation creates',()=>{
 for(const course of catalog.courses){
  const selected=[catalog.steps[8],TEXTBOOK_SYLLABUS.find(s=>s.sourceBook===(course.track==='honors'?'openstax':'hewitt')&&(s.honorsReading?.sections??s.sections).includes(course.track==='honors'?'2.3':'4.2'))!]
  for(const step of selected){
   const targetSlugs=[...new Set([step.vocabularyTarget,step.readingCheck.target,step.quizCheck.target,step.honors.target,...catalog.steps.flatMap(s=>[s.quizCheck.target])])]
   const targets=targetSlugs.map((slug,i)=>({id:'target-'+i,slug,statement:slug,program:'physics',domain:'knowledge',unit_id:step.unit}))
   const nextId=()=>{let n=0;return()=>String(++n)}
   const preview=buildSyllabusReading(step,catalog.steps,course,slug=>targets.find(t=>t.slug===slug)!.id,nextId())
   const draft=buildSyllabusDrafts(step,catalog.steps,course,targets,nextId()).reading
   assert.deepEqual({...preview,created_at:''},{...draft,created_at:''})
   const definition=interactiveChapterForAssignment(preview)!
   assert.ok(definition)
   const required=course.track==='honors'?step.honorsReading!.sections:step.sections
   assert.deepEqual(assignmentScope(definition,preview).sections.map(s=>s.number),required)
   assert.equal(preview.questions[0].prompt,step.readingCheck.prompt)
   assert.equal(preview.status,'draft')
  }
 }
})
