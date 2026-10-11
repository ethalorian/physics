import {test} from 'node:test'
import assert from 'node:assert/strict'
import {PROBLEM_STAGES,validateProblemStage,lessonProblemAnswer,completeProblemAnswer,type DrawingResponse} from './problem-response'
import {validateAnswers} from './quizzes/validation'
import {checkedLessonResponse} from './lesson-response-validation'
import {RESPONSE_RULES} from '../data/block-registry'
const drawing:DrawingResponse={text:'',mode:'drawing',strokes:[{color:'#22233a',tool:'arrow',width:3,points:[{x:20,y:80},{x:200,y:80}]}]}
const responses=Object.fromEntries(PROBLEM_STAGES.map(k=>[k,drawing]))
const lesson={format:'problem-workspace',responses,given:'',equation:'',work:'',answer:''}
const block={capture:true as const,id:'p',type:'gewa' as const,prompt:'Show displacement.',responseFormat:'problem-workspace' as const}
test('drawing-only work counts in all four lesson stages and survives validation',()=>{assert.equal(completeProblemAnswer(lesson),true);assert.equal(RESPONSE_RULES.gewa!(lesson,block),true);const result=checkedLessonResponse(block,lesson);assert.equal(result.ok,true);if(result.ok)assert.deepEqual((result.response as typeof lesson).responses,responses)})
test('legacy lesson text and original model drawings still open',()=>{const old={given:'',modelStrokes:drawing.strokes,equation:'Final minus initial',work:'-2-6=-8',answer:'8 m left'};assert.equal(completeProblemAnswer(old),true);assert.deepEqual(lessonProblemAnswer(old).model,{text:'',mode:'drawing',strokes:drawing.strokes})})
test('drawings and text can be mixed; an empty section still needs evidence',()=>{assert.equal(completeProblemAnswer({...lesson,responses:{...responses,plan:'Use endpoints'}}),true);assert.equal(completeProblemAnswer({...lesson,responses:{...responses,plan:{text:' ',strokes:[],mode:'drawing'}}}),false)})
test('quiz saves and submissions retain vector drawings and written context',()=>{const questions=[{id:'p',kind:'problem' as const,prompt:'Explain.',points:4,target_id:'t'}];const answer={...responses,plan:{...drawing,text:'Use final minus initial'}};assert.deepEqual(validateAnswers({p:answer},questions,true),{p:answer});assert.throws(()=>validateAnswers({p:{...answer,work:{text:'',strokes:[],mode:'drawing'}}},questions,true))})
test('malformed drawing marks and nonfinite coordinates are rejected by both paths',()=>{for(const bad of [{...drawing,strokes:[{...drawing.strokes[0],color:'url(https://bad)'}]},{...drawing,strokes:[{...drawing.strokes[0],points:[{x:Infinity,y:0}]}]},{...drawing,strokes:[{...drawing.strokes[0],tool:'text',text:''}]}]){assert.throws(()=>validateProblemStage(bad));assert.equal(checkedLessonResponse(block,{...lesson,responses:{...responses,model:bad}}).ok,false)}})
