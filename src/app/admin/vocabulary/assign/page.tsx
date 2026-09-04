"use client"
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/permissions'
import VocabAssignBoard from '@/components/vocabulary/VocabAssignBoard'

// Assign vocabulary sets to a class and read word-by-word competency (with vs. without SEI supports).
export default function VocabularyAssignPage() {
  const { data: session, status } = useSession()
  if (status === 'loading') return <div className="container mx-auto px-4 py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
  const role = getUserRole(session?.user?.email)
  if (role !== 'admin' && role !== 'teacher') redirect('/home')
  return <VocabAssignBoard />
}
