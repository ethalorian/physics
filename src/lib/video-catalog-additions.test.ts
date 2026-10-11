import test from 'node:test'
import assert from 'node:assert/strict'
import { PHYSICS_VIDEOS, UPCOMING_PHYSICS_VIDEOS } from '@/data/physics-videos'
import { createVideoLesson } from './video-lesson-authoring'
import { buildLessonConceptMap } from './lesson-concept-map-server'
import { conceptLayout, NODE_WIDTH, NODE_HEIGHT } from './lesson-concept-map'
import { videoViewing } from './teacher-video-progress'
import { filterDocumentForViewer } from './track-visibility'
import { lessonTargetReferences } from './lesson-target-references'
import septemberAdditions from '../../scripts/physics-learning/sept30-additions.json'
import octoberAdditions from '../../scripts/physics-learning/oct5-additions.json'
const additions=[...septemberAdditions,...octoberAdditions]

const targets=additions.map(a=>a.target)
const lessons=PHYSICS_VIDEOS.map(v=>({id:`lesson-${v.sequence}`,title:v.title,slug:`video-${v.sequence}`,unit_id:'unit-1',unit:'Motion and foundations',published:true,content_blocks:createVideoLesson(v.youtubeId)!}))
test('new videos have verified lengths that support watch credit and the teacher report',()=>{
 const verified=[['fmjVsKsU9Sw',242],['lZIZ8jByakc',248],['VQlq7_OtDF8',238],['SE8M273AKXw',264],['E0CpXzmViwQ',234],['uH-NE-LlybM',242],['pwbD3H8R0BU',264]] as const
 for(const [id,duration] of verified){
  const v=PHYSICS_VIDEOS.find(v=>v.youtubeId===id)!
  assert.equal(v.durationSeconds,duration)
  const b=createVideoLesson(id)!.blocks.find(b=>b.type==='instruction_video')!
  assert.equal(b.type==='instruction_video'&&b.durationSeconds,duration)
  const status=videoViewing({youtubeId:id,title:v.title,start:0,duration},{youtube_id:id,duration_seconds:duration,start_seconds:0,watched_seconds:Array.from({length:Math.ceil(duration*.9)},(_,i)=>i),updated_at:'2026-09-30T14:00:00Z'})
  assert.equal(status.state,'viewed')
 }
 assert.equal(UPCOMING_PHYSICS_VIDEOS.length,0,'published graph scale is no longer pending')
})
test('new captures feed the exact target without sending answer keys to students',()=>{
 for(const a of additions){
  const doc=createVideoLesson(a.youtubeId)!
  assert.deepEqual(lessonTargetReferences(doc),[a.target.slug])
  const captures=doc.blocks.filter(b=>'capture' in b && b.capture)
  assert.equal(captures.length,3)
  assert.ok(captures.every(b=>b.targetId===a.target.slug))
  const safe=filterDocumentForViewer(doc,{role:'student',track:'cpa'})
  assert.ok(!JSON.stringify(safe).includes('correctOptionId'))
  assert.ok(doc.blocks.some(b=>b.type==='worked_example'))
 }
})
test('new concepts remain locked and reveal no video IDs or content until released',()=>{
 const map=buildLessonConceptMap(lessons,targets,{}, {}, 'cpa')
 assert.equal(map.nodes.length,15)
 assert.equal(map.connections.length,18)
 for(const node of map.nodes){assert.equal(node.access,'locked');assert.equal(node.href,undefined);assert.ok(node.label)}
 assert.ok(!JSON.stringify(map).includes('youtubeId'))
 assert.ok(!JSON.stringify(map).includes('correctOptionId'))
 for(const a of additions)assert.ok(map.nodes.find(n=>n.sequence===a.sequence)?.targets.some(t=>t.slug===a.target.slug))
})
test('expanded concept map has room for every lesson and subsequent practice',()=>{
 const map=buildLessonConceptMap(lessons,targets,{}, {}, 'cpa')
 const extra={...map.nodes[0],id:'extra',sequence:undefined}
 const layout=conceptLayout([...map.nodes,extra])
 for(const [i,a] of layout.nodes.entries()){
  assert.ok(a.x>=0&&a.y>=0&&a.x+NODE_WIDTH<=layout.width&&a.y+NODE_HEIGHT<=layout.height)
  for(const b of layout.nodes.slice(i+1))assert.ok(a.x+NODE_WIDTH<=b.x||b.x+NODE_WIDTH<=a.x||a.y+NODE_HEIGHT<=b.y||b.y+NODE_HEIGHT<=a.y,'overlapping nodes')
 }
})
