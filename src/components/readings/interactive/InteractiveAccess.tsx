'use client'
import { signIn, useSession } from 'next-auth/react'
import type { ReactNode } from 'react'
import EnrollmentGate from '@/components/EnrollmentGate'
import { Button } from '@/components/ui/button'
export default function InteractiveAccess({ children }: { children: ReactNode }) {
  const { status } = useSession()
  if (status === 'loading') return <p className="p-6" role="status">Loading your reading space…</p>
  if (status === 'unauthenticated') return <div className="max-w-xl mx-auto p-6 space-y-4"><h1 className="text-title-1">Your connected textbook</h1><p>Sign in with your classroom account to read, explore, and open your assignments.</p><Button onClick={() => void signIn()}>Sign in to read</Button></div>
  return <EnrollmentGate>{children}</EnrollmentGate>
}
