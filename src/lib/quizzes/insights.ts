import type {AssessmentComparison} from './comparison'
import {average} from './comparison'
import type {QuizCard} from './types'

export interface QuizFilters {query:string;status:string;kind:string;target:string;sort:string;unit?:string;usage?:string;due?:string;gradeMode?:string;from?:string;to?:string}
export const defaultQuizFilters:QuizFilters={query:'',status:'active',kind:'all',target:'',sort:'newest',unit:'',usage:'all',due:'all',gradeMode:'all',from:'',to:''}
export function filterQuizzes(quizzes:QuizCard[],filters:QuizFilters,pending:Record<string,number>,now=Date.now()) {
  const query=filters.query.trim().toLowerCase()
  const end=filters.to?new Date(filters.to+'T00:00:00'):null
  if(end)end.setDate(end.getDate()+1)
  return quizzes.filter(q=>(!query||(q.title+' '+q.instructions).toLowerCase().includes(query))
    &&(filters.status==='all'||(filters.status==='removed'?!!q.deleted_at:!q.deleted_at&&(filters.status==='active'?q.status!=='archived':filters.status==='review'?(pending[q.id]??0)>0:q.status===filters.status)))
    &&(filters.kind==='all'||q.kind===filters.kind)&&(!filters.target||q.target_ids?.includes(filters.target))
    &&(!filters.unit||q.unit_ids?.includes(filters.unit))
    &&(!filters.usage||filters.usage==='all'||(q.work_count!==undefined&&(filters.usage==='unused'?q.work_count===0:q.work_count>0)))
    &&(!filters.gradeMode||filters.gradeMode==='all'||q.grade_mode===filters.gradeMode)
    &&(!filters.due||filters.due==='all'||(filters.due==='none'?!q.due_at:!!q.due_at&&(filters.due==='past'?Date.parse(q.due_at)<now:Date.parse(q.due_at)>=now)))
    &&(!filters.from||!!q.created_at&&Date.parse(q.created_at)>=Date.parse(filters.from+'T00:00:00'))
    &&(!end||!!q.created_at&&Date.parse(q.created_at)<end.getTime()))
    .sort((a,b)=>{
      const tie=a.id.localeCompare(b.id)
      if(filters.sort==='title')return a.title.localeCompare(b.title)||tie
      if(filters.sort==='review')return (pending[b.id]??0)-(pending[a.id]??0)||a.title.localeCompare(b.title)||tie
      if(filters.sort==='due')return (a.due_at?Date.parse(a.due_at):Infinity)-(b.due_at?Date.parse(b.due_at):Infinity)||tie
      if(filters.sort==='oldest')return (a.created_at??'').localeCompare(b.created_at??'')||tie
      if(filters.sort==='updated')return (b.updated_at??b.created_at??'').localeCompare(a.updated_at??a.created_at??'')||tie
      return (b.created_at??'').localeCompare(a.created_at??'')||tie
    })
}

export const resultPercent=(value:number|null|undefined)=>value==null?'—':`${Math.round(value)}%`
export const resultState=(state:string)=>({not_started:'Not started',in_progress:'In progress',submitted:'Needs review',returned:'Revise',graded:'Graded'}[state]??state)
export type ResultStudent=AssessmentComparison['students'][number]
export function resultGrade(row:ResultStudent) {
  if(row.choiceExempt)return 'EX'
  if(row.choiceAvailable)return 'Choice available'
  if(row.state!=='graded')return resultState(row.state)
  if(row.gradeMode==='letter')return row.gradeValue??'Grade pending'
  if(row.gradeMode==='credit')return row.gradeValue==='credit'?'Credit':row.gradeValue==='no_credit'?'No credit':'Grade pending'
  return resultPercent(row.percent)
}

/** Correlation with the remaining questions avoids correlating an item with itself. */
function correlation(pairs:[number,number][]):number|null {
  if(pairs.length<10)return null
  const x=average(pairs.map(p=>p[0]))!,y=average(pairs.map(p=>p[1]))!
  const numerator=pairs.reduce((n,p)=>n+(p[0]-x)*(p[1]-y),0)
  const denominator=Math.sqrt(pairs.reduce((n,p)=>n+(p[0]-x)**2,0)*pairs.reduce((n,p)=>n+(p[1]-y)**2,0))
  return denominator?numerator/denominator:null
}
export function questionSignals(assessment:AssessmentComparison,courseId='') {
  const students=assessment.students.filter(s=>!courseId||s.course_id===courseId)
  return assessment.questions.map((q,index)=>{
    const scores=students.flatMap(s=>s.questionScores[index]==null?[]:[s.questionScores[index]!/q.points*100])
    const pairs=students.flatMap(s=>s.questionScores.every(v=>v!==null)&&s.questionScores.length>1?
      [[s.questionScores[index]!,s.questionScores.reduce<number>((n,v,i)=>n+(i===index?0:v??0),0)] as [number,number]]:[])
    return {...q,index,count:scores.length,mean:average(scores),itemRest:correlation(pairs)}
  })
}

/** Pair the same student's teacher ratings, in the same class and shared target.
 * Pending work and reversed submission dates cannot contribute to growth.
 * This reads existing teacher judgments; it never assigns a mastery rating.
 */
export function matchedGrowth(before:AssessmentComparison,after:AssessmentComparison,courseId='') {
  const targets=[...new Set(after.questions.map(q=>q.target_id))].filter(id=>before.questions.some(q=>q.target_id===id))
  const baseline=new Map(before.students.map(s=>[`${s.course_id}:${s.student_id}`,s]))
  return targets.map(target=>{
    const pairs=after.students.flatMap(row=>{
      const earlier=baseline.get(`${row.course_id}:${row.student_id}`)
      if((courseId&&row.course_id!==courseId)||row.state!=='graded'||earlier?.state!=='graded'||!earlier.submittedAt||!row.submittedAt||Date.parse(earlier.submittedAt)>=Date.parse(row.submittedAt))return []
      const pre=earlier.ratings[target],post=row.ratings[target]
      return pre!=null&&post!=null?[{pre,post}]:[]
    })
    return {target,count:pairs.length,improved:pairs.filter(p=>p.post>p.pre).length,stable:pairs.filter(p=>p.post===p.pre).length,declined:pairs.filter(p=>p.post<p.pre).length,
      beforeSecure:pairs.filter(p=>p.pre===3).length,afterSecure:pairs.filter(p=>p.post===3).length,
      secureGain:pairs.length?100*(pairs.filter(p=>p.post===3).length-pairs.filter(p=>p.pre===3).length)/pairs.length:null}
  })
}

export function quizCsv(rows:unknown[][]) {
  const cell=(value:unknown)=>{const text=String(value??'');return '"'+(/^[\s]*[=+@-]|^[\t\r\n]/.test(text)?"'"+text:text).replaceAll('"','""')+'"'}
  return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')
}
