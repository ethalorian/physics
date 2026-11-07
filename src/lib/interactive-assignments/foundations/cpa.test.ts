import test from 'node:test'
import assert from 'node:assert/strict'
import {ALL_ASSIGNMENTS,submissionMatchesAssignment} from '../catalog'
import {foundationEdition,coreQuestions} from './core-questions'
import {resolveFoundationQuestionEdition,CPA_EDITION} from './cpa'
import {CPA_LANGUAGE} from './cpa-language'
import {validateVelocityState,missingVelocityAnswers} from '../velocity'
import {labRubric} from '../lab-grades'
import {foundationSlides} from './slides'
import guides from '@/data/foundations/reading-guides.json'
import guideMap from '@/data/foundations/teaching-guide-map.json'
import topics from '@/data/foundations/teaching-guide-topics.json'
const foundations=ALL_ASSIGNMENTS.filter(l=>l.foundation)
test('all 16 CPA versions retain IDs, targets, labs, exits and input types without mutating Honors',()=>{
 assert.equal(foundations.length,16)
 let count=0
 for(const original of foundations){
  const snapshot=JSON.stringify(original),honors=foundationEdition(original),cpa=foundationEdition(original,{foundationQuestionEdition:CPA_EDITION})
  assert.equal(cpa.sections.length,4)
  assert.deepEqual(cpa.questions.map(q=>q.id),honors.questions.map(q=>q.id))
  assert.deepEqual(cpa.targets,honors.targets);assert.equal(cpa.lab,honors.lab)
  assert.deepEqual(labRubric(cpa).map(({id,possible})=>({id,possible})),labRubric(honors).map(({id,possible})=>({id,possible})))
  for(const q of cpa.questions){const old=honors.questions.find(x=>x.id===q.id)!;for(const k of ['id','part','targets','independent','diagram','answer','correct','options','tolerance','unit'] as const)assert.deepEqual(q[k],old[k],q.id+' '+k);assert(q.prompt.length>30);assert(q.explanation);assert(q.demand!.dok<=2);count++}
  assert(cpa.sections.every(s=>s.questions.length));assert(cpa.sections[3].questions.every(q=>q.independent));assert.equal(JSON.stringify(original),snapshot)
 }assert.equal(count,85)
})
test('automatic choice is class-driven and existing saved contracts survive track changes',()=>{
 for(const track of ['cpa',null,undefined])assert.equal(resolveFoundationQuestionEdition(null,track),'cpa-v1')
 for(const track of ['honors','ap'])assert.equal(resolveFoundationQuestionEdition(null,track),'honors-v1')
 assert.equal(resolveFoundationQuestionEdition({answers:{a:''}},'cpa'),undefined)
 assert.equal(resolveFoundationQuestionEdition({answers:{}},'cpa'),undefined)
 assert.equal(resolveFoundationQuestionEdition({foundationQuestionEdition:'cpa-v1'},'honors'),'cpa-v1')
 assert.equal(resolveFoundationQuestionEdition({foundationQuestionEdition:'honors-v1'},'cpa'),'honors-v1')
})
test('legacy full and shortened drafts reopen their exact prior question set',()=>{
 for(const l of foundations){const core=coreQuestions[l.foundation!];if(!core)continue
 const old={answers:Object.fromEntries(l.questions.map(q=>[q.id,'Saved original response']))}
 assert.equal(foundationEdition(l,old),l)
 const short={answers:Object.fromEntries(core.map(id=>[id,'']))}
 assert.deepEqual(foundationEdition(l,short).questions.map(q=>q.id),core)
 assert.equal(foundationEdition(l,{...old,foundationQuestionEdition:'cpa-v1'}).questions.length,core.length)
 }
})
test('server validator never trusts an edition marker; server attaches its resolved choice',()=>{
 const lesson=foundationEdition(foundations[0],{foundationQuestionEdition:CPA_EDITION})
 const state=validateVelocityState({foundationQuestionEdition:'cpa-v1',answers:{}},lesson.questions)
 assert.equal(state.foundationQuestionEdition,undefined)
 assert.equal(missingVelocityAnswers(state,lesson.questions).length,lesson.questions.length)
 state.foundationQuestionEdition=CPA_EDITION
 assert(submissionMatchesAssignment(state,foundations[0]))
})
test('CPA student-facing questions, hints and objective explanations have both translations',()=>{
 for(const l of foundations)for(const q of foundationEdition(l,{foundationQuestionEdition:CPA_EDITION}).questions){
  for(const locale of ['es','pt-BR'] as const){
   assert(CPA_LANGUAGE[locale][q.prompt],q.id+' prompt '+locale);assert(CPA_LANGUAGE[locale][q.hint],q.id+' hint')
   const translated=CPA_LANGUAGE[locale][q.prompt];assert.equal((translated.match(/\*\*/g)??[]).length%2,0,q.id+' emphasis '+locale)
   if(q.options||q.answer!==undefined)assert(CPA_LANGUAGE[locale][q.explanation],q.id+' explanation')
   const figures=q.prompt.match(/\]\(([^)]+)\)/g)??[];for(const f of figures)assert(translated.includes(f),q.id+' figure')
  }
 }
})
test('every slide has a title-checked concise teaching guide and direct instruction',()=>{
 let count=0
 for(const [key,value]of Object.entries(foundationSlides)){
  const k=key as keyof typeof foundationSlides,entries=guideMap[k]
  assert.equal(entries.length,value.slides.length)
  for(const slide of value.slides){const entry=entries.find(e=>e.number===slide.number);assert.equal(entry?.title,slide.title)
   const topic=topics[entry!.topic as keyof typeof topics];assert(topic)
   for(const loc of ['en','es','pt-BR'] as const){assert(topic.learn[loc].trim());assert(topic.learn[loc].split(/\s+/).length<=65, entry!.title+' guide is too long')}
   const step='teachingStep' in slide?slide.teachingStep:(guides as Record<string,Record<string,string>>)[k]?.[slide.title];assert(step,key+' '+slide.number);count++
  }
 }assert.equal(count,497)
})
