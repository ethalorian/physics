import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeWords,normalizeWord,type CheckRecord } from './vocab-learning'
import { wordTranslation } from './vocab-language'
import { vocabRows } from './vocab-pagination'
const task={term_ids:['a','b'],threshold:80,min_checks:2}
const check=(id:string,at:string,correct=true,word='a'):CheckRecord=>({id,completed_at:at,result:[{term_id:word,correct,supports:['translation'],response:word}]})
test('one successful word cannot complete a multi-word assignment',()=>{const p=summarizeWords(task,[check('1','2026-09-01')]);assert.equal(p.covered,1);assert.equal(p.ready,0);assert.equal(p.complete,false);assert.equal(p.words[1].accuracy,null)})
test('recent checks reflect recovery instead of lifetime errors',()=>{const checks=Array.from({length:10},(_,i)=>check(String(i),`2026-09-${String(i+1).padStart(2,'0')}`,i>=5));const p=summarizeWords({...task,term_ids:['a']},checks,Date.parse('2026-09-11'));assert.equal(p.words[0].accuracy,100);assert.equal(p.words[0].previousAccuracy,0);assert.equal(p.complete,true)})
test('retention needs success on later days and stale words need review',()=>{assert.equal(summarizeWords({...task,term_ids:['a']},[check('1','2026-09-01T12:00:00Z'),check('2','2026-09-01T13:00:00Z')]).retained,false);const p=summarizeWords({...task,term_ids:['a']},[check('1','2026-09-01'),check('2','2026-09-03')],Date.parse('2026-09-15'));assert.equal(p.retained,true);assert.equal(p.reviewDue,true)})
test('incomplete checks and missing words are not scored as zero',()=>{const p=summarizeWords(task,[{id:'x',completed_at:null,result:null}]);assert.equal(p.accuracy,null);assert.equal(p.total,2);assert.equal(p.complete,false)})
test('translation support does not lower a correct word score',()=>{const p=summarizeWords({...task,term_ids:['a']},[check('1','2026-09-01'),check('2','2026-09-03')]);assert.equal(p.ready,1);assert.deepEqual(p.words[0].supports,['translation'])})
test('Spanish is not substituted for another home language',()=>{const w={definitionEs:'cambio',translations:{pt:{definition:'mudança'}}};assert.equal(wordTranslation(w,'Portuguese').definition,'mudança');assert.equal(wordTranslation(w,'Spanish').definition,'cambio');assert.equal(wordTranslation(w,'Haitian Creole').definition,undefined)})
test('recall normalization ignores casing and whitespace',()=>assert.equal(normalizeWord('  Net   FORCE '),'net force'))
test('report pagination includes evidence beyond server row limits',async()=>{const data=Array.from({length:1201},(_,i)=>i);assert.equal((await vocabRows((a,b)=>Promise.resolve({data:data.slice(a,b+1),error:null}))).length,1201)})

test('crossing midnight alone does not establish retention',()=>{const p=summarizeWords({...task,term_ids:['a']},[check('1','2026-09-01T23:59:00Z'),check('2','2026-09-02T00:01:00Z')]);assert.equal(p.retained,false)})
