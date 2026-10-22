import EnrollmentGate from '@/components/EnrollmentGate'
import ReadingStudentWork from '@/components/readings/ReadingStudentWork'
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ reader?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  return <EnrollmentGate><ReadingStudentWork id={id} initialInteractive={query.reader !== 'pdf'} /></EnrollmentGate>
}
