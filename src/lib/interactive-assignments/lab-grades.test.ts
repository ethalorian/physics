import {test} from 'node:test'
import assert from 'node:assert/strict'
import {ALL_ASSIGNMENTS,assignmentBySlug,objectiveQuestion} from './catalog'
import {labRubric,validLabScores,validLabMastery} from './lab-grades'

test('every simulation uses answer evidence, with predictions and reflections excluded',()=>{
  for(const lesson of ALL_ASSIGNMENTS.filter(l=>l.simulation)){
    const rubric=labRubric(lesson)
    assert(rubric.length>0,lesson.slug)
    assert.equal(rubric.length,lesson.questions.filter(q=>!q.reflection).length)
    for(const q of lesson.questions)assert.equal(rubric.find(r=>r.id===q.id)?.possible,q.reflection?undefined:objectiveQuestion(q)?1:4)
    assert(validLabScores(rubric.map(q=>({...q,earned:0,feedback:''})),lesson),'zero is a real grade, not missing work')
  }
  assert.deepEqual(labRubric(assignmentBySlug('day-3-velocity')!),[])
})
test('release requires complete, unique scores with canonical maxima and bounded integer points',()=>{
  const lesson=assignmentBySlug('simulation-race-track')!,scores=labRubric(lesson).map(q=>({...q,earned:q.possible,feedback:'Evidence.'}))
  assert(validLabScores(scores,lesson))
  for(const bad of [scores.slice(1),[...scores,scores[0]],scores.map((s,i)=>i===1?scores[0]:s),scores.map((s,i)=>i===0?{...s,possible:100,earned:100}:s),scores.map((s,i)=>i===0?{...s,earned:-1}:s),scores.map((s,i)=>i===0?{...s,earned:.5}:s),scores.map((s,i)=>i===0?{...s,earned:NaN}:s),scores.map((s,i)=>i===0?{...s,id:'unknown'}:s)]) assert(!validLabScores(bad,lesson))
})
test('mastery decisions are independent of grades and require explicit evidence when unrated',()=>{
  assert(validLabMastery([{target_id:'a',level:3,feedback:'Transfer'},{target_id:'b',level:null,feedback:'No evidence for this target.'}],['a','b']))
  assert(!validLabMastery([{target_id:'a',level:null,feedback:' '}],['a']))
  assert(!validLabMastery([{target_id:'a',level:undefined,feedback:''}],['a']))
  assert(!validLabMastery([{target_id:'a',level:1,feedback:''},{target_id:'a',level:2,feedback:''}],['a','b']))
  assert(!validLabMastery([{target_id:'other',level:2,feedback:''}],['a']))
})
