import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getEffectiveContext } from '@/lib/effective-context'
import AnalyticsWorkspace from '@/components/analytics/AnalyticsWorkspace'
import { Spinner } from '@/components/ui/spinner'

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user?.email) redirect('/api/auth/signin?callbackUrl=%2Fadmin%2Fanalytics')
  const context = await getEffectiveContext(session.user.email)
  if (context.role !== 'admin' && context.role !== 'observer') redirect('/home')
  return <Suspense fallback={<div className="flex min-h-72 items-center justify-center"><Spinner aria-label="Loading analytics workspace" /></div>}><AnalyticsWorkspace /></Suspense>
}
