import test from 'node:test'
import assert from 'node:assert/strict'
import { motionAt, walkAt, deflection } from './physics-explainer'
import { applyTeachingToolCommand, initialTeachingTool } from './teaching-tool-spec'
import { physicsExplainerBlocks, PHYSICS_EXPLAINERS } from '@/data/explainers/physics-explainers'
import { withLessonPresentationDeck } from '@/data/lesson-decks'
import { collectTextbookActivities } from './textbook-group-activities'
import type { BlockDocument, ExSection } from '@/data/content-blocks'

test('physical invariants: return trip, turning point, closest approach and derivative limit',()=>{
 assert.deepEqual(motionAt(4,0,-4,1),{x:-8,v:0,a:1})
 for(const path of ['return','square'] as const){const p=walkAt(8,path);assert.equal(p.distance,32);assert.equal(p.x,0);assert.equal(p.y,0)}
 assert.equal(walkAt(8,'straight').x,32)
 assert.equal(deflection(1,0).hit,true);assert.equal(deflection(1,180).hit,true)
 const p=deflection(1,90);assert.equal(p.hit,false);assert.ok(Math.abs(p.closest-20/Math.sqrt(65))<1e-10)
 assert.ok(Math.abs(p.speed-Math.sqrt(65))<1e-10)
})
test('commands reject invalid ranges, nonfinite values, unknown keys and frames',()=>{
 const block=physicsExplainerBlocks()[1]; if(block.teachingTool?.kind==='physics-explainer')delete block.teachingTool.source; const old=initialTeachingTool(block)
 for(const state of [{frame:-1},{frame:99},{frame:1.5},{time:Infinity},{time:NaN},{burn:5},{angle:181},{interval:0},{massPower:.5},{path:'unsafe'},{grade:3},{setup:'offset'}])assert.equal(applyTeachingToolCommand(block,old,{block_id:block.id,state}),null,JSON.stringify(state))
 const next=applyTeachingToolCommand(block,old,{block_id:block.id,state:{frame:6,angle:90,burn:1},mode:'practice'})!
 assert.equal(next.state.frame,6);assert.equal(next.mode,'practice');assert.equal(old.state.frame,0)
 assert.equal(applyTeachingToolCommand(block,next,{block_id:block.id,reset:true})!.state.frame,0)
})
test('six supplemental explainers preserve original blocks, completion requirements and lesson identity',()=>{
 const document:BlockDocument={schemaVersion:1,blocks:[{id:'work',type:'prose',markdown:'Existing work'}]}
 const result=withLessonPresentationDeck(document,{unit_id:'unit-1',slug:'u1-d03',lesson_number:3})
 assert.equal(result.blocks[0],document.blocks[0]);assert.equal(result.blocks.length,7)
 assert.equal(withLessonPresentationDeck(result,{unit_id:'unit-1',slug:'u1-d03'}).blocks.length,7)
 assert.equal(withLessonPresentationDeck(document,{unit_id:'unit-2',slug:'u2-d03'}),document)
 assert.ok(physicsExplainerBlocks().every(b=>b.requiredForCompletion===false&&b.referencePanel&&b.targetId))
 assert.equal(PHYSICS_EXPLAINERS.length,6);assert.ok(PHYSICS_EXPLAINERS.every(e=>e.frames.length>=6&&e.frames.filter(f=>f.discussion).length>=2))
})
test('textbook activities respect section restrictions and never attach the whole chapter or answer key',()=>{
 const doc:BlockDocument={schemaVersion:1,blocks:[{id:'read',type:'reading',chapter:4,sectionIds:['4.3'],thinkAndSolve:[44]},{id:'exercise',type:'concept_exercise',capture:true,chapter:4,sectionIds:['4.3']}]}
 const sections:ExSection[]=['4.2','4.3'].map(id=>({id,label:id,pageStart:1,pageEnd:2,items:[{n:1,type:'multiple_choice',prompt:'A sample question',options:[{letter:'A',text:'One'},{letter:'B',text:'Two'}]}]}))
 const activities=collectTextbookActivities(doc,[{chapter:4,sections}],[])
 assert.equal(activities.length,3);assert.ok(activities.every(a=>!a.id.includes('4.2')))
 assert.match(activities.find(a=>a.id.startsWith('exercise:'))!.prompt,/A\. One\nB\. Two/)
 assert.ok(!JSON.stringify(activities).includes('correct'))
})
