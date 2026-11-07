import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import EnrollmentGate from '@/components/EnrollmentGate'
import StudentChoiceWork from '@/components/student-choice/StudentChoiceWork'
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await auth())?.user) redirect('/auth/signin?callbackUrl=' + encodeURIComponent('/student-choice/' + id))
  return <EnrollmentGate><StudentChoiceWork id={id} /></EnrollmentGate>
}
