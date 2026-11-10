'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { BinderSource } from '@/lib/binder-reading'
import { studentQuiz, type Quiz, type QuizAnswers, type QuizTarget } from '@/lib/quizzes/types'
import { QuestionInput, QuestionPrompt, answerComplete } from './shared'
import QuizContent from './QuizContent'
import QuizHeader from './QuizHeader'
import CognitiveProfile from '@/components/admin/CognitiveProfile'
import BinderWorkLayout from '@/components/readings/BinderWorkLayout'
import BinderQuizQuestions from './BinderQuizQuestions'
import BinderQuizPrint from './BinderQuizPrint'
import s from './Quiz.module.css'

type Props = {
  quiz: Quiz
  targets?: readonly QuizTarget[]
  binderReading?: BinderSource | null
} & ({ onClose: () => void; backHref?: never } | { backHref: string; onClose?: never })

export default function QuizPreview({ quiz, targets, onClose, backHref, binderReading }: Props) {
  const q = studentQuiz(quiz)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const change = (id: string, value: QuizAnswers[string]) => setAnswers(current => ({ ...current, [id]: value }))
  const question = q.questions[index]
  return <div className={s.app}>
    <div className={`${s.row} ${s.toolbar}`}>
      <p className={s.previewTag}>Teacher preview · answers are not saved or graded</p>
      {onClose ? <button className={s.secondary} onClick={onClose}>Back to quiz editor</button>
        : <Link href={backHref} className={s.secondary}>Back to assignment</Link>}
    </div>
    <QuizHeader quiz={q} targets={targets} eyebrow="STUDENT VIEW"><QuizContent content={q.instructions} questionEmphasis/>{binderReading && <BinderQuizPrint source={binderReading} quiz={q}/>}</QuizHeader>
    <CognitiveProfile demands={quiz.questions.map(q => q.demand)}/>
    <BinderWorkLayout source={binderReading}>
      {binderReading ? <BinderQuizQuestions questions={q.questions} answers={answers} onChange={change}/> : <>
        <nav className={`${s.questionNav} mb-4`} aria-label="Quiz questions">{q.questions.map((q, i) =>
          <button key={q.id} aria-current={i === index ? 'step' : undefined} data-complete={answerComplete(q, answers)} onClick={() => setIndex(i)}>{i + 1}</button>
        )}</nav>
        {question && <section className={`${s.card} ${s.stack}`}>
          <QuestionPrompt question={question} index={index}/>
          <QuestionInput question={question} value={answers[question.id]} onChange={value => change(question.id, value)}/>
        </section>}
      </>}
    </BinderWorkLayout>
    <p className={s.foot}>Students can revisit answers, save, and review before submitting. Answer guides and correct choices are hidden until a grade is returned.</p>
  </div>
}
