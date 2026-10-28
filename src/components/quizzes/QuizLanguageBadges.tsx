import type {Quiz} from '@/lib/quizzes/types'
import s from './Quiz.module.css'

export default function QuizLanguageBadges({quiz}: {quiz: Pick<Quiz, 'language_level' | 'sei_supports'>}) {
  if (quiz.sei_supports == null) return null
  return <div className={`${s.actions} my-3`} aria-label="Quiz supports">
    <span className={s.badge}>{quiz.sei_supports ? 'SEI supports' : 'SEI off'}</span>
  </div>
}
