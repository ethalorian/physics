"use client"
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import VocabLearningBoard from '@/components/vocabulary/VocabLearningBoard'

export default function VocabularyTasksPage() {
  const { status } = useSession()
  const { userRole } = usePermissions()
  if (status === 'loading') return <p className="p-6" role="status">Loading vocabulary tasks…</p>
  if (userRole !== 'admin' && userRole !== 'teacher') redirect('/home')
  return <VocabLearningBoard />
}
