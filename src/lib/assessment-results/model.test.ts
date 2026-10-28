import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reviewCell, submissionReviewQueue } from './model'
import type { ReviewScore, ReviewWork } from '@/lib/review-modules/analytics'
const work={status:'submitted',state:{responses:{q:'Answer'}},submitted_at:'2026-10-22T12:00:00Z'} as unknown as ReviewWork
const score={status:'ready',work_status:'submitted',response_snapshot:{q:'Answer'},result:{items:[{id:'q',score:0,confidence:'low'}]},overrides:{},revision:2} as unknown as ReviewScore
test('review module draft scores stay private until teacher release, including true zero',()=>{
 assert.equal(reviewCell(work,score).grade,undefined)
 assert.equal(reviewCell(work,score).needsReview,true)
 const released=reviewCell(work,{...score,released_at:'2026-10-22T13:00:00Z'})
 assert.equal(released.grade?.earned,0)
 assert.equal(released.grade?.possible,4)
 assert.equal(released.needsReview,false)
 assert.equal(reviewCell({...work,state:{...work.state,responses:{q:'Changed'}}},{...score,released_at:'2026-10-22T13:00:00Z'}).grade,undefined)
 assert.equal(reviewCell({...work,status:'draft'},{...score,released_at:'2026-10-22T13:00:00Z'}).grade,undefined)
})

import type {ResultActivity} from './types'
test('multi-standard math submissions appear once each and keep the exact submission and date',()=>{
 const cell={state:'submitted' as const,label:'2 to review',needsReview:true,submissionId:'one',reviewItems:[{id:'math:one',submittedAt:'2026-10-20'},{id:'math:two',submittedAt:'2026-10-22'}]}
 const a:ResultActivity={key:'math:a',sourceId:'a',kind:'math',title:'A',unitIds:[],dueAt:null,archived:false,cells:{s:cell}}
 const queue=submissionReviewQueue([a,{...a,key:'math:b',sourceId:'b'}],[{id:'s',name:'Student'}])
 assert.deepEqual(queue.map(r=>[r.cell.submissionId,r.cell.submittedAt]),[['one','2026-10-20'],['two','2026-10-22']])
})
