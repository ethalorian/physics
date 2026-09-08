import assert from 'node:assert/strict'
import fs from 'node:fs'
import { validateBlockDocument } from '../src/data/block-registry'
import { seiLint } from '../src/lib/sei'
import { paginateBlocks, type BlockDocument } from '../src/data/content-blocks'
import { filterDocumentForViewer } from '../src/lib/track-visibility'
import { checkedLessonResponse } from '../src/lib/lesson-response-validation'
import { buildSlides } from '../src/lib/present-auto-slides'
const root='scripts/trades-course/'
const lessons=JSON.parse(fs.readFileSync(root+'lessons.json','utf8')) as {slug:string,title:string,content_blocks:BlockDocument}[]
const anchors=JSON.parse(fs.readFileSync(root+'response-anchors.json','utf8'))
const targets=new Set(JSON.parse(fs.readFileSync(root+'target-slugs.json','utf8')))
assert.equal(lessons.length,25)
for(const l of lessons){
 const doc=l.content_blocks
 assert.deepEqual(validateBlockDocument(doc,true),[],l.slug)
 assert.deepEqual(seiLint(doc.blocks).filter(i=>i.severity==='error'),[],l.slug)
 assert.ok(paginateBlocks(doc.blocks).length>=4,l.slug)
 const student=filterDocumentForViewer(doc,{role:'student',track:'cpa'})
 for(const b of student.blocks)if(b.type==='question')assert.ok(!JSON.stringify(b.question).includes('correctOptionId'))
 for(const b of doc.blocks){
  if(b.targetId)assert.ok(targets.has(b.targetId),l.slug+': unknown target '+b.targetId)
  if(b.type==='question'){
   assert.ok(b.question.options?.every(o=>o.feedback))
   const result=checkedLessonResponse(b,{optionId:b.question.correctOptionId,autoCheck:'mismatch'})
   assert.ok(result.ok);if(result.ok)assert.equal((result.response as {autoCheck:string}).autoCheck,'match')
  }
  if(b.sei?.visualBlockId)assert.ok(doc.blocks.some(x=>x.id===b.sei?.visualBlockId))
 }
 for(const b of anchors[l.slug])assert.ok(doc.blocks.some(x=>x.id===b.id&&x.type===b.type),l.slug+': response anchor lost '+b.id)
 const slides=buildSlides(l.title,doc)
 const rendered=slides.flatMap(s=>s.blocks.map(b=>b.id))
 assert.deepEqual(rendered,doc.blocks.filter(b=>b.type!=='deck').map(b=>b.id),l.slug+': Present lost content')
 console.log(l.slug,paginateBlocks(doc.blocks).length,'sections;',slides.length,'Present slides; captures preserved')
}
const cases=JSON.parse(fs.readFileSync(root+'cases.json','utf8'))
for(const c of cases){assert.deepEqual(Object.keys(c.rubric).sort(),['communication','reasoning','science','transfer']);for(const d of Object.values(c.rubric) as {levels:Record<string,string>}[])assert.deepEqual(Object.keys(d.levels),['0','1','2','3','4'])}
// Independent calculations for consequential keyed examples.
assert.equal(3*(15+5/8)+2*3/8,47+5/8)
assert.equal(48-1/8-(47+13/16),1/16)
assert.equal(18*.25+2.375+.75+.75,8.375)
assert.equal(8-(16*.25+2.375+1.5),.125)
assert.equal(.75+2.375/2+18*.25,6.4375)
assert.equal(7.5-.5,7)
assert.equal((7.5-2.375-2)/.25,12.5)
console.log('Assessment levels and independent calculation checks passed')
