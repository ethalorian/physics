import test from 'node:test'
import assert from 'node:assert/strict'
import {publicVocabResults,quizSummary} from '@/lib/vocab-quiz'
import {validSuggestion} from './suggestions'
import {validLabMastery} from '@/lib/interactive-assignments/lab-grades'
import {retryDelay} from './retry'
const result=[{term_id:'term',response:'speed',correct:true,supports:[],definition:'private answer key',feedback:'private feedback'}]
test('New objective quizzes hide scores, keys and feedback until teacher release',()=>{
 const draft={id:'quiz',completed_at:'2026-10-26',requires_release:true,reviewed_at:null,result}
 assert.deepEqual(publicVocabResults(draft),[{term_id:'term',response:'speed',correct:null,supports:[]}])
 assert.equal(quizSummary([draft]).score,null);assert.equal(quizSummary([draft],true).needsReview,true)
 assert.equal(quizSummary([{...draft,reviewed_at:'2026-10-27'}]).score,100)
 assert.deepEqual(publicVocabResults({...draft,reviewed_at:'2026-10-27'}),result)
 assert.equal(quizSummary([{...draft,requires_release:false}]).score,100)
})
test('Missing evidence can be suggested and explicitly skipped without feedback',()=>{
 assert.equal(validSuggestion({summary:'No visible work',next_time:'Supply the missing evidence',ratings:[{target_id:'t',level:null,rationale:'Attachment was not provided'}],scores:[]},['t'],[]),true)
 assert.equal(validLabMastery([{target_id:'t',level:null,feedback:''}],['t']),true)
 assert.equal(validLabMastery([{target_id:'t',feedback:''}],['t']),false)
})
test('Retries use increasing delays and cap the delay',()=>{assert.deepEqual([1,2,3,4,5,6,10].map(retryDelay),[60,120,240,480,960,1920,3600])})
