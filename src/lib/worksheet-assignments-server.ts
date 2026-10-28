import 'server-only'
import { createHash } from 'node:crypto'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import type { AuthContext } from './api-auth'
import { supabaseAdmin } from './supabase'
import { dailyWorksheet, type WorksheetTrack } from './daily-worksheets'
import { quizCourses,quizRows,quizStaff } from './quizzes/server'
import type { QuizQuestion,QuizTarget } from './quizzes/types'
import type { WorksheetAssignment,WorksheetQuizPreview } from './worksheet-assignments'
type BankQuestion = Omit<QuizQuestion,'id'|'kind'|'points'|'target_id'> & {target_slug:string;criteria:number[];freshness:string;transfer:boolean}
type BankEntry = {unit:number;day:number;title:string;target:string;criteria:string[];source_sha256:string;cpa:BankQuestion[];honors:BankQuestion[]}
type WorksheetSource = {unit:number;day:number;title:string;target:string;criteria:string[]}
const bank=JSON.parse(readFileSync(join(process.cwd(),'resources/worksheet-quizzes/bank.json'),'utf8')) as BankEntry[]
const source=JSON.parse(readFileSync(join(process.cwd(),'resources/worksheet-decks/source.json'),'utf8')) as WorksheetSource[]
export function worksheetSource(unit:string,day:number){return source.find(w=>`unit-${w.unit}`===unit&&w.day===day)}
/** Teacher catalog metadata only; answer keys stay in the server-side bank. */
export function worksheetCatalogEntries(track: string | null | undefined) {
 const edition = track === 'honors' ? 'honors' : 'cpa'
 return bank.map(entry => ({unit:`unit-${entry.unit}`,day:entry.day,title:entry.title,target:entry.target,criteria:entry.criteria,targetSlugs:[...new Set(entry[edition].map(q=>q.target_slug))]}))
}
export function worksheetUuid(seed:string){const h=createHash('sha256').update('worksheet-v1:'+seed).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`}
export async function worksheetQuizPreview(unit:string,day:number,edition:WorksheetTrack,seed:string):Promise<WorksheetQuizPreview>{
 const entry=(bank as BankEntry[]).find(w=>`unit-${w.unit}`===unit&&w.day===day),sheet=worksheetSource(unit,day)
 if(!entry||!sheet||!dailyWorksheet(unit,day))throw Error('The paired quiz is unavailable for this worksheet.')
 if(createHash('sha256').update(JSON.stringify(sheet)).digest('hex')!==entry.source_sha256)throw Error('This worksheet changed. Its paired quiz needs an alignment check before assigning.')
 const targets=await quizRows<QuizTarget>((a,b)=>supabaseAdmin.from('learning_targets').select('id,slug,statement,domain,program,unit_id').eq('unit_id',unit).eq('program','physics').eq('exclude_from_growth',false).order('id').range(a,b))
 const qs=entry[edition.startsWith('honors')?'honors':'cpa']
 const questions:QuizQuestion[]=qs.map((q,i)=>{const target=targets.find(t=>t.slug===q.target_slug);if(!target)throw Error('A paired quiz target is unavailable. Check the curriculum mapping.');return {id:worksheetUuid(seed+':'+i),kind:'choice',points:1,target_id:target.id,prompt:q.prompt,options:q.options,correct_index:q.correct_index,guide:q.guide,demand:q.demand}})
 return {unit,day,title:entry.title,target:entry.target,criteria:entry.criteria,source_sha256:entry.source_sha256,quiz_sha256:createHash('sha256').update(JSON.stringify(qs)).digest('hex'),questions,targets:targets.filter(t=>questions.some(q=>q.target_id===t.id))}
}
export async function accessWorksheet(id:string,ctx:AuthContext){
 const {data,error}=await supabaseAdmin.from('worksheet_assignments').select('*').eq('id',id).maybeSingle();if(error)throw error
 const a=data as WorksheetAssignment|null
 if(!a||!quizStaff(ctx)&&(a.status!=='published'||a.student_ids&&!a.student_ids.includes(ctx.userId)))return null
 const course=(await quizCourses(ctx)).find(c=>c.id===a.course_id)
 return course?{assignment:a,course}:null
}
