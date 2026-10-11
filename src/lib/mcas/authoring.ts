import type {McasSummary} from './types'
import type {QuizQuestion} from '@/lib/quizzes/types'
import type {ContentBlock} from '@/data/content-blocks'

export function mcasQuizQuestion(item:McasSummary,targetId='',id=crypto.randomUUID()):QuizQuestion {
  const choice=item.type==='multiple_choice',open=item.type==='open_response'
  const guide=item.answer?`Official DESE key: ${item.answer}. ${choice?'Award the available point for the correct choice.':'Semicolons separate successive parts; commas separate multiple selections. Review point criteria before publishing.'}`:''
  return {id,mcas_id:item.id,kind:choice?'choice':open?'problem':'written',prompt:`MCAS ${item.year} · Question ${item.number}\n${choice?'Choose one answer from the original question.':open?'Respond to every labeled part. Use the drawing tools where a graph or model is requested.':'Record the requested selections for every labeled part, using the original answer letters.'}`,target_id:targetId,points:choice?1:open?4:2,guide,...(choice?{options:['A','B','C','D'],correct_index:item.answer&&/^[A-D]$/.test(item.answer)?item.answer.charCodeAt(0)-65:-1}:{})}
}

export function mcasLessonBlock(item:McasSummary,targetId:string,id=crypto.randomUUID()):ContentBlock {
  const common={id,mcasId:item.id,capture:true as const,targetId,requiredForCompletion:false,evidenceRole:'practice' as const,gate:false,xp:0,teachingMoment:{phase:'discuss' as const,title:`MCAS ${item.year} · Question ${item.number}`},note:`Original MCAS item ${item.id}. ${item.answer?'Official DESE key: '+item.answer:'No answer key collected; teacher review required.'}`}
  if(item.type==='open_response')return {...common,type:'lab_notebook',instruction:'Respond to every labeled part of the original MCAS question. Use the sketch area for diagrams or graphs and the response box for calculations and explanations.',fields:['Responses to all labeled parts'],requireAllFields:true,grid:true}
  const choice=item.type==='multiple_choice'
  return {...common,type:'question',question:{prompt:choice?'Choose one answer, then explain the physics behind your choice.':'Record each requested answer using the original letter labels. Explain your reasoning.',...(choice?{options:['A','B','C','D'].map(letter=>({id:letter,text:letter})),explain:'Why does your choice fit the situation?',...(item.answer&&/^[A-D]$/.test(item.answer)?{correctOptionId:item.answer}:{})}:{})}}
}

/** Inserts at an explicit point while preserving existing block IDs and responses. */
export function insertMcasBlocks(blocks:ContentBlock[],added:ContentBlock[],afterId:string|null):ContentBlock[] {
  if(afterId!==null&&!blocks.some(b=>b.id===afterId))throw Error('The insertion point changed. Choose a current lesson block.')
  const existing=new Set(blocks.map(b=>b.mcasId).filter(Boolean))
  const unique=added.filter(b=>{if(!b.mcasId||existing.has(b.mcasId))return false;existing.add(b.mcasId);return true})
  const at=afterId===null?blocks.length:blocks.findIndex(b=>b.id===afterId)+1
  return [...blocks.slice(0,at),...unique,...blocks.slice(at)]
}
