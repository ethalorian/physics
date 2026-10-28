'use client'
import Link from 'next/link'
import { studentLabTotal, studentTransferTotal, studentDueLabel } from '@/lib/student-gradebook'
import { TRANSFER_BRIEF_RUBRIC_VERSION } from '@/lib/interactive-assignments/graded-assignment'
import { FOUR_DIMENSION_LAB_VERSION } from '@/lib/interactive-assignments/lab-rubric'
import { GradeBadge } from '@/components/admin/results/GradeDisplay'
import LabGradeDetails from '@/components/interactive-assignments/LabGradeDetails'
import { useStudentProgress } from './StudentProgressContext'
import s from './StudentProgress.module.css'

export default function StudentLabHistory({category='labs'}:{category?:'labs'|'transfer'}) {
  const transfer=category==='transfer',label=transfer?'Transfer Task':'Lab',version=transfer?TRANSFER_BRIEF_RUBRIC_VERSION:FOUR_DIMENSION_LAB_VERSION
  const {data,termId} = useStudentProgress()
  const source=transfer?data?.transferEntries:data?.labEntries
  const entries=(source??[]).filter(e=>termId==='all'||(termId==='unassigned'?!e.termId:e.termId===termId))
  const total=(transfer?studentTransferTotal:studentLabTotal)(entries,termId)
  const unavailable=!source||data?.warnings.some(w=>['Grading terms','Interactive lessons and simulations','Student choices'].includes(w.source))
  return <section aria-label={`${label} grade history`}><header className={s.sectionHead}><h3>{label} average</h3><GradeBadge percent={unavailable?null:total.percent}/></header>
    <p className={s.note}>{unavailable?`${label} grades could not fully load. Refresh to try again.`:transfer?`${total.counted.length} Transfer Briefs. Only the latest released attempt for each brief counts; earlier attempts remain below.`:`${total.counted.length} released rubric entries. Originals and released revisions each count once. A corrected grade replaces that entry’s score.`}</p>
    <p className={s.note}>The lowest rubric dimension sets each grade. Only grades from the four-dimension rubric enter this average. Mastery is assessed separately.</p>
    {entries.map(e=><article className={s.feedback} key={e.submissionId}><header className={s.sectionHead}><h4>{e.title} · Entry {e.attempt}</h4><GradeBadge percent={e.percent} letter={e.letter}/></header><p>Submitted {studentDueLabel(e.submittedAt)} · Released {studentDueLabel(e.releasedAt)}</p>{e.rubricVersion!==version&&<p>Earlier question-point grade · Preserved in history, excluded from the rubric average</p>}<p>{e.feedback}</p><LabGradeDetails grade={{rubric_version:e.rubricVersion,items:e.items}}/><Link href={e.href}>Open assignment</Link></article>)}
    {!unavailable&&!entries.length&&<p className={s.empty}>No released {label} grades in this term.</p>}
  </section>
}
