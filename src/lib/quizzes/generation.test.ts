import test from 'node:test'
import assert from 'node:assert/strict'
import {generationRequest,generatedQuiz,lessonInstructionText} from './generation'
import {studentQuiz} from './types'
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`
const request={id:id(1),course_id:id(2),lesson_id:id(3),target_ids:[id(4)],count:3,format:'mixed' as const,emphasis:''}
const output={title:'Motion check',instructions:'Explain your thinking.',questions:[
 {kind:'choice',prompt:'Which is a vector?',points:2,target_id:id(4),options:['Displacement','Distance','Time','Mass'],correct_index:0,guide:'Displacement includes direction.'},
 {kind:'written',prompt:'Explain an out-and-back trip.',points:3,target_id:id(4),options:[],correct_index:null,guide:'Endpoint agreement (1), zero displacement (1), nonzero distance (1).'},
 {kind:'problem',prompt:'Find displacement from +2 m to +7 m.',points:3,target_id:id(4),options:[],correct_index:null,guide:'Final minus initial (1), +5 m (1), positive direction (1).'}]}
test('generation input limits count, targets and teacher instructions',()=>{
 assert.deepEqual(generationRequest(request),request)
 for(const patch of [{count:31},{emphasis:'x'.repeat(1001)},{target_ids:[]},{lesson_id:'old'},{format:'anything'}])assert.throws(()=>generationRequest({...request,...patch}))
})
test('generated work is a complete editable draft with server-issued question IDs',()=>{
 const quiz=generatedQuiz(output,request);assert.equal(quiz.status,'draft');assert.equal(quiz.version,0);assert.equal(quiz.questions.length,3)
 assert.equal(new Set(quiz.questions.map(q=>q.id)).size,3)
 assert(!JSON.stringify(studentQuiz(quiz)).includes('guide'));assert(!JSON.stringify(studentQuiz(quiz)).includes('correct_index'))
})
test('rejects missing target coverage, foreign targets, duplicates, invalid keys and formats',()=>{
 assert.throws(()=>generatedQuiz(output,{...request,target_ids:[id(4),id(5)]}))
 for(const patch of [{target_id:id(6)},{correct_index:9},{options:['A','A','B','C']},{guide:''},{points:99}])assert.throws(()=>generatedQuiz({...output,questions:output.questions.map((q,n)=>n===0?{...q,...patch}:q)},request))
 assert.throws(()=>generatedQuiz({...output,questions:[output.questions[0],output.questions[0],output.questions[2]]},request))
 assert.throws(()=>generatedQuiz(output,{...request,format:'choice'}))
})
test('instruction extraction includes teaching text but excludes URLs and student metadata',()=>{
 const text=lessonInstructionText({learningPath:{focus:'Direction matters'},blocks:[{type:'instruction_video',summary:'Final minus initial',youtubeId:'secret-url'},{prompt:'Explain the sign',responses:'private response',student_name:'private name'}],responses:'private'})
 assert(text.includes('Direction matters'));assert(text.includes('Final minus initial'));assert(text.includes('Explain the sign'));assert(!text.includes('private'));assert(!text.includes('secret-url'))
 assert(lessonInstructionText({blocks:Array.from({length:50},()=>({markdown:'x'.repeat(3000)}))}).length<=24000)
})

test('reading settings are validated, recorded, and hidden from student labels',()=>{
 for(const language_level of ['cpa','honors'] as const)for(const sei_supports of [false,true]){
 const r=generationRequest({...request,language_level,sei_supports});const q=generatedQuiz(output,r);
 assert.equal(q.language_level,language_level);assert.equal(q.sei_supports,sei_supports);
 assert(!Object.hasOwn(studentQuiz(q),'language_level'));assert(!Object.hasOwn(studentQuiz(q),'sei_supports'));
 }
 for(const patch of [{language_level:'college'},{language_level:null},{sei_supports:'true'},{sei_supports:null}])assert.throws(()=>generationRequest({...request,...patch}));
})
