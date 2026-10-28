import type { LessonAssignment } from '@/lib/interactive-assignments/catalog'
import type { VelocityState } from '@/lib/interactive-assignments/velocity'
import { WrittenResponse } from './QuestionResponse'
import s from './TransferBriefWorkspace.module.css'

const labels = ['Build the evidence', 'Make your recommendation', 'Check a model limitation']

/** Preserve canonical question IDs and native answer state for snapshots and grading. */
export default function TransferBriefResponses({ lesson, state, onChange, readOnly }: {
  lesson: LessonAssignment; state: VelocityState; onChange: (value: VelocityState) => void; readOnly: boolean
}) {
  return <section id="assignment-part-1" tabIndex={-1} aria-labelledby="assignment-part-title-1" className={s.responses}>
    <p className={s.kicker}>Your brief to the team</p><h2 id="assignment-part-title-1">One decision. Make the case.</h2>
    <p className={s.question}>{lesson.transferBrief?.question}</p>
    {lesson.questions.map((question, index) => <div key={question.id} className={s.response}>
      <WrittenResponse id={'answer-'+question.id} label={`${index + 1}. ${labels[index]}`} help={question.prompt} value={state.answers[question.id] ?? ''} disabled={readOnly} onChange={value => onChange({ ...state, answers: { ...state.answers, [question.id]: value } })}/>
    </div>)}
    <p className={s.note}>Three connected parts of one brief. Your teacher reviews your work before releasing grades, mastery and feedback.</p>
  </section>
}
