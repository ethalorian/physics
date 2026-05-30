import { redirect } from 'next/navigation'

// Redirect to main vocabulary letter-catch game - no need for duplicate admin version
export default function AdminLetterCatchRedirect() {
  redirect('/vocabulary/letter-catch')
}
