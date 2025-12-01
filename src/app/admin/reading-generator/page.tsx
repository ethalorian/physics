import { auth } from '@/lib/auth'
import { getUserRole, hasPermission } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import ReadingLessonGenerator from '@/components/admin/ReadingLessonGenerator'

export const metadata = {
  title: 'Reading Lesson Generator | Physics Classroom',
  description: 'AI-powered reading lesson generator for physics education',
}

export default async function ReadingGeneratorPage() {
  const session = await auth()
  
  if (!session?.user?.email) {
    redirect('/auth/signin')
  }

  const userRole = getUserRole(session.user.email)
  const canAccess = userRole === 'admin' || userRole === 'teacher'

  if (!canAccess) {
    redirect('/')
  }

  return <ReadingLessonGenerator />
}

