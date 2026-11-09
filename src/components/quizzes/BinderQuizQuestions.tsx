import type { QuizAnswers, QuizQuestion } from '@/lib/quizzes/types'
import { QuestionPrompt, WrittenResponse } from '@/components/interactive-assignments/QuestionResponse'
import { QuestionInput, QuestionPrompt as QuizPrompt } from './shared'
import s from './Quiz.module.css'

export default function BinderQuizQuestions({ questions, answers, onChange, disabled }: {
  questions: QuizQuestion[]
  answers: QuizAnswers
  onChange: (id: string, value: QuizAnswers[string]) => void
  disabled?: boolean
}) {
  return <>{questions.map((q, i) => <section id={'check-' + q.id} tabIndex={-1} key={q.id} className={`${s.card} ${s.stack}`}>
    {q.kind === 'written' && !q.mcas_id ? <>
      <div className={s.row}><h2>Question {i + 1}</h2><span className={s.muted}>{q.points} {q.points === 1 ? 'point' : 'points'}</span></div>
      <QuestionPrompt>{q.prompt}</QuestionPrompt>
      <WrittenResponse label={`Your reasoning · question ${i + 1}`} maxLength={10000}
        value={typeof answers[q.id] === 'string' ? String(answers[q.id]) : ''} disabled={disabled}
        onChange={value => onChange(q.id, value)}/>
    </> : <>
      <QuizPrompt question={q} index={i}/>
      <QuestionInput question={q} value={answers[q.id]} disabled={disabled} onChange={value => onChange(q.id, value)}/>
    </>}
  </section>)}</>
}
