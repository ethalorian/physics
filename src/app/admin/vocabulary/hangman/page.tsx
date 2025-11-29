import { redirect } from 'next/navigation'

// Redirect to main vocabulary hangman game - no need for duplicate admin version
export default function AdminHangmanRedirect() {
  redirect('/vocabulary/hangman')
}
