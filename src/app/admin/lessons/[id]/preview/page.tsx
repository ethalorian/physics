import { lessonAuthoringData } from '@/lib/lesson-authoring'
import AdminLessonPreview from '@/components/admin/AdminLessonPreview'
export default async function LessonPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await lessonAuthoringData(id, false)
  return <AdminLessonPreview canEdit={d.canEdit} lesson={{ id, targets:d.targets, title:d.lesson.title, slug:d.lesson.slug, unit:d.lesson.unit, unit_id:d.lesson.unit_id, lesson_number:d.lesson.lesson_number, published:d.lesson.published, estimated_time:d.lesson.estimated_time, hero_image:d.lesson.hero_image, key_terms:d.terms, content_blocks:d.document ?? undefined }} />
}
