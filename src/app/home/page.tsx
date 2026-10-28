import StudentDashboard from './StudentDashboard'

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const value = (key: string) => typeof params[key] === 'string' ? params[key] as string : undefined
  return <StudentDashboard key={JSON.stringify(params)} classId={value('class')} studentId={value('student')} initialTerm={value('term')}/>
}
