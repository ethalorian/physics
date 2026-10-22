import test from 'node:test'
import assert from 'node:assert/strict'
import {createVideoLesson} from './video-lesson-authoring'
import {enrichVideoLesson} from './video-lesson-practice'
import {VIDEO_QUESTION_SETS,videoInteractiveQuestions} from '@/data/assessment/video-interactive-questions'
import {validateBlockDocument} from '@/data/block-registry'
import {isBlockComplete, paginateBlocks} from '@/data/content-blocks'
import {filterDocumentForViewer} from './track-visibility'
import {checkedLessonResponse} from './lesson-response-validation'
import {checkInteractiveAnswer,interactiveComplete,partComplete,type InteractiveAnswer} from './interactive-question'
import {PHYSICS_VIDEOS} from '@/data/physics-videos'

test('every catalog video replaces all legacy response boxes with authored interactive tasks',()=>{
  for(const video of PHYSICS_VIDEOS){
    const doc=createVideoLesson(video.youtubeId)!
    assert.deepEqual(validateBlockDocument(doc,true),[],video.title)
    assert.equal(doc.blocks.some(b=>['question','exit_ticket','lab_notebook'].includes(b.type)),false)
    assert.equal(doc.blocks.filter(b=>b.type==='interactive_question').length,4)
    assert.equal(doc.blocks.filter(b=>b.type==='gewa'&&b.responseFormat==='problem-workspace').length,1)
    assert.equal(paginateBlocks(doc.blocks).length,7)
    assert.deepEqual(enrichVideoLesson(doc),doc)
    const student=filterDocumentForViewer(doc,{role:'student',track:'cpa'})
    for(const b of student.blocks){if(b.type==='interactive_question')for(const part of b.task.parts){assert.ok(!('answer' in part));assert.ok(!('explanation' in part))} assert.ok(!b.note)}
  }
})
test('all 16 films have four-option concepts and authored calculations; new numbers differ from examples',()=>{
  assert.equal(Object.keys(VIDEO_QUESTION_SETS).length,16)
  for(const id of Object.keys(VIDEO_QUESTION_SETS)){
    const blocks=videoInteractiveQuestions(id,'target')
    const concept=blocks[0],part=concept.task.parts[0]
    assert.equal(part.kind,'choice');if(part.kind!=='choice')throw Error('choice')
    assert.equal(part.options.length,4)
    const checked=checkInteractiveAnswer(concept.task,{version:1,answers:{choice:part.answer},checks:{choice:'mismatch'},fake:'discard'})
    assert.equal(checked.checks?.choice,'match');assert.ok(!('fake' in checked))
    assert.equal(isBlockComplete(concept,checked),true)
    assert.equal(isBlockComplete(concept,{optionId:part.answer}),false,'old response must not count')
    assert.doesNotMatch(blocks[2].task.prompt,/asteroid|probe|spacecraft/i)
    assert.ok(blocks[1].task.parts.some(p=>p.kind==='number'))
  }
})
test('server refuses unknown choices, missing parts and malformed drawings; ignores forged feedback',()=>{
  const task=videoInteractiveQuestions('Z1qFlfqlS_E')[0]
  assert.equal(checkedLessonResponse(task,{version:1,answers:{choice:'z'}}).ok,false)
  const checked=checkedLessonResponse(task,{version:1,answers:{choice:'A'},checks:{choice:'match'}})
  assert.ok(checked.ok);if(checked.ok)assert.equal((checked.response as InteractiveAnswer).checks?.choice,'mismatch')
  const apply=videoInteractiveQuestions('Z1qFlfqlS_E')[1]
  assert.equal(interactiveComplete(apply.task,{version:1,answers:{digits:'3'}}),false)
  assert.equal(checkedLessonResponse(apply,{version:1,answers:{model:{text:'',mode:'drawing',strokes:[{bad:true}]},digits:'3',explain:'The zero reports hundredths.'}}).ok,false)
})
test('complete numeric and drawn evidence round-trips and remains read-only displayable',()=>{
  const task=videoInteractiveQuestions('Z1qFlfqlS_E')[1].task
  const model={text:'The trailing zero is in the hundredths place.',mode:'drawing',strokes:[{color:'#000000',points:[{x:0,y:0},{x:20,y:20}]}]}
  const answer=checkInteractiveAnswer(task,{version:1,answers:{model,digits:'3',explain:'The values are equal but the written precision differs.'}})
  assert.equal(interactiveComplete(task,JSON.parse(JSON.stringify(answer))),true)
  assert.equal(answer.checks?.digits,'match')
  assert.deepEqual(answer.answers.model,model)
  const numeric=task.parts.find(p=>p.kind==='number')!
  for(const bad of ['',' ','NaN','Infinity','3 cm','1e999'])assert.equal(partComplete(numeric,bad),false)
  for(const good of ['0','-3','1.5e2'])assert.equal(partComplete(numeric,good),true)
})
test('rebuilding keeps original videos and optional MCAS sources without legacy question rendering',()=>{
  const doc=createVideoLesson('u0V8uJ5KTvo')!
  doc.blocks.push({id:'second',type:'instruction_video',youtubeId:'B51oRJa9MSM',title:'Worked problem',summary:'Distance and displacement',targetId:'u1.vocab-position-distance-displacement'})
  doc.blocks.push({id:'old',type:'question',capture:true,mcasId:'mcas-physics-2016-24',requiredForCompletion:false,question:{prompt:'Choose',options:['A','B','C','D'].map(id=>({id,text:id})),correctOptionId:'B'}})
  const rebuilt=enrichVideoLesson(doc)
  assert.equal(rebuilt.blocks.filter(b=>b.type==='instruction_video').length,2)
  assert.equal(rebuilt.blocks.filter(b=>b.type==='interactive_question').length,9)
  assert.ok(!rebuilt.blocks.some(b=>b.type==='question'||b.type==='exit_ticket'))
  assert.deepEqual(enrichVideoLesson(rebuilt),rebuilt)
  assert.deepEqual(validateBlockDocument(rebuilt,true),[])
})
