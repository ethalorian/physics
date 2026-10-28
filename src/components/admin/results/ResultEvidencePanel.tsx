'use client'

import Link from 'next/link'
import { studentLessonHref } from '@/lib/teaching-navigation'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { sourcePresentation } from '@/lib/assignment-source-presentation'
import { type ResultActivity, type ResultStudent } from '@/lib/assessment-results/types'
import { confirmAssessmentReviewLeave } from '../useAssessmentReviewGuard'
import s from './ResultsGradebook.module.css'
import SubmissionSuggestions from './SubmissionSuggestions'

const ChoiceReview = dynamic(() => import('./ChoiceResultReview'))
const VocabularyReview = dynamic(() => import('../VocabControlRoom'))
const MissionReview = dynamic(() => import('@/components/math-missions/TeacherMissions'))
const MathReview = dynamic(() => import('@/components/math-spine/MathControlRoom'))
export type LessonEvidenceReview = (student: string, target: string, context?: { unitId?: string; lessonId?: string; submissionId?: string | null }) => void

export default function ResultEvidencePanel({ activity, students, studentId, submissionId, classId, unitId, targets, onClose, onSaved, onReviewLesson }: {
  activity: ResultActivity; students: ResultStudent[]; studentId?: string; submissionId?:string; classId: string; unitId: string;
  targets: { id: string; statement: string }[]; onClose: () => void; onSaved: () => void; onReviewLesson: LessonEvidenceReview;
}) {
  const [mathView, setMathView] = useState<'warmups' | 'missions'>('warmups')
  const roster = students.filter(st => activity.cells[st.id])
  const [selected, setSelected] = useState(studentId ?? roster.find(st => activity.cells[st.id]?.needsReview)?.id ?? roster[0]?.id ?? '')
  const student = roster.find(st => st.id === selected), cell = activity.cells[selected]
  const close = () => { if (confirmAssessmentReviewLeave()) onClose() }
  return <Dialog.Root open onOpenChange={open => { if (!open) close() }}><Dialog.Portal>
    <Dialog.Overlay className={s.scrim} />
    <Dialog.Content className={s.evidencePanel} onPointerDownOutside={e => e.preventDefault()}>
      <header className={s.panelHeader}><div><small>{sourcePresentation(activity).label}{sourcePresentation(activity).day ? ` · Course day ${sourcePresentation(activity).day}` : ''} · {activity.crossUnit ? 'Year-long evidence' : 'Assignment evidence'}</small><Dialog.Title>{sourcePresentation(activity).title}</Dialog.Title><p>{sourcePresentation(activity).thinking}</p><Dialog.Description>Review student evidence here. Your saved decisions update this gradebook and mastery.</Dialog.Description></div><button onClick={close} aria-label="Close evidence"><X size={20} /></button></header>
      <div className={s.panelStudent}><label>Student<select value={selected} onChange={e => { if (confirmAssessmentReviewLeave()) setSelected(e.target.value) }}>{roster.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}</select></label>{cell && <div><strong>{cell.label}</strong><p>{cell.detail}</p></div>}</div>
      <div className={s.panelBody}>
        {!student ? <p>No assigned students in the current roster.</p> : activity.kind === 'choice' ? <ChoiceReview activity={activity} studentId={selected} classId={classId} targets={targets} onSaved={onSaved} onReviewLesson={(...args)=>{onClose();onReviewLesson(...args)}}/> : activity.kind === 'vocabulary' ? <VocabularyReview key={activity.key + selected} classId={classId} unitId={activity.unitIds[0] ?? unitId} teacher="" nameFilter="" initialTaskId={activity.sourceId} initialStudentId={selected} detailOnly onSaved={onSaved} /> : activity.kind === 'math' ? <><div className={s.toolbar}><button aria-pressed={mathView === 'warmups'} onClick={() => { if (confirmAssessmentReviewLeave()) setMathView('warmups') }}>Warm-ups & ratings</button><button aria-pressed={mathView === 'missions'} onClick={() => { if (confirmAssessmentReviewLeave()) setMathView('missions') }}>Mission results</button></div>{mathView === 'missions' ? <MissionReview key={activity.key + selected} initialStudentId={selected} initialCode={activity.code} studentName={student.name} embedded onSaved={onSaved} /> : <MathReview key={activity.key + selected} classId={classId} initialStudentId={selected} initialSubmissionId={selected===studentId?submissionId:undefined} competencyId={activity.sourceId} embedded onClose={close} onSaved={onSaved} />}</> : <section className={s.videoEvidence}>
          {cell?.submissionId && <SubmissionSuggestions source={activity.kind==='presentation'?'presentation':'lesson'} id={cell.submissionId}/>}
          {activity.kind!=='presentation' && <Link className="inline-flex min-h-11 items-center font-medium text-primary underline" href={studentLessonHref(classId, selected, activity.sourceId, activity.unitIds[0] ?? unitId)}>View student lesson →</Link>}
          <h3>{activity.kind !== 'video' ? 'Student work and reasoning' : 'Viewing and understanding'}</h3><p>{activity.kind !== 'video' ? 'Review the submitted work before recording target mastery.' : <><strong>{cell?.label}</strong> records unique viewing time. Understanding comes from the student’s saved answers and your target ratings.</>}</p>
          <p>{cell?.submissionId ? 'A submitted response is available.' : 'No submitted lesson response is recorded. Saved answers may still be available for review.'}</p>
          {(activity.targetIds ?? []).map(id => <article key={id}><div><strong>{targets.find(t => t.id === id)?.statement ?? 'Learning target'}</strong><p>{cell?.pendingTargets?.includes(id) ? 'Evidence awaits your review' : 'Inspect answers and rating history'}</p></div><button onClick={() => { onClose(); onReviewLesson(selected, id, { unitId: activity.unitIds[0], lessonId: activity.kind==='presentation'?'presentation:'+activity.sourceId:activity.sourceId, submissionId: activity.kind==='presentation'?null:cell?.submissionId }) }}>Review answers</button></article>)}
          {!activity.targetIds?.length && <p>This lesson needs a learning-target link before its answers can support mastery.</p>}
        </section>}
      </div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>
}
