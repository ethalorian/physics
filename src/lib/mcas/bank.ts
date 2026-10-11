import 'server-only'
import raw from '@/data/mcas-bank.json'
import {MCAS_ID,mcasPresentation,type McasItem,type McasSummary,type McasCatalog,type McasTopic} from './types'
const bank=raw as unknown as {questions:McasItem[];topics:McasTopic[]}
const byId=new Map(bank.questions.map(q=>[q.id,q]))
export function mcasItem(id:string) { return MCAS_ID.test(id)?byId.get(id):undefined }
export function publicMcasItem(id:string) {const q=mcasItem(id);return q?mcasPresentation(q):null}
export function searchMcas(params:URLSearchParams):McasCatalog {
  const query=(params.get('q')??'').trim().toLowerCase().split(/\s+/).filter(Boolean),unit=params.get('unit'),topic=params.get('topic'),type=params.get('type'),year=Number(params.get('year')),keyed=params.get('keyed')==='1'
  const items=bank.questions.filter(q=>(!unit||q.unitIds.includes(unit))&&(!topic||q.topics.includes(topic))&&(!type||q.type===type)&&(!year||q.year===year)&&(!keyed||!!q.answer)&&query.every(word=>(q.searchText+' '+q.id+' '+q.year+' '+q.number).toLowerCase().includes(word)))
  if(params.get('suggest')==='1'&&unit){const choices=items.filter(q=>q.type==='multiple_choice'&&!!q.answer);const open=items.find(q=>q.type==='open_response');const selected=[...choices.slice(0,3),...(open?[open]:[])];return {items:selected.map(q=>{const {html,searchText,imagePaths,...summary}=q;void html;void searchText;void imagePaths;return summary}),topics:bank.topics,total:selected.length,page:1,pages:1}}
  const pages=Math.max(1,Math.ceil(items.length/12)),page=Math.max(1,Math.min(pages,Math.floor(Number(params.get('page')))||1))
  return {items:items.slice((page-1)*12,page*12).map(q=>{const {html,searchText,imagePaths,...summary}=q;void html;void searchText;void imagePaths;return summary as McasSummary}),topics:bank.topics,total:items.length,page,pages}
}
