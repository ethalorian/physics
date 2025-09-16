"use client"
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/permissions'
import VocabularySetManager from '@/components/vocabulary/VocabularySetManager'

export default function VocabularyManagementPage() {
  const { data: session } = useSession()
  
  // Check if user has admin access
  const userRole = getUserRole(session?.user?.email)
  if (userRole !== 'admin' && userRole !== 'teacher') {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Vocabulary Management</h1>
        <p className="text-muted-foreground">
          Create and manage vocabulary sets for use in vocabulary games and assignments.
        </p>
      </div>

      <VocabularySetManager />
    </div>
  )
}
