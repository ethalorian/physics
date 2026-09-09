import { lessonAuthoringData } from '@/lib/lesson-authoring'
import LessonBlockBuilder from '@/components/admin/LessonBlockBuilder'
import LessonVocabEditor from '@/components/admin/LessonVocabEditor'
export default async function LessonBuildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await lessonAuthoringData(id)
  return <div className="mx-auto max-w-7xl"><LessonBlockBuilder lessonId={id} lessonTitle={d.lesson.title} lessonSlug={d.lesson.slug} initial={d.lesson.content_blocks ?? undefined} unitId={d.lesson.unit_id} day={d.lesson.lesson_number} published={d.lesson.published} targets={d.targets} previewDocument={d.document ?? undefined} glossary={d.terms} rewardMaps={d.rewardMaps} /><div className="p-5"><LessonVocabEditor lessonId={id} /></div></div>
}
