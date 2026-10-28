import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { activitiesForDeck } from './deck-activities'
import { deckForDay } from '@/data/lesson-decks'
import { coursePlanAssessment } from './course-plan-assessment'
import worksheetCatalog from '@/data/worksheet-deck-activities.json'

const ledger=JSON.parse(fs.readFileSync('resources/worksheet-decks/coverage.json','utf8'))
test('worksheet presets match the current course deck and exact problem start, with no worked answers',()=>{
 for(const d of ledger.decks){
  const unit='unit-'+d.unit
  const activities=activitiesForDeck({plan_unit_id:unit,plan_day:d.day,plan_track:d.track},[])
  if(coursePlanAssessment(unit,d.day)){assert.equal(activities.length,0);continue}
  assert.equal(activities.length,d.questions.filter((q:{role:string})=>q.role!=='worked').length)
  for(const activity of activities){
   const q=d.questions.find((q:{promptSlide:number})=>q.promptSlide+1===activity.slide)
   assert.ok(q);assert.notEqual(q.role,'worked');assert.equal(activity.src,deckForDay(unit,d.day,d.track)?.src)
   assert.ok(activity.prompt.startsWith(q.prompt.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()))
   assert.ok(activity.prompt.length<=1000);assert.ok(activity.id.startsWith('worksheet-v2-'))
  }
 }
})
test('legacy lesson identity resolves the revised worksheet; teacher target selection is explicit for spaced review',()=>{
 const known=worksheetCatalog.find(a=>a.unitId==='unit-1'&&a.day===7&&a.track==='honors'&&a.targetSlug)!
 const activities=activitiesForDeck({plan_track:'honors'},[{id:'fixture-target',slug:known.targetSlug,statement:'Explain changes in velocity.'}],'u1-d07')
 assert.ok(activities.some(a=>a.targetId==='fixture-target'))
 assert.ok(activities.filter(a=>a.kind==='warmup').every(a=>a.targetId===null))
 assert.equal(activitiesForDeck({plan_unit_id:'unit-7',plan_day:19,plan_track:'honors'},[]).length,0)
 assert.ok(activitiesForDeck({plan_unit_id:'trades-etf-1',plan_day:1,plan_track:'cpa'},[]).every(a=>a.src.startsWith('/decks/trades-etf/')))
})
