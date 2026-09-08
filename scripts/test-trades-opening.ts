import assert from 'node:assert/strict'
import fs from 'node:fs'
import {validateBlockDocument} from '../src/data/block-registry'
import {seiLint} from '../src/lib/sei'
import {paginateBlocks,type BlockDocument} from '../src/data/content-blocks'
import {filterDocumentForViewer} from '../src/lib/track-visibility'
import {checkedLessonResponse} from '../src/lib/lesson-response-validation'
const lessons=JSON.parse(fs.readFileSync('scripts/trades-opening/lessons.json','utf8')) as {slug:string;content_blocks:BlockDocument}[]
assert.equal(lessons.length,30)
for(const l of lessons){
 assert.deepEqual(validateBlockDocument(l.content_blocks,true),[],l.slug)
 assert.deepEqual(seiLint(l.content_blocks.blocks).filter(i=>i.severity==='error'),[],l.slug)
 const pages=paginateBlocks(l.content_blocks.blocks)
 if(Number(l.slug.slice(-2))<=5 && l.slug.startsWith('tu1')) assert.ok(pages.length>=3,l.slug+' needs teachable sections')
 const filtered=filterDocumentForViewer(l.content_blocks,{role:'student',track:'cpa'})
 for(const b of filtered.blocks){if(b.type==='question')assert.ok(!JSON.stringify(b.question).includes('correctOptionId'))}
 for(const b of l.content_blocks.blocks){
  if(b.type==='question'){
   const q=b.question as {correctOptionId:string};const result=checkedLessonResponse(b,{optionId:q.correctOptionId,autoCheck:'mismatch'})
   assert.equal(result.ok,true);if(result.ok)assert.equal((result.response as {autoCheck:string}).autoCheck,'match')
  }
  if(['question','exit_ticket','sketch','data_table'].includes(b.type))assert.ok(b.targetId,l.slug+':'+b.id)
 }
 console.log(l.slug,pages.length,'sections: valid, scaffolded, target-linked; student keys stripped')
}
assert.equal((15+11/16)-(15+9/16),1/8)
assert.equal((4+7/16)-1,3+7/16)
assert.ok(Math.abs((.25/12)*100-2.083333333333333)<1e-9)
