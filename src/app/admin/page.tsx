import { redirect } from 'next/navigation'

export default function AdminRedirect() {
  // Redirect /admin to /admin/dashboard to avoid confusion
  redirect('/admin/dashboard')
}
