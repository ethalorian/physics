import { lessonAuthoringData } from '@/lib/lesson-authoring'
import AdminLessonEditor from '@/components/admin/AdminLessonEditor'
export default async function LessonEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await lessonAuthoringData(id)
  return <AdminLessonEditor lesson={d.lesson} targetCount={d.targetIds.length} targets={d.targets.filter(t => d.targetIds.includes(t.id))} units={d.units} canPublish={d.canPublish} />
}
