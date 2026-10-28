import StudentProgress from '@/components/student/StudentProgress'
import StudentDashboard from '../StudentDashboard'

export default async function StudentGradebookPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const value = (key: string) => typeof params[key] === 'string' ? params[key] as string : undefined
  return <StudentDashboard key={JSON.stringify(params)} classId={value('class')} studentId={value('student')} initialTerm={value('term')}><StudentProgress mode="gradebook" initialKind={value('kind')} initialStatus={value('status')} initialTab={value('tab')} initialWork={value('work')}/></StudentDashboard>
}
