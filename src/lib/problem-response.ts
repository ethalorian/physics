import type {Stroke,StrokeTool} from '@/lib/draw/strokes'
export const PROBLEM_STAGES=['model','plan','work','answer'] as const
export interface DrawingResponse {text:string;strokes:Stroke[];mode:'text'|'drawing'}
export type ProblemStageResponse=string|DrawingResponse
export type ProblemAnswer=Record<typeof PROBLEM_STAGES[number],ProblemStageResponse>
export function stageResponse(value:ProblemStageResponse|undefined):DrawingResponse{return typeof value==='string'?{text:value,strokes:[],mode:'text'}:value??{text:'',strokes:[],mode:'text'}}
export function stageHasEvidence(value:ProblemStageResponse|undefined){const s=stageResponse(value);return !!s.text.trim()||s.strokes.length>0}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)
export function validateProblemStage(value:unknown):ProblemStageResponse {
 if(typeof value==='string'){if(value.length>10000)throw Error('Keep each written section under 10,000 characters.');return value}
 if(!object(value)||Object.keys(value).some(k=>!['text','strokes','mode'].includes(k))||typeof value.text!=='string'||value.text.length>10000||!['text','drawing'].includes(String(value.mode))||!Array.isArray(value.strokes)||value.strokes.length>500)throw Error('Invalid written or drawn response.')
 const strokes:Stroke[]=value.strokes.map(raw=>{
  if(!object(raw)||typeof raw.color!=='string'||!/^#[0-9a-f]{6}$/i.test(raw.color)||!Array.isArray(raw.points)||raw.points.length<1||raw.points.length>10000||raw.width!==undefined&&(typeof raw.width!=='number'||!Number.isFinite(raw.width)||raw.width<0||raw.width>64)||raw.tool!==undefined&&!['pen','line','arrow','rect','ellipse','spray','text'].includes(String(raw.tool))||raw.fill!==undefined&&typeof raw.fill!=='boolean'||raw.text!==undefined&&(typeof raw.text!=='string'||raw.text.length>48)||raw.tool==='text'&&(typeof raw.text!=='string'||!raw.text.trim()))throw Error('Invalid drawing mark.')
  const points=raw.points.map(p=>{if(!object(p)||typeof p.x!=='number'||typeof p.y!=='number'||!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>10000||Math.abs(p.y)>10000)throw Error('Invalid drawing coordinates.');return {x:p.x,y:p.y}})
  return {color:raw.color,points,...(raw.width!==undefined?{width:raw.width as number}:{}),...(raw.tool!==undefined?{tool:raw.tool as StrokeTool}:{}),...(raw.fill!==undefined?{fill:raw.fill as boolean}:{}),...(raw.text!==undefined?{text:raw.text as string}:{})}
 })
 return {text:value.text,mode:value.mode as DrawingResponse['mode'],strokes}
}

export function lessonProblemAnswer(value:unknown):ProblemAnswer {
 const v=(value&&typeof value==='object'?value:{}) as {responses?:Partial<ProblemAnswer>;given?:string;equation?:string;work?:string;answer?:string;modelStrokes?:Stroke[]}
 return {model:v.responses?.model??{text:v.given??'',strokes:v.modelStrokes??[],mode:v.modelStrokes?.length?'drawing':'text'},plan:v.responses?.plan??v.equation??'',work:v.responses?.work??v.work??'',answer:v.responses?.answer??v.answer??''}
}
export function completeProblemAnswer(value:unknown){try{const responses=lessonProblemAnswer(value);return PROBLEM_STAGES.every(k=>stageHasEvidence(validateProblemStage(responses[k])))}catch{return false}}
