"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getUserRole, type UserRole } from '@/lib/permissions'
import { readViewAsCookie } from '@/lib/view-as-shared'

// Effective role for the client UI. An admin "viewing as teacher" renders as a
// teacher (admin chrome hidden). Mirrors the server's effective-context.
export function useViewAs(): { role: UserRole; realRole: UserRole; viewingAs: boolean; teacherEmail: string | null } {
  const { data: session } = useSession()
  const realRole = getUserRole(session?.user?.email)
  const [teacherEmail, setTeacherEmail] = useState<string | null>(null)

  useEffect(() => { setTeacherEmail(readViewAsCookie()) }, [])

  const viewingAs = realRole === 'admin' && Boolean(teacherEmail)
  const role: UserRole = viewingAs ? 'teacher' : realRole
  return { role, realRole, viewingAs, teacherEmail }
}
