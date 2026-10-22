import test from 'node:test'
import assert from 'node:assert/strict'
import { createGraphicNovelAssignment, novelQuestionBank, NOVEL_BOOK } from './graphic-novel-assignments'
import { validateBlockDocument } from '@/data/block-registry'
import { isCurrentLesson } from './current-lesson-catalog'
import { lessonTargetReferences } from './lesson-target-references'
test('every published chapter has 1–3 brief reasoning questions using the shared demand model',()=>{
  for(const chapter of NOVEL_BOOK.chapters) for(const count of [1,2,3]) {
    const doc=createGraphicNovelAssignment(chapter.day,count)
    doc.blocks=doc.blocks.map(b=>'capture' in b?{...b,targetId:'motion'}:b)
    assert.deepEqual(validateBlockDocument(doc,true),[])
    const tasks=doc.blocks.filter(b=>b.type==='exit_ticket')
    assert.equal(tasks.length,count)
    assert(tasks.every(q=>q.demand && [2,3].includes(q.demand.dok)))
    assert(tasks.every(q=>q.prompt.split(/\s+/).length<=40),'short student directions')
    assert(tasks.every(q=>q.prompt.split(/[.!?]+/).filter(Boolean).every(sentence=>sentence.trim().split(/\s+/).length<=24)),'short sentences')
    assert.equal(doc.presentation,undefined)
    assert(isCurrentLesson({unit_id:'unit-1',content_blocks:doc}))
    assert(lessonTargetReferences(doc).includes('motion'))
    assert(JSON.stringify(doc.blocks[0]).includes('?page='+chapter.start),'correct chapter link')
  }
})
test('rejects unknown chapters, extra questions, and missing mastery links',()=>{
  assert.throws(()=>createGraphicNovelAssignment(999))
  assert.throws(()=>createGraphicNovelAssignment(1,4))
  const doc=createGraphicNovelAssignment()
  assert(validateBlockDocument(doc,true).some(i=>i.message.includes('physics target')))
  doc.blocks.push(...novelQuestionBank(2))
  assert(validateBlockDocument(doc).some(i=>i.message.includes('1–3')))
})
