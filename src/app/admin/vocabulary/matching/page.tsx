import { redirect } from 'next/navigation'

// Redirect to main vocabulary matching game - no need for duplicate admin version
export default function AdminMatchingRedirect() {
  redirect('/vocabulary/matching')
}
