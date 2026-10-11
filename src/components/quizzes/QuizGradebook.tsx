'use client'
import {useEffect,useRef} from 'react'
import Link from 'next/link'
import {Download,Search} from 'lucide-react'
import type {AssessmentComparison} from '@/lib/quizzes/comparison'
import {average} from '@/lib/quizzes/comparison'
import {resultGrade,resultPercent,type ResultStudent} from '@/lib/quizzes/insights'
import g from './QuizGradebook.module.css'

export interface GradebookStudent {course_id:string;student_id:string;name:string;cells:Map<string,ResultStudent>}
export interface GradebookPosition {left:number;top:number}
interface Props {
  columns:AssessmentComparison[];students:GradebookStudent[];courseId:string;
  courseName:(id:string)=>string;href:(id:string,courseId?:string)=>string;
  query:string;onQueryChange:(value:string)=>void;filter:string;onFilterChange:(value:string)=>void;
  display:'grade'|'points';onDisplayChange:(value:'grade'|'points')=>void;
  onDownload:()=>void;loading:boolean;hasError:boolean;
  position?:GradebookPosition;onRememberPosition:(position:GradebookPosition)=>void;
}
export function gradebookCellText(cell:ResultStudent,display:'grade'|'points') {
  return display==='points'&&cell.percent!==null?`${cell.earned}/${cell.possible}`:resultGrade(cell)
}
const shortDate=(date:string|null)=>date?new Date(date).toLocaleDateString(undefined,{month:'short',day:'numeric'}):'No due date'

export default function QuizGradebook({columns,students,courseId,courseName,href,query,onQueryChange,filter,onFilterChange,display,onDisplayChange,onDownload,loading,hasError,position,onRememberPosition}:Props) {
  const scroll=useRef<HTMLDivElement>(null)
  useEffect(()=>{if(scroll.current&&position){scroll.current.scrollLeft=position.left;scroll.current.scrollTop=position.top}},[position,columns.length])
  const remember=()=>{if(scroll.current)onRememberPosition({left:scroll.current.scrollLeft,top:scroll.current.scrollTop})}
  return <section className={g.sheet} aria-label="Quiz gradebook">
    <div className={g.toolbar}>
      <label className={g.search}><Search size={16} aria-hidden="true"/><span className="sr-only">Find a student</span><input type="search" placeholder="Find a student…" value={query} onChange={e=>onQueryChange(e.target.value)}/></label>
      <label className={g.workFilter}><span className="sr-only">Student work</span><select value={filter} onChange={e=>onFilterChange(e.target.value)}><option value="all">All students</option><option value="review">Needs review</option><option value="unfinished">Unfinished work</option></select></label>
      <div className={g.display} role="group" aria-label="Grade display"><button type="button" aria-pressed={display==='grade'} onClick={()=>onDisplayChange('grade')}>Grades</button><button type="button" aria-pressed={display==='points'} onClick={()=>onDisplayChange('points')}>Points</button></div>
      <button type="button" className={g.export} disabled={!students.length||!columns.length||hasError} onClick={onDownload}><Download size={15} aria-hidden="true"/>Export</button>
    </div>
    {!columns.length?<p className={g.empty} role="status">{loading?'Loading gradebook…':'No assigned quizzes match these filters. Drafts do not have grades.'}</p>:<div ref={scroll} className={g.scroll} tabIndex={0} role="region" aria-label="Scrollable quiz gradebook">
      <table className={g.table}>
        <caption className="sr-only">Students down the left, quizzes across the top. Select a grade or status to open the student’s review. Class averages use scored work only.</caption>
        <colgroup><col className={g.nameColumn}/>{columns.map(a=><col className={g.quizColumn} key={a.id}/>)}</colgroup>
        <thead><tr><th scope="col" className={g.studentHeading}><span>Student</span><small>{students.length} {students.length===1?'student':'students'} · {columns.length} {columns.length===1?'quiz':'quizzes'}</small></th>{columns.map(a=>{
          const scored=a.students.flatMap(st=>st.percent===null?[]:[st.percent])
          return <th scope="col" key={a.id}>
            <Link className={g.quizTitle} href={href(a.id,courseId)} onClick={remember} title={a.title}>{a.title}</Link>
            <small>{shortDate(a.due_at)} · {a.possible} pts{!courseId?` · ${courseName(a.copies[0].course_id)}`:''}</small>
            <div className={g.columnSummary}><span title="Class average of scored work">Avg <strong>{resultPercent(average(scored))}</strong></span><span title="Scored students out of assigned students">{scored.length}/{a.students.length} graded</span></div>
          </th>
        })}</tr></thead>
        <tbody>{students.map((st,index)=><tr key={`${st.course_id}:${st.student_id}`}>
          <th scope="row"><div className={g.student}><span className={g.rowNumber} aria-hidden="true">{index+1}</span><span>{st.name}{!courseId&&<small>{courseName(st.course_id)}</small>}</span></div></th>
          {columns.map(a=>{const cell=st.cells.get(a.id);return <td key={a.id} data-state={cell?.state??'unassigned'}>{cell?<Link className={g.cell} href={`${href(a.id,courseId)}&student=${encodeURIComponent(st.student_id)}`} onClick={remember} aria-label={`${st.name}, ${a.title}: ${gradebookCellText(cell,display)}`} title={`${st.name} · ${a.title}\n${resultGrade(cell)}${cell.percent!==null?` · ${cell.earned}/${cell.possible} points`:''}\nOpen student review`}>
            {cell.state==='graded'?<strong className={g.score}>{gradebookCellText(cell,display)}</strong>:<span className={g.status}>{cell.state==='submitted'?'Review':cell.state==='returned'?'Revise':cell.state==='in_progress'?'Working':'Not started'}</span>}
          </Link>:<span className={g.unassigned} aria-label="Not assigned" title="Not assigned">—</span>}</td>})}
        </tr>)}</tbody>
      </table>
      {!students.length&&<p className={g.empty}>No students match this view.</p>}
    </div>}
    <footer className={g.footer}><p>Click a cell to review. Missing work is never a zero.</p><div className={g.legend} aria-label="Gradebook status legend"><span data-state="submitted">Review</span><span data-state="returned">Revise</span><span data-state="in_progress">Working</span><span>— Not assigned</span></div></footer>
  </section>
}
