import { redirect } from 'next/navigation'

export default function AdminRedirect() {
  // One admin home now. /admin lands on the merged command center; the authoring
  // hub ("Manage") lives at /admin/dashboard and is reachable from the sidebar.
  redirect('/admin/home')
}
