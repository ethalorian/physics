import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { inertiaDefinition, newtonDefinition } from './connected-chapters'
import { CONNECTED_CHAPTERS } from './connected-chapter-catalog'
import { ConnectedChapterFigure } from './ConnectedChapterFigures'
import { conversionCatalog } from './conversion-catalog'
import { interactiveChapterForAssignment } from './registry'
import type { ReadingAssignment } from '@/lib/textbook-assignments'
const a: ReadingAssignment = {id:'fixture',course_id:'course',chapter:3,title:'Inertia',reading:'Read inertia',section_ids:['3.4'],instructions:'',questions:[],due_at:null,status:'published',version:1,created_at:''}
test('assignments require complete coverage of the selected source and language',()=>{
  assert.equal(interactiveChapterForAssignment(a),inertiaDefinition)
  assert.equal(interactiveChapterForAssignment({...a,section_ids:[]}),inertiaDefinition)
  assert.equal(interactiveChapterForAssignment(a,'es'),null)
  assert.equal(interactiveChapterForAssignment({...a,honors_reading:{sections:['4.2','4.3'],from:160,to:167,focus:''}}),newtonDefinition)
  assert.equal(interactiveChapterForAssignment({...a,honors_reading:{sections:['4.1','4.5','4.8'],from:159,to:195,focus:''}}),newtonDefinition)
  for (const sections of [['4.9'],['3.4','4.2']]) assert.equal(interactiveChapterForAssignment({...a,honors_reading:{sections,from:159,to:195,focus:''}}),null)
})
test('every source chapter is inventoried and partial coverage stays explicit',()=>{
  assert.equal(conversionCatalog.length,new Set(conversionCatalog.map(c=>`${c.book}:${c.chapter}`)).size)
  assert.equal(conversionCatalog.find(c=>c.book==='hewitt'&&c.chapter===3)?.status,'ready')
  const openstax=conversionCatalog.find(c=>c.book==='openstax'&&c.chapter===4)!
  assert.equal(openstax.status,'ready');assert.deepEqual(openstax.remaining,[])
  assert.equal(conversionCatalog.filter(c=>c.status==='ready').length,73)
  assert.equal(conversionCatalog.reduce((sum,c)=>sum+c.ready.length,0),551)
  for(const c of conversionCatalog) {assert.ok(c.sections.length);assert.equal(c.ready.length+c.remaining.length,c.sections.length);assert.equal(!!c.href,c.ready.length>0)}
})
test('adapted source figures exist in the rendered chapter, and check feedback is complete',()=>{
  for(const {definition,lessons} of CONNECTED_CHAPTERS) {
    const html=lessons.map(s=>renderToStaticMarkup(createElement(ConnectedChapterFigure,{kind:s.visual,id:`figure-${s.id}`}))).join('')
    const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,`Unique figure IDs in ${definition.book} ${definition.chapter}`)
    for(const f of definition.visualCoverage)for(const anchor of f.anchors)assert.ok(html.includes(`id="${anchor}"`),`${definition.book} source ${f.sourceLabel}`)
    for(const s of lessons){assert.ok(s.paragraphs.join(' ').split(/\s+/).length>=150);assert.equal(s.check.feedback.length,s.check.options.length);assert.ok(s.check.teacher);assert.ok(s.terms.length>=2)}
  }
})
test('source question references do not cross book or exercise boundaries',()=>{
  const q=(reference:string)=>({id:'q',reference,prompt:'',target_id:'t'})
  assert.equal(inertiaDefinition.questionSection(q('Check Concepts #12')),'mass-and-weight')
  assert.equal(inertiaDefinition.questionSection(q('Check Concepts #19')),'shared-motion')
  assert.equal(inertiaDefinition.questionSection(q('Think and Solve #12')),null)
  assert.equal(inertiaDefinition.questionSection(q('OpenStax Section 3.4')),null)
  assert.equal(newtonDefinition.questionSection(q('Section 4.2 · Explain')),'first-law')
  assert.equal(newtonDefinition.questionSection(q('Check Concepts #12')),null)
  assert.equal(newtonDefinition.questionSection(q('Section 3.4')),null)
})

test('every new chapter routes a full reading and its section questions to its own book',()=>{
 for(const {definition} of CONNECTED_CHAPTERS){
  const sections=definition.sections.map(s=>s.number)
  const assignment={...a,chapter:definition.chapter,section_ids:sections,...(definition.book==='openstax'?{honors_reading:{sections,from:1,to:999,focus:''}}:{})}
  assert.equal(interactiveChapterForAssignment(assignment),definition)
  for(const section of definition.sections)assert.equal(definition.questionSection({id:'q',reference:'Section '+section.number+' · Explain',prompt:'',target_id:'t'}),section.id)
 }
})

test('final Hewitt chapters preserve verified printed-page and concept-question boundaries',()=>{
 const expected={38:{page:767,last:777,count:9,first:[1,2,6,10,11,14,18,20,22],lasts:[1,5,9,10,13,17,19,21,22]},39:{page:783,last:801,count:11,first:[1,5,7,8,11,13,17,18,21,23,24],lasts:[4,6,7,10,12,16,17,20,22,23,25]},40:{page:809,last:824,count:8,first:[1,8,12,15,17,18,22,24],lasts:[7,11,14,16,17,21,23,24]}}
 for(const [chapter,spec]of Object.entries(expected)){
 const c=CONNECTED_CHAPTERS.find(c=>c.definition.book==='hewitt'&&c.definition.chapter===+chapter)!
 assert.equal(c.lessons.length,spec.count);assert.equal(c.lessons[0].page,spec.page);assert.ok(c.lessons.at(-1)!.pages.endsWith(String(spec.last)))
 for(let i=0;i<spec.count;i++)for(const q of[spec.first[i],spec.lasts[i]])assert.equal(c.definition.questionSection({id:'q',reference:'Check Concepts #'+q,prompt:'',target_id:'t'}),'section-'+(i+1))
 assert.equal(c.definition.questionSection({id:'q',reference:'Think and Solve #1',prompt:'',target_id:'t'}),null)
 }
})

test('both textbooks are fully covered and final OpenStax sections retain source boundaries',()=>{
 assert.equal(conversionCatalog.length,73)
 for(const c of conversionCatalog){assert.equal(c.status,'ready');assert.deepEqual(c.remaining,[])}
 for(const [chapter,count,start,end]of[[33,6,1569,1596],[34,7,1608,1634]]){
  const c=CONNECTED_CHAPTERS.find(c=>c.definition.book==='openstax'&&c.definition.chapter===chapter)!
  assert.equal(c.lessons.length,count);assert.equal(c.lessons[0].page,start);assert.ok(c.lessons.at(-1)!.pages.endsWith(String(end)))
  assert.equal(c.definition.visualCoverage.length,25)
  for(const s of c.lessons)assert.equal(c.definition.questionSection({id:'q',reference:'Section '+s.number+' · Explain',prompt:'',target_id:'t'}),s.id)
  assert.equal(c.definition.questionSection({id:'q',reference:'Check Concepts #1',prompt:'',target_id:'t'}),null)
 }
})
