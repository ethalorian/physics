import { Suspense } from 'react'
import ProjectorConnection from '@/components/present/ProjectorConnection'
export default async function ProjectorPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const { session } = await searchParams
  return session ? <Suspense fallback={<p>Connecting…</p>}><ProjectorConnection sessionId={session} /></Suspense> : <p className="p-6">Open the projector link from your iPad Command Center.</p>
}
