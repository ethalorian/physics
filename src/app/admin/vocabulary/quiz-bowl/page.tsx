import { redirect } from 'next/navigation'

// Redirect to main vocabulary quiz-bowl game - no need for duplicate admin version
export default function AdminQuizBowlRedirect() {
  redirect('/vocabulary/quiz-bowl')
}
