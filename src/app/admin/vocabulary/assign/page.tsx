"use client"
import { Spinner } from '@/components/ui/spinner'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import VocabLearningBoard from '@/components/vocabulary/VocabLearningBoard'

// Assign vocabulary sets to a class and read word-by-word competency (with vs. without SEI supports).
export default function VocabularyAssignPage() {
  const { status } = useSession()
  const {userRole:role} = usePermissions()
  if (status === 'loading') return <div className="container mx-auto px-4 py-8"><Spinner size="md" className="mx-auto text-primary" /></div>
  if (role !== 'admin' && role !== 'teacher') redirect('/home')
  return <VocabLearningBoard initialView="assign" />
}
