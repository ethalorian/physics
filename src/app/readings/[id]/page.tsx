import EnrollmentGate from '@/components/EnrollmentGate'
import ReadingStudentWork from '@/components/readings/ReadingStudentWork'
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <EnrollmentGate><ReadingStudentWork id={id} /></EnrollmentGate> }
