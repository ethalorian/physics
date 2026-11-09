import InteractiveAccess from '@/components/readings/interactive/InteractiveAccess'
import ReadingSyllabusPreview from '@/components/readings/ReadingSyllabusPreview'

export default async function Page({ searchParams }: { searchParams: Promise<{ course_id?: string; step_id?: string; activity?: string }> }) {
  const query = await searchParams
  const activity = query.activity === 'check' || query.activity === 'vocabulary' ? query.activity : 'reading'
  return <InteractiveAccess><ReadingSyllabusPreview activity={activity} courseId={typeof query.course_id === 'string' ? query.course_id : ''} stepId={typeof query.step_id === 'string' ? query.step_id : ''} /></InteractiveAccess>
}
