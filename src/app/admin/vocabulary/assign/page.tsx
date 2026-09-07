"use client"
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import VocabLearningBoard from '@/components/vocabulary/VocabLearningBoard'
import VocabAssignBoard from '@/components/vocabulary/VocabAssignBoard'

// Assign vocabulary sets to a class and read word-by-word competency (with vs. without SEI supports).
export default function VocabularyAssignPage() {
  const { status } = useSession()
  const {userRole:role} = usePermissions()
  if (status === 'loading') return <div className="container mx-auto px-4 py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
  if (role !== 'admin' && role !== 'teacher') redirect('/home')
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'legacy' ? <VocabAssignBoard /> : <VocabLearningBoard initialView="assign" />
}
