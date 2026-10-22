'use client'
import {useId,useMemo} from 'react'
import {Archive,BookOpen,ChartNoAxesCombined,ListFilter,Search} from 'lucide-react'
import type {QuizList} from '@/lib/quizzes/types'
import type {AssessmentComparison} from '@/lib/quizzes/comparison'
import {average} from '@/lib/quizzes/comparison'
import {defaultQuizFilters,filterQuizzes,quizCsv,resultPercent,type QuizFilters} from '@/lib/quizzes/insights'
import {useQuizData} from './shared'
import QuizInventory from './QuizInventory'
import type {DeletedQuizDraft} from './QuizDeleteDraft'
import QuizInsights from './QuizInsights'
import QuizGradebook,{gradebookCellText,type GradebookPosition} from './QuizGradebook'
import s from './Quiz.module.css'
import w from './QuizWorkspace.module.css'

interface Results {assignments:AssessmentComparison[];targets:{id:string;statement:string}[];enrollments:{course_id:string;student_id:string;name:string}[]}
export interface QuizWorkspaceOptions {filters:QuizFilters;studentQuery:string;studentFilter:string;display:'grade'|'points';showFilters:boolean}
export const defaultWorkspaceOptions:QuizWorkspaceOptions={filters:defaultQuizFilters,studentQuery:'',studentFilter:'all',display:'grade',showFilters:false}
interface Props {onManage:(id:string)=>void;view:string;onViewChange:(view:string)=>void;options:QuizWorkspaceOptions;onOptionsChange:(options:QuizWorkspaceOptions)=>void;position?:GradebookPosition;onRememberPosition:(position:GradebookPosition)=>void;data:QuizList;courseId:string;href:(id:string,courseId?:string)=>string;reload:()=>Promise<void>;onDeleted:(quiz:DeletedQuizDraft)=>void}
export default function QuizWorkspace({data,courseId,href,reload,onManage,view,onViewChange,options,onOptionsChange,position,onRememberPosition}:Props) {
  const {data:results,error,loading,load}=useQuizData<Results>('/api/quizzes/results')
  const {filters,studentQuery,studentFilter,display,showFilters}=options
  const filterPanelId=useId(),setView=onViewChange
  const setFilters=(filters:QuizFilters)=>onOptionsChange({...options,filters})
  const filterCount=Object.entries(filters).filter(([key,value])=>key!=='sort'&&value!==defaultQuizFilters[key as keyof QuizFilters]&&!!value).length
  const isGradebook=view==='gradebook'
  const scoped=data.quizzes.filter(q=>!courseId||q.course_id===courseId)
  const quizzes=filterQuizzes(scoped,filters,data.pending)
  const resultMap=useMemo(()=>new Map(results?.assignments.map(a=>[a.id,a])??[]),[results])
  const assigned=quizzes.filter(q=>q.status!=='draft'&&!q.deleted_at)
  const columns=assigned.flatMap(q=>{const a=resultMap.get(q.id);return a?[a]:[]})
  const assignedIds=new Set(assigned.map(q=>q.id)),targetIds=new Set(scoped.flatMap(q=>q.target_ids??[]))
  const rows=useMemo(()=>{
    const cells=new Map<string,Map<string,AssessmentComparison['students'][number]>>()
    for(const a of results?.assignments??[])for(const st of a.students){const key=`${st.course_id}:${st.student_id}`;if(!cells.has(key))cells.set(key,new Map());cells.get(key)!.set(a.id,st)}
    return (results?.enrollments??[]).map(st=>({...st,cells:cells.get(`${st.course_id}:${st.student_id}`)??new Map<string,AssessmentComparison['students'][number]>()}))
  },[results])
  const students=rows.filter(st=>(!courseId||st.course_id===courseId)&&st.name.toLowerCase().includes(studentQuery.toLowerCase())&&(studentFilter==='all'||[...st.cells.entries()].some(([id,cell])=>assignedIds.has(id)&&!cell.choiceExempt&&!cell.choiceAvailable&&(studentFilter==='review'?cell.state==='submitted':['not_started','in_progress','returned'].includes(cell.state)))))
    .sort((a,b)=>a.name.localeCompare(b.name)||a.course_id.localeCompare(b.course_id))
  const visibleStudents=columns.flatMap(a=>a.students).filter(st=>!st.choiceExempt&&!st.choiceAvailable),pending=quizzes.reduce((n,q)=>n+(data.pending[q.id]??0),0),scored=visibleStudents.flatMap(st=>st.percent===null?[]:[st.percent])
  async function refresh(){await Promise.all([reload(),load()])}
  const courseName=(id:string)=>{const c=data.courses.find(c=>c.id===id);return c?`${c.name} · ${c.section}`:'Class'}
  function download(){
    const csv=quizCsv([['Student','Class',...columns.map(a=>a.title)],...students.map(st=>[st.name,courseName(st.course_id),...columns.map(a=>{const cell=st.cells.get(a.id);return cell?gradebookCellText(cell,display):'Not assigned'})])])
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='quiz-gradebook.csv';link.click();URL.revokeObjectURL(url)
  }
  return <section className={`${w.workspace} ${isGradebook||view==='quizzes'?w.compactWorkspace:''} ${view==='quizzes'?w.inventoryWorkspace:''}`} aria-label="Quiz workspace">
    {view==='insights'&&<div className={w.metrics}>
      <div className={w.metric}><span>Quizzes in view</span><strong>{quizzes.length}</strong><small>{assigned.length} assigned · {quizzes.length-assigned.length} drafts</small></div>
      <div className={w.metric}><span>Ready for review</span><strong>{pending}</strong><button type="button" onClick={()=>{setFilters({...filters,status:'review'});setView('quizzes')}}>Show review queue →</button></div>
      <div className={w.metric}><span>Grades returned</span><strong>{results?`${scored.length} / ${visibleStudents.length}`:'—'}</strong><small>Student–quiz assignments in view</small></div>
      <div className={w.metric}><span>Average score</span><strong>{resultPercent(average(scored))}</strong><small>Equal weight per scored assignment</small></div>
    </div>}
    <div className={w.viewRow}><div className={w.tabs} role="group" aria-label="Quiz workspace view">{[{id:'quizzes',label:'Inventory',Icon:ListFilter},{id:'gradebook',label:'Gradebook',Icon:BookOpen},{id:'insights',label:'Teaching insights',Icon:ChartNoAxesCombined}].map(({id,label,Icon})=><button type="button" key={id} aria-pressed={view===id} onClick={()=>setView(id)}><Icon size={18}/>{label}</button>)}</div>{isGradebook&&<div className={s.actions}><button type="button" className={w.compactButton} aria-expanded={showFilters} aria-controls={filterPanelId} onClick={()=>onOptionsChange({...options,showFilters:!showFilters})}><ListFilter size={15}/>Filter quizzes{filterCount>0?` (${filterCount})`:null}</button>{filterCount>0&&<button type="button" className={w.compactButton} onClick={()=>setFilters(defaultQuizFilters)}>Reset</button>}<button type="button" className={w.compactButton} disabled={loading} onClick={()=>void refresh()}>Refresh</button></div>}</div>
    {view==='quizzes'&&<div className={w.inventoryViews} role="group" aria-label="Inventory status">{[{id:'active',name:'Active'},{id:'draft',name:'Drafts'},{id:'review',name:'Needs review'},{id:'archived',name:'Archived'},{id:'removed',name:'Removed drafts'},{id:'all',name:'All quizzes'}].map(item=><button type="button" key={item.id} aria-pressed={filters.status===item.id} onClick={()=>setFilters({...filters,status:item.id})}>{item.name}<span>{filterQuizzes(scoped,{...defaultQuizFilters,status:item.id},data.pending).length}</span></button>)}</div>}
    {(!isGradebook||showFilters)&&<div id={filterPanelId} className={w.filters}>
      <label className={`${s.field} ${w.search}`}><span><Search size={15}/> Search quizzes</span><input type="search" placeholder="Quiz title…" value={filters.query} onChange={e=>setFilters({...filters,query:e.target.value})}/></label>
      <label className={s.field}>Status<select value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}><option value="active">Active & drafts</option><option value="review">Needs review</option><option value="published">Published</option><option value="draft">Drafts</option><option value="archived">Archived</option><option value="removed">Removed drafts</option><option value="all">All statuses</option></select></label>
      <label className={s.field}>Quiz type<select value={filters.kind} onChange={e=>setFilters({...filters,kind:e.target.value})}><option value="all">All types</option><option value="vocabulary">Vocabulary</option><option value="understanding">Understanding</option><option value="mixed">Mixed</option></select></label>
      <label className={s.field}>Unit<select value={filters.unit??''} onChange={e=>setFilters({...filters,unit:e.target.value,target:''})}><option value="">All units</option>{data.inventory?.units.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label><label className={s.field}>Learning target<select value={filters.target} onChange={e=>setFilters({...filters,target:e.target.value})}><option value="">All targets</option>{(data.inventory?.targets??results?.targets)?.filter(t=>targetIds.has(t.id)&&(!filters.unit||data.inventory?.targets.some(v=>v.id===t.id&&v.unit_id===filters.unit))).map(t=><option key={t.id} value={t.id}>{t.statement}</option>)}</select></label>
      <label className={s.field}>Sort quizzes<select value={filters.sort} onChange={e=>setFilters({...filters,sort:e.target.value})}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="updated">Recently updated</option><option value="due">Due date</option><option value="review">Most to review</option><option value="title">Title A–Z</option></select></label>
      <details className={w.moreFilters}><summary>More filters{(filters.usage!=='all'&&filters.usage||filters.due!=='all'&&filters.due||filters.gradeMode!=='all'&&filters.gradeMode||filters.from||filters.to)?' · applied':''}</summary><div className={w.extraFilters}>
        <label className={s.field}>Student activity<select value={filters.usage??'all'} onChange={e=>setFilters({...filters,usage:e.target.value})}><option value="all">Any activity</option><option value="unused">No student work</option><option value="used">Has student work</option></select></label>
        <label className={s.field}>Due date<select value={filters.due??'all'} onChange={e=>setFilters({...filters,due:e.target.value})}><option value="all">Any due date</option><option value="past">Past due date</option><option value="upcoming">Upcoming</option><option value="none">No due date</option></select></label>
        <label className={s.field}>Grading<select value={filters.gradeMode??'all'} onChange={e=>setFilters({...filters,gradeMode:e.target.value})}><option value="all">All grading types</option><option value="numeric">Numeric</option><option value="letter">Letter</option><option value="credit">Credit</option></select></label>
        <label className={s.field}>Created from<input type="date" value={filters.from??''} max={filters.to||undefined} onChange={e=>setFilters({...filters,from:e.target.value})}/></label><label className={s.field}>Created through<input type="date" value={filters.to??''} min={filters.from||undefined} onChange={e=>setFilters({...filters,to:e.target.value})}/></label>
      </div></details>
    </div>}
    {view==='insights'&&<div className={s.row}><p className={s.muted} role="status">{courseId?courseName(courseId):'All your classes'}</p><div className={s.actions}><button type="button" className={s.secondary} onClick={()=>setFilters(defaultQuizFilters)}>Clear filters</button><button type="button" className={s.secondary} disabled={loading} onClick={()=>void refresh()}>Refresh data</button></div></div>}
    {isGradebook&&<p className={w.gradebookSummary} role="status">{columns.length} quizzes <span>·</span> {scored.length} grades returned <span>·</span> {pending} awaiting review <span>·</span> Class averages use scored work only</p>}
    {error&&<p role="alert" className={s.error}>Results could not load: {error} <button className={s.secondary} onClick={()=>void load()}>Retry results</button></p>}
    {loading&&!results&&<p role="status" className={s.muted}>Loading grades and learning evidence…</p>}
    {!quizzes.length?<div className={`${s.card} ${s.empty}`}><Archive size={28}/><h2>No quizzes match this view.</h2><p>Change the filters or create a quiz. Archived quizzes remain available under Status.</p></div>:view==='quizzes'?<QuizInventory key={JSON.stringify(filters)} quizzes={quizzes} total={scoped.length} pending={data.pending} units={data.inventory?.units??[]} courseName={courseName} href={href} onManage={onManage} onChanged={refresh} onClear={()=>setFilters(defaultQuizFilters)} loading={loading} readOnly={data.readOnly}/>:view==='gradebook'?<QuizGradebook columns={columns} students={students} courseId={courseId} courseName={courseName} href={href} query={studentQuery} onQueryChange={studentQuery=>onOptionsChange({...options,studentQuery})} filter={studentFilter} onFilterChange={studentFilter=>onOptionsChange({...options,studentFilter})} display={display} onDisplayChange={display=>onOptionsChange({...options,display})} onDownload={download} loading={loading} hasError={!!error} position={position} onRememberPosition={onRememberPosition}/>:results?<QuizInsights assignments={columns} targets={results.targets} courseId={courseId}/>:null}
  </section>
}
