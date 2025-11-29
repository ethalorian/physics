import { redirect } from 'next/navigation'

// Redirect to main vocabulary concentration game - no need for duplicate admin version
export default function AdminConcentrationRedirect() {
  redirect('/vocabulary/concentration')
}
