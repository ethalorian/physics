import test from 'node:test'
import assert from 'node:assert/strict'
import {videoViewing,lessonViewing,type RecordedVideo} from './teacher-video-progress'
const spec={youtubeId:'vf7X7mmJfsE',title:'Units',duration:100,start:0}
const row=(n:number):RecordedVideo=>({youtube_id:spec.youtubeId,duration_seconds:100,start_seconds:0,watched_seconds:Array.from({length:n},(_,i)=>i),updated_at:'2026-09-30T12:00:00Z'})
test('page opening and partial playback are not viewed',()=>{
 assert.equal(videoViewing(spec).state,'no_record')
 assert.equal(videoViewing(spec,row(0)).state,'opened')
 assert.equal(videoViewing(spec,row(89)).state,'in_progress')
 assert.equal(videoViewing(spec,row(90)).state,'viewed')
})
test('counts only unique seconds inside the assigned video interval',()=>{
 const r={...row(30),watched_seconds:[...row(30).watched_seconds,...row(30).watched_seconds,-1,101,2.5]}
 assert.equal(videoViewing(spec,r).watched,30)
 assert.equal(videoViewing({...spec,start:20},{...row(100),start_seconds:20}).duration,80)
})
test('changed video duration, clip start or identity cannot reuse stale credit',()=>{
 assert.equal(videoViewing({...spec,duration:101},row(100)).state,'no_record')
 assert.equal(videoViewing({...spec,start:5},row(100)).state,'no_record')
 assert.equal(videoViewing({...spec,youtubeId:'u0V8uJ5KTvo'},row(100)).state,'no_record')
})
test('unknown duration is unavailable, never zero viewed or complete',()=>{
 assert.equal(videoViewing({...spec,duration:null},row(100)).state,'untracked')
 assert.equal(videoViewing({...spec,duration:null}).percent,null)
})
test('each video must reach its own threshold, not just an aggregate 90%',()=>{
 const summary=lessonViewing([videoViewing(spec,row(100)),videoViewing(spec,row(80))])
 assert.equal(summary.percent,90);assert.equal(summary.state,'in_progress');assert.equal(summary.viewedVideos,1)
 assert.equal(lessonViewing([videoViewing(spec,row(90)),videoViewing(spec,row(90))]).state,'viewed')
})
test('unknown clip prevents a complete lesson claim and last activity uses latest record',()=>{
 assert.equal(lessonViewing([videoViewing(spec,row(100)),videoViewing({...spec,duration:null})]).state,'untracked')
 assert.equal(lessonViewing([videoViewing(spec,row(100))]).lastActivity,row(100).updated_at)
})
