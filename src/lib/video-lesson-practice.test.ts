import test from 'node:test'
import assert from 'node:assert/strict'
import { createVideoLesson } from './video-lesson-authoring'
import { enrichVideoLesson, VIDEO_PRACTICE } from './video-lesson-practice'
import { PHYSICS_VIDEOS } from '@/data/physics-videos'
import { VIDEO_TRANSFERS } from '@/data/video-transfer-questions'
import { validateBlockDocument } from '@/data/block-registry'
import { filterDocumentForViewer } from './track-visibility'
import { isVideoLesson } from './video-lesson-workspace'
import { paginateBlocks } from '@/data/content-blocks'

test('every catalog video has an interactive example, matched practice, and scaffolded transfer',()=>{
  for(const video of PHYSICS_VIDEOS){
    const doc=createVideoLesson(video.youtubeId)!
    assert.ok(isVideoLesson(doc))
    assert.deepEqual(validateBlockDocument(doc,true),[],video.title)
    assert.deepEqual(enrichVideoLesson(doc),doc,'repeated enrichment must be idempotent')
    assert.equal(new Set(doc.blocks.map(b=>b.id)).size,doc.blocks.length)
    const replica=doc.blocks.find(b=>b.id===`iq3-replica-${video.youtubeId}`)!
    const index=doc.blocks.indexOf(replica)
    const example=doc.blocks[index-1]
    assert.equal(example.type,'worked_example')
    assert.ok(example.type==='worked_example'&&example.interactive)
    assert.equal(replica.type,'gewa')
    assert.deepEqual(replica.referenceBlockIds,[example.id])
    assert.ok(replica.targetId)
    const transfer=doc.blocks.find(b=>b.id===`iq3-${video.youtubeId}-transfer`)!
    assert.equal(transfer.type,'interactive_question')
    assert.ok(transfer.type==='interactive_question'&&transfer.task.parts.length===3)
    assert.ok(transfer.note)
    assert.equal(VIDEO_TRANSFERS[video.youtubeId].steps.length,3)
    assert.doesNotMatch(JSON.stringify(VIDEO_TRANSFERS[video.youtubeId]),/asteroid|probe|spacecraft/i)
    const student=filterDocumentForViewer(doc,{role:'student',track:'cpa'})
    assert.ok(student.blocks.every(b=>!b.note),'teacher solutions must stay off student payload')
    assert.ok(paginateBlocks(student.blocks).some(p=>p.captureBlocks.some(b=>b.id===replica.id)))
  }
})
test('worked-problem video has its own rebuilt practice and transfer',()=>{
  assert.ok(VIDEO_PRACTICE.B51oRJa9MSM)
  const base=createVideoLesson('u0V8uJ5KTvo')!
  base.blocks.push({id:'worked-film',type:'instruction_video',youtubeId:'B51oRJa9MSM',title:'Worked problem',summary:'Distance and displacement',targetId:'u1.vocab-position-distance-displacement'})
  const originalIds=base.blocks.map(b=>b.id)
  const result=enrichVideoLesson(base)
  assert.ok(originalIds.every(id=>result.blocks.some(b=>b.id===id)))
  assert.equal(result.blocks.filter(b=>b.id==='iq3-replica-B51oRJa9MSM').length,1)
  assert.equal(result.blocks.filter(b=>b.id==='iq3-B51oRJa9MSM-transfer').length,1)
  assert.deepEqual(enrichVideoLesson(result),result)
})
