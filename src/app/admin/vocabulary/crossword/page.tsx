import { redirect } from 'next/navigation'

// Redirect to main vocabulary crossword game - no need for duplicate admin version
export default function AdminCrosswordRedirect() {
  redirect('/vocabulary/crossword')
}
