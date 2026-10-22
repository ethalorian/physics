import Link from 'next/link'
import { lessonAuthoringData } from '@/lib/lesson-authoring'
import LessonAssignmentBuilder from '@/components/admin/LessonAssignmentBuilder'
import LessonEditorNav from '@/components/admin/LessonEditorNav'

export default async function LessonBuildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await lessonAuthoringData(id)
  if (d.lesson.content_blocks?.reflection) return <LessonAssignmentBuilder lesson={d.lesson} targets={d.targets} canPublish={d.canPublish}/>
  return <main className="mx-auto max-w-4xl space-y-5 p-5">
    <LessonEditorNav lessonId={id} title={d.lesson.title} unitId={d.lesson.unit_id} published={d.lesson.published} active="build"/>
    <h2 className="text-2xl font-semibold">The question block builder is retired</h2>
    <p>Existing assignments and submitted work remain available. Build new Physics work with the interactive assignment tools.</p>
    <div className="flex flex-wrap gap-3">
      <Link className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-primary-foreground" href="/admin/interactive-assignments/investigations">Interactive assignments · Bloom’s & DOK</Link>
      <Link className="inline-flex min-h-11 items-center rounded-lg border px-4" href="/admin/lessons/new?reflection=graphic-novel">Create a chapter response</Link>
      <Link className="inline-flex min-h-11 items-center rounded-lg border px-4" href={`/admin/lessons/${id}/edit`}>Existing lesson settings</Link>
    </div>
  </main>
}
