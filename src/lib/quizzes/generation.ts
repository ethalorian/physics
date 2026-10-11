import {QUIZ_UUID, type Quiz, type QuizTarget} from './types'
import type {QuizLanguageLevel} from './language'
import {validateQuiz} from './validation'

export interface QuizGenerationRequest {
  id:string; course_id:string; lesson_id:string|null; target_ids:string[];
  count:number; format:'mixed'|'choice'|'written'; emphasis:string;
  language_level?:QuizLanguageLevel; sei_supports?:boolean;
}
export interface QuizSourceLesson {id:string;title:string;unit_id:string;target_ids:string[]}
export interface QuizSources {lessons:QuizSourceLesson[];targets:QuizTarget[];configured:boolean}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)
export function generationRequest(v:unknown):QuizGenerationRequest {
  if(!object(v)||!QUIZ_UUID.test(String(v.id))||!QUIZ_UUID.test(String(v.course_id))||v.lesson_id!==null&&!QUIZ_UUID.test(String(v.lesson_id)))throw Error('Choose a class and a current lesson or learning target.')
  if(!Array.isArray(v.target_ids)||!v.target_ids.length||v.target_ids.length>8||v.target_ids.some(id=>typeof id!=='string'||!QUIZ_UUID.test(id)))throw Error('Choose 1–8 learning targets.')
  const ids=[...new Set(v.target_ids as string[])].sort()
  if(!Number.isInteger(v.count)||Number(v.count)<3||Number(v.count)>10||ids.length>Number(v.count))throw Error('Choose 3–10 questions, with at least one question per target.')
  if(!['mixed','choice','written'].includes(String(v.format))||typeof v.emphasis!=='string'||v.emphasis.length>1000)throw Error('Choose a question format and keep directions under 1,000 characters.')
  if(v.language_level!==undefined&&!['cpa','honors'].includes(String(v.language_level))||v.sei_supports!==undefined&&typeof v.sei_supports!=='boolean')throw Error('Choose CPA or Honors and a valid SEI support setting.')
  return {...(v.language_level!==undefined?{language_level:v.language_level as QuizLanguageLevel}:{}),...(v.sei_supports!==undefined?{sei_supports:v.sei_supports as boolean}:{}),id:String(v.id),course_id:String(v.course_id),lesson_id:v.lesson_id as string|null,target_ids:ids,count:Number(v.count),format:v.format as QuizGenerationRequest['format'],emphasis:v.emphasis.trim()}
}

/** Only authored instructional text; never responses, rosters, URLs, or arbitrary metadata. */
export function lessonInstructionText(doc:unknown):string {
  if(!object(doc))return ''
  const allowed=new Set(['title','summary','markdown','prompt','statement','instruction','instructions','note','explanation','question','answer','text','label','fields','options','choices','steps','focus'])
  const visit=(v:unknown,depth=0):string=>{
    if(depth>6)return ''
    if(typeof v==='string')return v.slice(0,3000)
    if(Array.isArray(v))return v.slice(0,60).map(x=>visit(x,depth+1)).filter(Boolean).join('\n')
    if(object(v))return Object.entries(v).filter(([k])=>allowed.has(k)).map(([,x])=>visit(x,depth+1)).filter(Boolean).join('\n')
    return ''
  }
  return [visit(doc.learningPath),visit(doc.blocks)].filter(Boolean).join('\n\n').slice(0,24000)
}

export function generatedQuiz(raw:unknown,request:QuizGenerationRequest):Quiz {
  if(!object(raw)||!Array.isArray(raw.questions)||raw.questions.length!==request.count)throw Error('Claude did not return the requested number of questions. Try again.')
  const questions=raw.questions.map(q=>{if(!object(q))throw Error('Claude returned an incomplete question.');return {...q,id:crypto.randomUUID()}})
  const quiz=validateQuiz({id:request.id,course_id:request.course_id,title:raw.title,instructions:raw.instructions,language_level:request.language_level??'cpa',sei_supports:request.sei_supports??false,questions,kind:'understanding',grade_mode:'numeric',status:'published',version:0,student_ids:null,source_quiz_id:null,due_at:null})
  if(quiz.questions.some(q=>!request.target_ids.includes(q.target_id))||request.target_ids.some(id=>!quiz.questions.some(q=>q.target_id===id)))throw Error('The generated questions did not cover the selected targets. Try again.')
  if(new Set(quiz.questions.map(q=>q.prompt.toLowerCase().replace(/\s+/g,' ').trim())).size!==quiz.questions.length)throw Error('Claude repeated a question. Try again.')
  if(request.format==='choice'&&quiz.questions.some(q=>q.kind!=='choice')||request.format==='written'&&quiz.questions.some(q=>q.kind==='choice')||request.format==='mixed'&&(!quiz.questions.some(q=>q.kind==='choice')||!quiz.questions.some(q=>q.kind!=='choice')))throw Error('Claude did not follow the selected question format. Try again.')
  return {...quiz,status:'draft'}
}

export const quizOutputSchema={type:'object',additionalProperties:false,required:['title','instructions','questions'],properties:{
  title:{type:'string'},instructions:{type:'string'},questions:{type:'array',items:{type:'object',additionalProperties:false,required:['kind','prompt','points','target_id','guide','options','correct_index'],properties:{
    kind:{type:'string',enum:['choice','written','problem']},prompt:{type:'string'},points:{type:'integer'},target_id:{type:'string'},guide:{type:'string'},options:{type:'array',items:{type:'string'}},correct_index:{type:['integer','null']}
  }}}
}}
