import assert from 'node:assert/strict'
import fs from 'node:fs'
import { validateBlockDocument } from '../src/data/block-registry'
import { seiLint } from '../src/lib/sei'
import { paginateBlocks, isRequiredCaptureBlock, isBlockComplete, type BlockDocument } from '../src/data/content-blocks'
import { filterDocumentForViewer } from '../src/lib/track-visibility'
import { checkedLessonResponse } from '../src/lib/lesson-response-validation'
import { PLANS, findDay } from '../src/lib/lesson-plan-export'
const lessons=JSON.parse(fs.readFileSync('scripts/trades-reset/lessons.json','utf8')) as {id:string;slug:string;unit_id:string;lesson_number:number;content_blocks:BlockDocument}[]
const targets=JSON.parse(fs.readFileSync('scripts/trades-reset/targets.json','utf8')) as {slug:string}[]
const targetSet=new Set(targets.map(t=>t.slug))
assert.equal(lessons.length,36)
assert.equal(Object.keys(PLANS.trades).length,6)
assert.equal(targets.length,24)
for(const l of lessons){
 assert.deepEqual(validateBlockDocument(l.content_blocks,true),[],l.slug)
 assert.deepEqual(seiLint(l.content_blocks.blocks).filter(i=>i.severity==='error'),[],l.slug)
 const doc=filterDocumentForViewer(l.content_blocks,{role:'student',track:'cpa'})
 const pages=paginateBlocks(doc.blocks)
 assert.equal(pages.length,6,l.slug)
 assert.deepEqual(pages.map(p=>p.captureBlocks.length),[0,1,1,0,0,1],l.slug)
 assert.equal(pages.reduce((n,p)=>n+(p.blocks[0].workshop?.minutes??0),0),110,l.slug)
 assert.equal(pages.flatMap(p=>p.captureBlocks).filter(isRequiredCaptureBlock).length,3)
 assert.equal(new Set(doc.blocks.map(b=>b.id)).size,doc.blocks.length)
 for(const p of pages){
  const opener=p.blocks[0]
  assert.ok(opener.workshop?.notebook)
  assert.ok(opener.workshop?.steps?.length)
  if(opener.teachingTool?.kind==='case-board')for(const f of opener.teachingTool.frames)assert.ok(f.image&&fs.existsSync('public'+f.image))
  for(const b of p.captureBlocks){
   assert.ok(b.targetId&&targetSet.has(b.targetId),l.slug+':'+b.id)
   assert.equal(checkedLessonResponse(b,b.type==='question'?{explain:'Measured width 3 1/2 in, checked endpoints; notebook page 2.'}:{text:'Base 4 1/8 in; blank 5 5/8 in. My test fit needed a tab moved.'}).ok,true)
   assert.equal(isBlockComplete(b,b.type==='question'?{explain:''}:{text:''}),false)
  }
 }
 const plan=findDay(l.unit_id,l.lesson_number,['trades'])
 assert.ok(plan&&plan.lessonId===l.id,l.slug+' teacher plan')
 assert.match(plan.bodyHtml,/Teacher answer key/)
 assert.ok(!JSON.stringify(doc).includes('Teacher answer key'))
}
// Explicit practical stage boundaries do not change legacy pagination.
const legacy=JSON.parse(fs.readFileSync('scripts/trades-opening/lessons.json','utf8')) as {slug:string;content_blocks:BlockDocument}[]
function oldPages(blocks:BlockDocument['blocks']){let n=blocks.filter(b=>['question','exit_ticket','sketch','gewa','data_table','lab_notebook','observation','transfer_prompt','self_assessment','marzano','equation_sandbox','concept_exercise'].includes(b.type)||(b.type==='sentence_frame'&&b.capture)).length;return Math.max(1,n)}
for(const l of legacy)assert.equal(paginateBlocks(l.content_blocks.blocks).length,oldPages(l.content_blocks.blocks),l.slug)
// Key job calculations: fit, stock feasibility, centers, geometry, slope, rates, power.
assert.equal(3+7/8+2/8+2*3/4,5+5/8)
assert.equal((42-2*6)/(6-1),6)
assert.equal(Math.hypot(30,40),50)
assert.equal(48-(3*(15+3/4)+3/8),3/8)
assert.equal(Math.ceil(7/Math.floor(48/(20+1/8))),4)
assert.ok(Math.abs(2/96*100-2.083333333333333)<1e-10)
assert.equal(500/(350/14),20)
assert.equal(6*10*4/1000*.25,.06)
assert.equal((20-3/4)/4,4+13/16)
console.log('PASS: 36 lessons; 216 stages; 108 valid captures; 24 targets; 36 matching teacher plans; assets, scaffolds, math, response validation, and legacy pagination.')
