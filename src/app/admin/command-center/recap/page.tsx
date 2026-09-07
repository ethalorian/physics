import TeachingRecap from '@/components/present/TeachingRecap'
export default async function RecapPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const { session } = await searchParams
  return session ? <TeachingRecap sessionId={session} /> : <p className="p-6">Choose a session recap in the Command Center.</p>
}
