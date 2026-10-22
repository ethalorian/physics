'use client'
import {useState} from 'react'
import Link from 'next/link'
import {useSession} from 'next-auth/react'
import {assignmentBySlug} from '@/lib/interactive-assignments/catalog'
import {emptyVelocityState} from '@/lib/interactive-assignments/velocity'
import {canvasSchema} from '@/lib/interactive-assignments/canvas-observations'
import AssignmentWorkspace from '@/components/interactive-assignments/AssignmentWorkspace'
import AssignmentSimulation from '@/components/interactive-assignments/AssignmentSimulation'
import LessonActivity from '@/components/interactive-assignments/LessonActivity'
import InvestigationLab from './investigations/InvestigationLab'
import RaceTrackLab from './race-track/RaceTrackLab'
import CanvasExperimentLoader from './lab/CanvasExperimentLoader'
import {useSimEmbedded} from './embed-context'
import s from '@/components/interactive-assignments/assignment.module.css'

/** Public practice and official assigned work use the same questions and models.
 * Official saving/submission stays behind the existing assignment UUID route. */
export default function SimulationActivity({id}:{id:string}){
 const embedded=useSimEmbedded(),{data:session}=useSession()
 const [state,setState]=useState(emptyVelocityState)
 const lesson=assignmentBySlug('simulation-'+id)
 if(!lesson)return <p role="alert">This investigation is unavailable.</p>
 if(embedded)return canvasSchema(id)?<CanvasExperimentLoader id={id}/>:id==='race-track'?<RaceTrackLab/>:<InvestigationLab id={id}/>
 const staff=session?.user?.role==='admin'||session?.user?.role==='teacher'
 const answered=lesson.questions.filter(q=>state.answers[q.id]?.trim()).length
 return <main className={`${s.page} ${s.assignmentPage}`}>
  <header className={s.bar}><Link href="/simulations">← Simulation library</Link><span>{lesson.unit.replace('unit-','Unit ')} · Interactive investigation</span><b>{answered} / {lesson.questions.length} answered</b></header>
  <div className={s.intro}><p className={s.eyebrow}>Explore · Investigate · Explain</p><h1>{lesson.title}</h1><p>Predict in Work. Test your ideas in Explore. Compare observations, defend your reasoning, and design a new investigation.</p><p className={s.statusBadge} data-tone="preview">{staff?'Teacher preview · sample student · practice stays in this visit':'Practice · answers and observations stay in this visit'}</p><Link href={staff?`/admin/interactive-assignments?activity=${lesson.slug}&plan=1`:'/home'}>{staff?'Assign this investigation to a class →':'Open my assigned work to save and submit →'}</Link></div>
  <AssignmentWorkspace key={id} sampleStudent={staff} lesson={lesson} answers={state.answers} submitted={false} renderTool={visible=><AssignmentSimulation lesson={lesson} state={state} onChange={setState} readOnly={false} visible={visible}/>}>
   <LessonActivity lesson={lesson} state={state} onChange={setState}/>
   <section id="assignment-submit" tabIndex={-1} className={s.submit}><h2>Review your investigation</h2><p>{answered} of {lesson.questions.length} responses entered. Practice does not submit work or change a rating. To save work for your teacher, open the assignment from your home page.</p><Link href="/home">Open my assignments →</Link></section>
  </AssignmentWorkspace>
 </main>
}
