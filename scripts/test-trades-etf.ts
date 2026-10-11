import assert from 'node:assert/strict'
import fs from 'node:fs'
import { validateBlockDocument } from '../src/data/block-registry'
import { seiLint } from '../src/lib/sei'
import { paginateBlocks, isBlockComplete, type BlockDocument } from '../src/data/content-blocks'
import { filterDocumentForViewer } from '../src/lib/track-visibility'
import { checkedLessonResponse } from '../src/lib/lesson-response-validation'
import { PLANS, findDay } from '../src/lib/lesson-plan-export'
const lessons=JSON.parse(fs.readFileSync('scripts/trades-etf/lessons.json','utf8')) as {id:string;slug:string;unit_id:string;lesson_number:number;content_blocks:BlockDocument}[]
const targets=JSON.parse(fs.readFileSync('scripts/trades-etf/targets.json','utf8')) as {slug:string;content_strand:string;unit_id:string}[]
const days=JSON.parse(fs.readFileSync('scripts/trades-etf/days.json','utf8')) as {kind:string}[]
const vocab=JSON.parse(fs.readFileSync('scripts/trades-etf/vocabulary-sets.json','utf8')) as {lesson_id:string;recommended_target_slug:string;terms:{term:string;definition:string;example:string}[]}[]
assert.equal(lessons.length,36)
assert.equal(Object.keys(PLANS.trades).length,4)
assert.equal(targets.length,20)
assert.equal(days.filter(d=>d.kind==='core').length,30)
assert.equal(days.filter(d=>d.kind==='flex').length,4)
assert.equal(days.filter(d=>d.kind==='exhibition').length,2)
assert.equal(vocab.length,36)
for(const unit of Object.keys(PLANS.trades))for(const suffix of ['math','measure','plans','build','vocabulary'])assert.ok(targets.some(t=>t.unit_id===unit&&t.slug.endsWith('.'+suffix)))
for(const l of lessons){
 assert.deepEqual(validateBlockDocument(l.content_blocks,true),[],l.slug)
 assert.deepEqual(seiLint(l.content_blocks.blocks).filter(i=>i.severity==='error'),[],l.slug)
 const doc=filterDocumentForViewer(l.content_blocks,{role:'student',track:'cpa'})
 const pages=paginateBlocks(doc.blocks)
 assert.equal(pages.length,6,l.slug)
 assert.deepEqual(pages.map(p=>p.captureBlocks.length),[0,0,0,0,0,1],l.slug)
 assert.equal(pages.reduce((n,p)=>n+(p.blocks[0].workshop?.minutes??0),0),110,l.slug)
 assert.equal(new Set(doc.blocks.map(b=>b.id)).size,doc.blocks.length)
 for(const p of pages){
  assert.ok(p.blocks[0].workshop?.steps?.length)
  const tool=p.blocks[0].teachingTool
  if(tool?.kind==='case-board')for(const frame of tool.frames)assert.ok(frame.image&&fs.existsSync('public'+frame.image))
 }
 const capture=pages[5].captureBlocks[0]
 assert.ok(targets.some(t=>t.slug===capture.targetId))
 assert.equal(checkedLessonResponse(capture,{text:'11 in blank; second fold at 6 1/2 in from datum A. Notebook page 2, revised lip passed three tests.'}).ok,true)
 assert.equal(isBlockComplete(capture,{text:''}),false)
 const plan=findDay(l.unit_id,l.lesson_number,['trades'])
 assert.ok(plan&&plan.lessonId===l.id)
 assert.match(plan.bodyHtml,/Teacher answer key/)
 assert.ok(!JSON.stringify(doc).includes('Teacher answer key'))
 const v=vocab.find(v=>v.lesson_id===l.id)
 assert.ok(v&&targets.some(t=>t.slug===v.recommended_target_slug))
 assert.equal(new Set(v.terms.map(t=>t.term)).size,8)
 for(const word of v.terms){assert.ok(word.definition.length>20);assert.ok(word.example.length>30)}
}
// Inspectable plans remain available for historical work, outside the current list.
assert.ok(findDay('trades-reset-1',1,['trades']))
// Transfer checks for the first build and representative trade applications.
assert.equal(3.25+3.25+4+.5,11)
assert.equal(8.5-2*.75,7)
assert.equal(5.25-2*.75,3.75)
assert.equal(3*2.5+4*.125,8)
assert.equal((16*.5)*(12*.5),48)
assert.equal(Math.hypot(6,8),10)
assert.equal(2*3/3,2)
assert.equal(200/25,8)
assert.equal((20-16)/20*100,20)
assert.equal(3/60*1000,50)
assert.equal(2*.3*4,2.4)
console.log('PASS: four projects; 36 lessons and teacher plans; 20 targets; 216 practical stages; one valid capture per lesson; 36 vocabulary sets; supplied drawings; individual math and historical-plan preservation.')
