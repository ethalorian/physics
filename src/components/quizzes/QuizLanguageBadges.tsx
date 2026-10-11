import type {Quiz} from '@/lib/quizzes/types'
import {quizLanguageLabel} from '@/lib/quizzes/language'
import s from './Quiz.module.css'

export default function QuizLanguageBadges({quiz}: {quiz: Pick<Quiz, 'language_level' | 'sei_supports'>}) {
  return <div className={`${s.actions} my-3`} aria-label="Quiz language settings">
    <span className={s.badge}>{quizLanguageLabel(quiz)}</span>
    {quiz.sei_supports != null && <span className={s.badge}>{quiz.sei_supports ? 'SEI supports' : 'SEI off'}</span>}
  </div>
}
