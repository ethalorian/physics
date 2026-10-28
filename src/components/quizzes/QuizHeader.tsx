import type {ReactNode} from 'react'
import type {Quiz, QuizTarget} from '@/lib/quizzes/types'
import {quizHeaderTopic} from '@/lib/quizzes/header-theme'
import { sourcePresentation, type AssignmentSource } from '@/lib/assignment-source-presentation'
import s from './QuizHeader.module.css'

export default function QuizHeader({quiz, targets, eyebrow, children, assignmentSource}: {
  quiz: Pick<Quiz, 'title' | 'questions'>
  targets?: readonly QuizTarget[]
  eyebrow: string
  children?: ReactNode
  assignmentSource?: AssignmentSource
}) {
  const topic = quizHeaderTopic(quiz, targets)
  const presentation = assignmentSource ? sourcePresentation(assignmentSource) : null
  return <header className={s.header} data-quiz-topic={topic}>
    <div className={s.texture} aria-hidden="true" />
    <div className={s.content}>
      <p className={s.eyebrow}>{eyebrow}</p>
      {presentation && <p>{presentation.label}{presentation.day ? ` · Course day ${presentation.day}` : ''}</p>}
      <h1>{presentation?.title || quiz.title || 'Your quiz title'}</h1>
      {presentation && <p>{presentation.thinking}</p>}
      <div className={s.details}>{children}</div>
    </div>
  </header>
}
