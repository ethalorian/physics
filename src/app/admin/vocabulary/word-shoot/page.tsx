import { redirect } from 'next/navigation'

// Redirect to main vocabulary word-shoot game - no need for duplicate admin version
export default function AdminWordShootRedirect() {
  redirect('/vocabulary/word-shoot')
}
